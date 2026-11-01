const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const superAdminAuth = require("../middleware/superAdminAuth");
const SchoolAdmin = require("../models/schoolAdminSchema");
const Subscription = require("../models/Subscription");
const BillingInvoice = require("../models/BillingInvoice");
const PlatformSettings = require("../models/PlatformSettings");
const AuditLog = require("../models/AuditLog");
const mongooseErrors = { isDuplicateKey: (err) => err && err.code === 11000 };
const Student = require("../models/Student");
const { logAudit } = require("../utils/audit");
const {
  PLANS,
  DAY,
  getSettings,
  startOfTodayUTC,
  subscriptionStatus,
  countBillingStudents,
  quote,
  buildInvoice,
  applyPaidInvoice,
  toPublicInvoice,
  normalizeTxn,
} = require("../utils/billing");
const { parseImageDataUrl, saveImage, readAsDataUrl, removeFile } = require("../utils/privateFiles");

const QR_MAX_BYTES = 2 * 1024 * 1024;

// Settings returned to the Super Admin UI: file references stay on the server
const settingsView = (settings) => {
  const { paymentQrPath, paymentQrMime, ...rest } = settings;
  return { ...rest, hasQr: Boolean(paymentQrPath) };
};

router.use(superAdminAuth);

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const actorLabel = (req) => req.admin?.email || req.admin?.name || "Super Admin";
const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const pageParams = (req, max = 100) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), max);
  return { page, limit, skip: (page - 1) * limit };
};
const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};
const fail = (res, err) => res.status(500).json({ success: false, message: err.message });

const loadSchool = async (id, res) => {
  if (!isValidId(id)) {
    res.status(400).json({ success: false, message: "Invalid school id" });
    return null;
  }
  const school = await SchoolAdmin.findById(id).select("-password -refreshToken");
  if (!school) {
    res.status(404).json({ success: false, message: "School not found" });
    return null;
  }
  return school;
};

/* ==========================================================
   DASHBOARD (real aggregates only)
========================================================== */
router.get("/dashboard", async (req, res) => {
  try {
    const settings = await getSettings();
    const today = startOfTodayUTC();
    const warnUntil = new Date(today.getTime() + settings.expiryWarningDays * DAY);
    const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));

    const [
      totalSchools,
      activeSchools,
      subs,
      pendingInvoices,
      paidThisMonth,
      activeStudents,
      recentSchools,
      recentActivity,
    ] = await Promise.all([
      SchoolAdmin.countDocuments(),
      SchoolAdmin.countDocuments({ isActive: true }),
      Subscription.find().select("schoolId expiryDate").lean(),
      BillingInvoice.countDocuments({ status: "Pending" }),
      BillingInvoice.aggregate([
        { $match: { status: "Paid", paidAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Student.countDocuments({ status: "Active" }),
      SchoolAdmin.find().select("schoolName campusId isActive createdAt").sort({ createdAt: -1 }).limit(5).lean(),
      AuditLog.find().sort({ createdAt: -1 }).limit(8).lean(),
    ]);

    const counts = { active: 0, grace: 0, expired: 0, expiringSoon: 0 };
    subs.forEach((s) => {
      const status = subscriptionStatus(s, settings, today);
      if (status === "Active") {
        counts.active += 1;
        if (new Date(s.expiryDate) <= warnUntil) counts.expiringSoon += 1;
      } else if (status === "Grace") counts.grace += 1;
      else if (status === "Expired") counts.expired += 1;
    });

    res.json({
      success: true,
      data: {
        schools: {
          total: totalSchools,
          active: activeSchools,
          suspended: totalSchools - activeSchools,
        },
        subscriptions: {
          ...counts,
          withoutSubscription: Math.max(totalSchools - subs.length, 0),
          warningDays: settings.expiryWarningDays,
        },
        billing: {
          pendingPayments: pendingInvoices,
          overdueSchools: counts.expired,
          paidThisMonthAmount: paidThisMonth[0]?.total || 0,
          paidThisMonthCount: paidThisMonth[0]?.count || 0,
        },
        activeStudents,
        recentSchools,
        recentActivity,
      },
    });
  } catch (err) {
    fail(res, err);
  }
});

/* ==========================================================
   SUBSCRIPTIONS LIST (all schools)
========================================================== */
router.get("/subscriptions", async (req, res) => {
  try {
    const { search = "", status = "" } = req.query;
    const settings = await getSettings();
    const today = startOfTodayUTC();

    const schoolFilter = {};
    if (search.trim()) {
      const rx = new RegExp(escapeRegex(search.trim()), "i");
      schoolFilter.$or = [{ schoolName: rx }, { campusId: rx }, { email: rx }];
    }

    const [schools, subs, pending, paidTotals, studentCounts] = await Promise.all([
      SchoolAdmin.find(schoolFilter).select("schoolName campusId email isActive").sort({ schoolName: 1 }).lean(),
      Subscription.find()
        .select("schoolId plan startDate expiryDate studentLimit restrictStudentAdditions")
        .lean(),
      BillingInvoice.aggregate([
        { $match: { status: "Pending" } },
        { $group: { _id: "$schoolId", count: { $sum: 1 }, amount: { $sum: "$amount" } } },
      ]),
      BillingInvoice.aggregate([
        { $match: { status: "Paid" } },
        { $group: { _id: "$schoolId", total: { $sum: "$amount" }, last: { $max: "$paidAt" } } },
      ]),
      Student.aggregate([{ $match: { status: "Active" } }, { $group: { _id: "$schoolId", count: { $sum: 1 } } }]),
    ]);

    const subBySchool = new Map(subs.map((s) => [String(s.schoolId), s]));
    const pendingBySchool = new Map(pending.map((p) => [String(p._id), p]));
    const paidBySchool = new Map(paidTotals.map((p) => [String(p._id), p]));
    const studentsBySchool = new Map(studentCounts.map((p) => [String(p._id), p.count]));

    let rows = schools.map((school) => {
      const sub = subBySchool.get(String(school._id));
      const derived = subscriptionStatus(sub, settings, today);
      const daysLeft = sub?.expiryDate
        ? Math.round((new Date(sub.expiryDate).getTime() - today.getTime()) / DAY)
        : null;
      return {
        schoolId: school._id,
        schoolName: school.schoolName,
        campusId: school.campusId,
        isActive: school.isActive,
        plan: sub?.plan || null,
        startDate: sub?.startDate || null,
        expiryDate: sub?.expiryDate || null,
        daysLeft,
        status: derived,
        studentLimit: sub?.studentLimit || 0,
        restrictStudentAdditions: Boolean(sub?.restrictStudentAdditions),
        activeStudents: studentsBySchool.get(String(school._id)) || 0,
        pendingPayments: pendingBySchool.get(String(school._id))?.count || 0,
        pendingAmount: pendingBySchool.get(String(school._id))?.amount || 0,
        totalPaid: paidBySchool.get(String(school._id))?.total || 0,
        lastPaidAt: paidBySchool.get(String(school._id))?.last || null,
      };
    });

    if (status === "Pending") rows = rows.filter((r) => r.pendingPayments > 0);
    else if (status === "ExpiringSoon")
      rows = rows.filter((r) => r.status === "Active" && r.daysLeft <= settings.expiryWarningDays);
    else if (status) rows = rows.filter((r) => r.status === status);

    const total = rows.length;
    const { page, limit, skip } = pageParams(req, 200);
    const paged = req.query.page ? rows.slice(skip, skip + limit) : rows;

    res.json({
      success: true,
      data: paged,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
      settings: { expiryWarningDays: settings.expiryWarningDays },
    });
  } catch (err) {
    fail(res, err);
  }
});

/* ==========================================================
   ONE SCHOOL: SUBSCRIPTION + QUOTES + INVOICES
========================================================== */
router.get("/schools/:id/billing", async (req, res) => {
  try {
    const school = await loadSchool(req.params.id, res);
    if (!school) return;

    const settings = await getSettings();
    const [subscription, invoices, counts] = await Promise.all([
      Subscription.findOne({ schoolId: school._id }).lean(),
      BillingInvoice.find({ schoolId: school._id }).sort({ createdAt: -1 }).limit(200).lean(),
      countBillingStudents(school._id, settings),
    ]);

    const outstanding = invoices
      .filter((i) => i.status === "Pending")
      .reduce((sum, i) => sum + i.amount, 0);

    res.json({
      success: true,
      data: {
        school: {
          id: school._id,
          schoolName: school.schoolName,
          campusId: school.campusId,
          isActive: school.isActive,
          email: school.email,
          enabledModules: school.enabledModules,
        },
        subscription: subscription ? { ...subscription, status: subscriptionStatus(subscription, settings) } : null,
        status: subscriptionStatus(subscription, settings),
        students: {
          ...counts,
          limit: subscription?.studentLimit || 0,
          restricted: Boolean(subscription?.restrictStudentAdditions),
          remaining: subscription?.studentLimit > 0 ? subscription.studentLimit - counts.activeStudents : null,
        },
        quotes: PLANS.map((p) => quote(settings, p, counts.billingStudents)),
        outstanding,
        invoices: invoices.map(toPublicInvoice),
      },
    });
  } catch (err) {
    fail(res, err);
  }
});

// Direct subscription edit (plan label, validity dates, limits). Audited.
router.put("/schools/:id/subscription", async (req, res) => {
  try {
    const school = await loadSchool(req.params.id, res);
    if (!school) return;

    const { plan, startDate, expiryDate, studentLimit, notes, restrictStudentAdditions } = req.body;
    const update = { updatedBy: actorLabel(req) };

    if (plan !== undefined) {
      if (![...PLANS.map((p) => p.name), "Custom"].includes(plan)) {
        return res.status(400).json({ success: false, message: "Invalid plan" });
      }
      update.plan = plan;
    }
    if (startDate !== undefined) {
      const d = parseDate(startDate);
      if (!d) return res.status(400).json({ success: false, message: "Invalid start date" });
      update.startDate = d;
    }
    if (expiryDate !== undefined) {
      const d = parseDate(expiryDate);
      if (!d) return res.status(400).json({ success: false, message: "Invalid expiry date" });
      update.expiryDate = d;
    }
    if (update.startDate && update.expiryDate && update.expiryDate < update.startDate) {
      return res.status(400).json({ success: false, message: "Expiry date cannot be before the start date" });
    }
    if (studentLimit !== undefined) {
      const n = Number(studentLimit);
      if (!Number.isInteger(n) || n < 0) {
        return res.status(400).json({ success: false, message: "Student limit must be a whole number (0 = unlimited)" });
      }
      update.studentLimit = n;
    }
    if (notes !== undefined) update.notes = String(notes).slice(0, 500);
    if (restrictStudentAdditions !== undefined) {
      if (typeof restrictStudentAdditions !== "boolean") {
        return res.status(400).json({ success: false, message: "restrictStudentAdditions must be true or false" });
      }
      update.restrictStudentAdditions = restrictStudentAdditions;
    }

    const before = await Subscription.findOne({ schoolId: school._id }).lean();
    const subscription = await Subscription.findOneAndUpdate(
      { schoolId: school._id },
      { $set: update },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );

    await logAudit(req, {
      action: "subscription.update",
      category: "subscription",
      school,
      summary: `Subscription updated for ${school.schoolName}`,
      meta: {
        before: before ? { plan: before.plan, expiryDate: before.expiryDate, studentLimit: before.studentLimit } : null,
        after: { plan: subscription.plan, expiryDate: subscription.expiryDate, studentLimit: subscription.studentLimit },
      },
    });

    const limitChanged =
      (before?.studentLimit || 0) !== subscription.studentLimit ||
      Boolean(before?.restrictStudentAdditions) !== subscription.restrictStudentAdditions;
    if (limitChanged) {
      await logAudit(req, {
        action: "students.limit_update",
        category: "subscription",
        school,
        summary: `Student limit for ${school.schoolName}: ${subscription.studentLimit || "unlimited"}, additions ${
          subscription.restrictStudentAdditions ? "restricted" : "not restricted"
        }`,
        meta: {
          before: { limit: before?.studentLimit || 0, restricted: Boolean(before?.restrictStudentAdditions) },
          after: { limit: subscription.studentLimit, restricted: subscription.restrictStudentAdditions },
        },
      });
    }

    const settings = await getSettings();
    res.json({
      success: true,
      message: "Subscription updated",
      data: {
        ...subscription.toObject(),
        inflightStudents: undefined,
        status: subscriptionStatus(subscription, settings),
      },
    });
  } catch (err) {
    fail(res, err);
  }
});

// Manual payment: only with a reference note, always audited
router.post("/schools/:id/invoices/manual", async (req, res) => {
  try {
    const school = await loadSchool(req.params.id, res);
    if (!school) return;

    const { plan, paymentMode, transactionNo, note } = req.body;
    if (!PLANS.some((p) => p.name === plan)) {
      return res.status(400).json({ success: false, message: "Choose a valid plan" });
    }
    if (!paymentMode || !String(paymentMode).trim()) {
      return res.status(400).json({ success: false, message: "Payment mode is required" });
    }
    if (!note || String(note).trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: "A reference note (at least 5 characters) is required to record a manual payment",
      });
    }

    const settings = await getSettings();
    const subscription = await Subscription.findOne({ schoolId: school._id }).lean();
    const draft = await buildInvoice(school, plan, settings, subscription);

    const now = new Date();
    const txn = String(transactionNo || "").trim().slice(0, 80);
    let invoice;
    try {
      invoice = await BillingInvoice.create({
        ...draft,
        status: "Paid",
        source: "manual",
        paymentMode: String(paymentMode).trim().slice(0, 40),
        transactionNo: txn,
        ...(txn ? { activeTxnKey: normalizeTxn(txn) } : {}),
        amountPaid: draft.amount,
        paymentDate: now,
        note: String(note).trim().slice(0, 500),
        submittedAt: now,
        paidAt: now,
        verifiedBy: actorLabel(req),
      });
    } catch (err) {
      if (mongooseErrors.isDuplicateKey(err)) {
        return res.status(409).json({ success: false, message: "This transaction reference is already used for another payment" });
      }
      throw err;
    }

    const { subscription: updated, schoolSuspended } = await applyPaidInvoice(invoice, actorLabel(req));

    await logAudit(req, {
      action: "billing.manual_payment",
      category: "billing",
      school,
      summary: `Manual payment of ₹${invoice.amount} recorded for ${school.schoolName} (${invoice.billNo})`,
      meta: { billNo: invoice.billNo, amount: invoice.amount, plan, paymentMode, transactionNo: txn, note, schoolSuspended },
    });

    res.status(201).json({
      success: true,
      message: `Payment recorded. Subscription valid until ${updated.expiryDate.toISOString().slice(0, 10)}.${
        schoolSuspended ? " The school is still suspended; reactivate it from Schools when appropriate." : ""
      }`,
      schoolSuspended,
      data: toPublicInvoice(invoice),
    });
  } catch (err) {
    fail(res, err);
  }
});

/* ==========================================================
   INVOICES: list, proof, verify, reject
========================================================== */
router.get("/invoices", async (req, res) => {
  try {
    const { status, schoolId, search } = req.query;
    const { page, limit, skip } = pageParams(req);
    const filter = {};
    if (status) filter.status = status;
    if (schoolId && isValidId(schoolId)) filter.schoolId = schoolId;
    if (search && search.trim()) {
      const rx = new RegExp(escapeRegex(search.trim()), "i");
      filter.$or = [{ billNo: rx }, { campusCode: rx }, { transactionNo: rx }];
    }

    const [rows, total] = await Promise.all([
      BillingInvoice.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      BillingInvoice.countDocuments(filter),
    ]);

    const schools = await SchoolAdmin.find({ _id: { $in: rows.map((r) => r.schoolId) } })
      .select("schoolName")
      .lean();
    const nameById = new Map(schools.map((s) => [String(s._id), s.schoolName]));

    res.json({
      success: true,
      data: rows.map((r) => ({
        ...toPublicInvoice(r),
        schoolId: r.schoolId,
        campusCode: r.campusCode,
        schoolName: nameById.get(String(r.schoolId)) || r.campusCode,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    fail(res, err);
  }
});

router.get("/invoices/:id/screenshot", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid invoice id" });
    const invoice = await BillingInvoice.findById(req.params.id).select("+screenshot +proofPath proofMime").lean();
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });

    // New proofs live in protected file storage; older ones are still read from the document
    let image = "";
    if (invoice.proofPath) image = (await readAsDataUrl(invoice.proofPath, invoice.proofMime)) || "";
    if (!image) image = invoice.screenshot || "";

    res.set("Cache-Control", "private, no-store");
    res.json({ success: true, data: { screenshot: image } });
  } catch (err) {
    fail(res, err);
  }
});
// Pending -> Paid. The status flip is atomic, so a double click cannot extend the subscription twice.
router.patch("/invoices/:id/verify", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid invoice id" });

    const invoice = await BillingInvoice.findOneAndUpdate(
      { _id: req.params.id, status: "Pending" },
      { $set: { status: "Paid", paidAt: new Date(), verifiedBy: actorLabel(req), rejectReason: "" } },
      { returnDocument: "after" }
    );
    if (!invoice) {
      return res.status(409).json({ success: false, message: "Only a pending payment can be verified" });
    }

    const school = await SchoolAdmin.findById(invoice.schoolId).select("schoolName campusId");
    const { subscription, schoolSuspended } = await applyPaidInvoice(invoice, actorLabel(req));

    await logAudit(req, {
      action: "billing.verify",
      category: "billing",
      school,
      summary: `Payment ${invoice.billNo} (₹${invoice.amount}) verified`,
      meta: { billNo: invoice.billNo, amount: invoice.amount, expiryDate: subscription.expiryDate, schoolSuspended },
    });

    res.json({
      success: true,
      message: `Payment verified. Subscription valid until ${subscription.expiryDate.toISOString().slice(0, 10)}.${
        schoolSuspended ? " The school is still suspended; reactivate it from Schools when appropriate." : ""
      }`,
      schoolSuspended,
      data: toPublicInvoice(invoice),
    });
  } catch (err) {
    fail(res, err);
  }
});

router.patch("/invoices/:id/reject", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid invoice id" });
    const reason = String(req.body.reason || "").trim();
    if (reason.length < 3) {
      return res.status(400).json({ success: false, message: "Please provide a rejection reason" });
    }

    const invoice = await BillingInvoice.findOneAndUpdate(
      { _id: req.params.id, status: "Pending" },
      { $set: { status: "Rejected", rejectReason: reason.slice(0, 300), verifiedBy: actorLabel(req) }, $unset: { activeTxnKey: "" } },
      { returnDocument: "after" }
    );
    if (!invoice) {
      return res.status(409).json({ success: false, message: "Only a pending payment can be rejected" });
    }

    const school = await SchoolAdmin.findById(invoice.schoolId).select("schoolName campusId");
    await logAudit(req, {
      action: "billing.reject",
      category: "billing",
      school,
      summary: `Payment ${invoice.billNo} rejected: ${reason}`,
      meta: { billNo: invoice.billNo, amount: invoice.amount, reason },
    });

    res.json({ success: true, message: "Payment rejected", data: toPublicInvoice(invoice) });
  } catch (err) {
    fail(res, err);
  }
});

/* ==========================================================
   REMINDERS (computed on read; they never change school access)
========================================================== */
router.get("/reminders", async (req, res) => {
  try {
    const settings = await getSettings();
    const today = startOfTodayUTC();
    const intervals = [...new Set((settings.reminderDays?.length ? settings.reminderDays : [30, 7, 1]).map(Number))]
      .filter((n) => n > 0)
      .sort((a, b) => a - b); // ascending: [1, 7, 30]
    const window = Math.max(intervals[intervals.length - 1] || 0, settings.expiryWarningDays || 0);

    const [schools, subs, pending, studentCounts] = await Promise.all([
      SchoolAdmin.find().select("schoolName campusId isActive").lean(),
      Subscription.find().select("schoolId plan expiryDate studentLimit restrictStudentAdditions").lean(),
      BillingInvoice.aggregate([
        { $match: { status: "Pending" } },
        { $group: { _id: "$schoolId", count: { $sum: 1 }, amount: { $sum: "$amount" }, oldest: { $min: "$submittedAt" } } },
      ]),
      Student.aggregate([{ $match: { status: "Active" } }, { $group: { _id: "$schoolId", count: { $sum: 1 } } }]),
    ]);

    const schoolById = new Map(schools.map((s) => [String(s._id), s]));
    const studentsBySchool = new Map(studentCounts.map((s) => [String(s._id), s.count]));
    const items = [];

    const base = (school) => ({
      schoolId: school._id,
      schoolName: school.schoolName,
      campusId: school.campusId,
      schoolActive: school.isActive,
    });

    subs.forEach((sub) => {
      const school = schoolById.get(String(sub.schoolId));
      if (!school) return;

      if (sub.expiryDate) {
        const daysLeft = Math.round((new Date(sub.expiryDate).getTime() - today.getTime()) / DAY);
        if (daysLeft < 0) {
          const status = subscriptionStatus(sub, settings, today);
          items.push({
            ...base(school),
            type: "expired",
            severity: "danger",
            status,
            expiryDate: sub.expiryDate,
            daysLeft,
            message: `${school.schoolName}: subscription ${status === "Grace" ? "is in its grace period" : "has expired"} (${Math.abs(daysLeft)} day(s) ago).`,
            recommendedAction: school.isActive
              ? "Renew or extend the validity, change the plan, keep the school active, or suspend it. Nothing changes automatically."
              : "The school is suspended. Renew and reactivate it when appropriate.",
            link: `/super-admin/billing?school=${school._id}`,
          });
        } else if (daysLeft <= window) {
          const bucket = intervals.find((d) => daysLeft <= d) || window;
          const rank = intervals.indexOf(bucket);
          items.push({
            ...base(school),
            type: "expiring",
            severity: rank === 0 ? "danger" : rank === 1 ? "warning" : "info",
            status: "Active",
            interval: bucket,
            expiryDate: sub.expiryDate,
            daysLeft,
            message: `${school.schoolName}: subscription ends in ${daysLeft} day(s).`,
            recommendedAction: "Contact the school about renewal, or extend the validity.",
            link: `/super-admin/billing?school=${school._id}`,
          });
        }
      }

      if (sub.studentLimit > 0) {
        const count = studentsBySchool.get(String(sub.schoolId)) || 0;
        const ratio = count / sub.studentLimit;
        if (ratio >= 0.9) {
          const reached = ratio >= 1;
          items.push({
            ...base(school),
            type: reached ? "student_limit_reached" : "student_limit_near",
            severity: reached ? "danger" : "warning",
            studentCount: count,
            studentLimit: sub.studentLimit,
            restricted: Boolean(sub.restrictStudentAdditions),
            message: `${school.schoolName}: ${count} of ${sub.studentLimit} students (${reached ? "limit reached" : "approaching the limit"}).`,
            recommendedAction: sub.restrictStudentAdditions
              ? "New students are being refused. Increase the limit or keep the restriction."
              : "Increase the limit, or switch on the student-addition restriction if you want to cap it.",
            link: `/super-admin/billing?school=${school._id}`,
          });
        }
      }
    });

    pending.forEach((p) => {
      const school = schoolById.get(String(p._id));
      if (!school) return;
      const ageDays = p.oldest ? Math.floor((Date.now() - new Date(p.oldest).getTime()) / DAY) : 0;
      items.push({
        ...base(school),
        type: "pending_payment",
        severity: ageDays >= 3 ? "danger" : "warning",
        pendingCount: p.count,
        pendingAmount: p.amount,
        message: `${school.schoolName}: ${p.count} payment(s) waiting for verification${ageDays ? ` (oldest ${ageDays} day(s))` : ""}.`,
        recommendedAction: "Check the transaction in your account, then verify or reject it.",
        link: `/super-admin/payments?status=Pending&school=${school._id}`,
      });
    });

    const rank = { danger: 0, warning: 1, info: 2 };
    items.sort((a, b) => rank[a.severity] - rank[b.severity] || (a.daysLeft ?? 999) - (b.daysLeft ?? 999));

    const summary = items.reduce((acc, i) => ({ ...acc, [i.type]: (acc[i.type] || 0) + 1 }), {});
    res.json({ success: true, data: items, summary, total: items.length });
  } catch (err) {
    fail(res, err);
  }
});

/* ==========================================================
   PLATFORM / BILLING SETTINGS
========================================================== */
router.get("/settings", async (req, res) => {
  try {
    res.json({ success: true, data: settingsView(await getSettings()) });
  } catch (err) {
    fail(res, err);
  }
});

const PAYMENT_KEYS = ["upiId", "merchantName", "paymentInstructions", "accountDetails", "proofRequired", "supportPhone", "supportEmail"];

router.put("/settings", async (req, res) => {
  try {
    const body = req.body || {};
    const update = {};
    const numeric = (key, min, max) => {
      if (body[key] === undefined) return null;
      const n = Number(body[key]);
      if (!Number.isFinite(n) || n < min || n > max) return `${key} must be between ${min} and ${max}`;
      update[key] = n;
      return null;
    };
    const errors = [
      numeric("ratePerStudent", 0, 100000),
      numeric("gstPercent", 0, 100),
      numeric("gracePeriodDays", 0, 90),
      numeric("expiryWarningDays", 1, 180),
    ].filter(Boolean);

    if (body.reminderDays !== undefined) {
      const days = Array.isArray(body.reminderDays) ? body.reminderDays.map(Number) : [];
      if (days.length === 0 || days.length > 6 || days.some((d) => !Number.isInteger(d) || d < 1 || d > 365)) {
        errors.push("reminderDays must be 1 to 6 whole numbers between 1 and 365");
      } else {
        update.reminderDays = [...new Set(days)].sort((a, b) => b - a);
      }
    }

    if (body.discounts && typeof body.discounts === "object") {
      PLANS.forEach((p) => {
        if (body.discounts[p.name] === undefined) return;
        const n = Number(body.discounts[p.name]);
        if (!Number.isFinite(n) || n < 0 || n > 100) errors.push(`${p.name} discount must be between 0 and 100`);
        else update[`discounts.${p.name}`] = n;
      });
    }
    if (errors.length) return res.status(400).json({ success: false, message: errors[0] });

    if (body.includeInactiveStudents !== undefined) update.includeInactiveStudents = Boolean(body.includeInactiveStudents);
    if (body.proofRequired !== undefined) update.proofRequired = Boolean(body.proofRequired);
    ["merchantName", "upiId", "supportPhone", "supportEmail"].forEach((key) => {
      if (body[key] !== undefined) update[key] = String(body[key]).trim().slice(0, 120);
    });
    ["paymentInstructions", "accountDetails"].forEach((key) => {
      if (body[key] !== undefined) update[key] = String(body[key]).trim().slice(0, 1000);
    });
    update.updatedBy = actorLabel(req);

    const before = await getSettings();
    const settings = await PlatformSettings.findOneAndUpdate(
      { key: "default" },
      { $set: update },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    ).lean();

    const changed = Object.keys(update).filter((k) => k !== "updatedBy");
    const paymentChanged = changed.some((k) => PAYMENT_KEYS.includes(k));
    await logAudit(req, {
      action: paymentChanged ? "settings.payment_update" : "settings.update",
      category: "settings",
      summary: paymentChanged ? "Payment details and instructions updated" : "Platform billing settings updated",
      meta: { changed, before: { ratePerStudent: before.ratePerStudent, gstPercent: before.gstPercent } },
    });

    res.json({ success: true, message: "Settings saved", data: settingsView(settings) });
  } catch (err) {
    fail(res, err);
  }
});

/* ---------- Payment QR (protected file storage, never served statically) ---------- */
router.get("/settings/qr", async (req, res) => {
  try {
    const settings = await getSettings();
    const image = settings.paymentQrPath ? await readAsDataUrl(settings.paymentQrPath, settings.paymentQrMime) : null;
    res.set("Cache-Control", "private, no-store");
    res.json({ success: true, data: { image: image || "" } });
  } catch (err) {
    fail(res, err);
  }
});

router.put("/settings/qr", async (req, res) => {
  try {
    const parsed = parseImageDataUrl(req.body?.image, QR_MAX_BYTES);
    if (parsed.error) return res.status(400).json({ success: false, message: parsed.error });

    const before = await getSettings();
    const rel = await saveImage("platform", `payment-qr-${Date.now()}`, parsed);
    await PlatformSettings.updateOne(
      { key: "default" },
      { $set: { paymentQrPath: rel, paymentQrMime: parsed.mime, updatedBy: actorLabel(req) } },
      { upsert: true }
    );
    if (before.paymentQrPath && before.paymentQrPath !== rel) await removeFile(before.paymentQrPath);

    await logAudit(req, {
      action: "settings.payment_qr_update",
      category: "settings",
      summary: before.paymentQrPath ? "Payment QR code replaced" : "Payment QR code uploaded",
      meta: { mime: parsed.mime, bytes: parsed.buffer.length },
    });

    res.json({ success: true, message: "Payment QR saved" });
  } catch (err) {
    fail(res, err);
  }
});

router.delete("/settings/qr", async (req, res) => {
  try {
    const before = await getSettings();
    if (!before.paymentQrPath) return res.status(404).json({ success: false, message: "No payment QR is configured" });
    await PlatformSettings.updateOne(
      { key: "default" },
      { $set: { paymentQrPath: "", paymentQrMime: "", updatedBy: actorLabel(req) } }
    );
    await removeFile(before.paymentQrPath);
    await logAudit(req, { action: "settings.payment_qr_remove", category: "settings", summary: "Payment QR code removed" });
    res.json({ success: true, message: "Payment QR removed" });
  } catch (err) {
    fail(res, err);
  }
});

/* ==========================================================
   AUDIT LOG
========================================================== */
router.get("/audit-logs", async (req, res) => {
  try {
    const { category, schoolId, search } = req.query;
    const { page, limit, skip } = pageParams(req);
    const filter = {};
    if (category) filter.category = category;
    if (schoolId && isValidId(schoolId)) filter.schoolId = schoolId;
    if (search && search.trim()) {
      const rx = new RegExp(escapeRegex(search.trim()), "i");
      filter.$or = [{ summary: rx }, { schoolName: rx }, { action: rx }, { actorEmail: rx }];
    }

    const [rows, total] = await Promise.all([
      AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AuditLog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: rows,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    fail(res, err);
  }
});

/* ==========================================================
   ANNOUNCEMENTS (re-uses the existing school notices)
========================================================== */
router.post("/announcements", async (req, res) => {
  try {
    const { title = "", message, type = "info", schoolIds } = req.body || {};
    if (!message || !String(message).trim()) {
      return res.status(400).json({ success: false, message: "Message is required" });
    }
    if (!["info", "warning", "danger", "success"].includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid notice type" });
    }

    const filter = {};
    if (Array.isArray(schoolIds) && schoolIds.length > 0) {
      filter._id = { $in: schoolIds.filter(isValidId) };
    }

    const notice = {
      title: String(title).trim().slice(0, 120),
      message: String(message).trim().slice(0, 1000),
      type,
      isActive: true,
      createdBy: actorLabel(req),
    };

    const result = await SchoolAdmin.updateMany(filter, { $push: { notices: notice } });

    await logAudit(req, {
      action: "announcement.broadcast",
      category: "announcement",
      summary: `Announcement sent to ${result.modifiedCount} school(s): ${notice.title || notice.message.slice(0, 60)}`,
      meta: { type, targeted: Array.isArray(schoolIds) && schoolIds.length > 0, count: result.modifiedCount },
    });

    res.status(201).json({ success: true, message: `Announcement sent to ${result.modifiedCount} school(s)`, count: result.modifiedCount });
  } catch (err) {
    fail(res, err);
  }
});

module.exports = router;
