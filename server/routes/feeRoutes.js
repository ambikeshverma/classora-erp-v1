const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const schoolAuth = require("../middleware/schoolAuth");

const Admission = require("../models/Admission");
const FeeScheme = require("../models/FeeScheme");
const FeePlan = require("../models/FeePlan");
const Concession = require("../models/Concession");
const FeeReceipt = require("../models/FeeReceipt");
const FeeManualFee = require("../models/FeeManualFee");
const FeeCounter = require("../models/FeeCounter");
const TransportRoute = require("../models/TransportRoute");
const StudentTransport = require("../models/StudentTransport");

const {
  TRANSPORT_HEAD,
  round2,
  escapeRegex,
  getPeriods,
  getCurrentSession,
  isFutureDate,
  buildPaidMap,
  buildStudentRows,
} = require("../utils/feeEngine");

// Every fee record is stored against the school/campus resolved from the access token (schoolAuth)
router.use(schoolAuth, (req, res, next) =>
  // The dues list is also read by Fee Due Notice, which belongs to the Student App Access module
  req.path === "/dues" && (req.school.enabledModules || []).includes("student_app_access")
    ? next()
    : schoolAuth.checkModule("fee_manager")(req, res, next)
);

const PAYMENT_MODES = ["Cash", "Cheque", "UPI", "Bank Transfer", "Card"];
const NO_CONCESSION = "No Concession Plan";

const STUDENT_FIELDS =
  "studentName fatherName motherName mobile srNo schoolAdmissionNo className section session admissionDate feePlan concessionPlan routeName vehicleName studentImage medium status";

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const fail = (res, status, message) => res.status(status).json({ success: false, message });

const serverError = (res, error) => res.status(500).json({ success: false, message: error.message });

const ownerFields = (req) => ({ schoolId: req.schoolId, campusId: req.campusId });

const findStudent = (req, id, fields = STUDENT_FIELDS) =>
  Admission.findOne({ _id: id, schoolId: req.schoolId }).select(fields).lean();

const collector = (req) => ({
  name: req.user?.name || req.school?.schoolName || "",
  id: String(req.user?.userId || req.user?.id || ""),
});

const schoolInfoOf = (school) => ({
  schoolName: school?.schoolName || "",
  address: school?.address || "",
  email: school?.email || "",
  phone: school?.contactNo || "",
  website: school?.website || "",
  logo: school?.schoolLogo || "",
});

// Loads everything needed to price one student for one session (all queries run in parallel)
const loadStudentFeeData = async (req, admission, session) => {
  const campusId = req.campusId;
  const studentId = admission._id;
  const profileSession = admission.session || getCurrentSession();
  const hasConcession = admission.concessionPlan && admission.concessionPlan !== NO_CONCESSION;

  const [scheme, plan, concession, receipts, manualFees, transport] = await Promise.all([
    FeeScheme.findOne({ campusId }).select("schemeType installmentCount feeHeads").lean(),
    FeePlan.findOne({ campusId, className: admission.className, feePlanName: admission.feePlan })
      .select("feePlanName feeScheme newStudentAmounts oldStudentAmounts")
      .lean(),
    hasConcession ? Concession.findOne({ campusId, concessionName: admission.concessionPlan }).lean() : null,
    FeeReceipt.find({ campusId, studentId, session, status: "Active" }).sort({ receiptSeq: 1 }).lean(),
    FeeManualFee.find({ campusId, studentId, session }).sort({ createdAt: 1 }).lean(),
    StudentTransport.findOne({ campusId, studentId, session }).lean(),
  ]);

  const paidMap = buildPaidMap(receipts);

  const built = buildStudentRows({
    admission,
    session,
    profileSession,
    scheme,
    plan,
    concession,
    transport,
    manualFees,
    historyRows: receipts.flatMap((r) => r.rows || []),
    paidMap,
  });

  return { ...built, scheme, plan, receipts, manualFees, transport, profileSession };
};

const presentRow = (row) => ({
  rowKey: row.rowKey,
  source: row.source,
  manualFeeId: row.manualFeeId,
  periodKey: row.periodKey,
  periodShort: row.periodShort,
  feeHeadName: row.feeHeadName,
  fee: row.fee,
  concession: row.concession,
  paid: row.paid,
  payable: row.payable,
  balance: row.balance,
});

const presentReceiptSummary = (r) => ({
  id: r._id,
  receiptNo: r.receiptNo,
  session: r.session,
  depositDate: r.depositDate,
  paymentMode: r.paymentMode,
  paymentRef: r.paymentRef,
  remarks: r.remarks,
  paidAmount: r.paidAmount,
  isZeroReceipt: r.isZeroReceipt,
  periods: r.periods,
  collectedByName: r.collectedByName,
  status: r.status,
  createdAt: r.createdAt,
});

/* ==========================================================
   META — sessions, fee heads, transport routes and school info
   for the collection screen in a single round trip
========================================================== */
router.get("/meta", async (req, res) => {
  try {
    const [scheme, routes, admissionSessions, receiptSessions] = await Promise.all([
      FeeScheme.findOne({ campusId: req.campusId }).select("schemeType installmentCount feeHeads").lean(),
      TransportRoute.find({ campusId: req.campusId, isActive: true })
        .select("routeName monthlyFee startPoint endPoint")
        .sort({ routeName: 1 })
        .lean(),
      Admission.distinct("session", { schoolId: req.schoolId }),
      FeeReceipt.distinct("session", { campusId: req.campusId }),
    ]);

    const currentSession = getCurrentSession();
    const sessions = [...new Set([...admissionSessions, ...receiptSessions, currentSession])]
      .filter(Boolean)
      .sort()
      .reverse();

    res.status(200).json({
      success: true,
      data: {
        currentSession,
        sessions,
        schemeType: scheme?.schemeType || "Monthly",
        periods: getPeriods(scheme?.schemeType || "Monthly", scheme?.installmentCount),
        feeHeads: (scheme?.feeHeads || []).map((h) => ({ id: h._id, name: h.feeHeadName })),
        routes,
        paymentModes: PAYMENT_MODES,
        schoolInfo: schoolInfoOf(req.school),
        collectedByName: collector(req).name,
      },
    });
  } catch (error) {
    serverError(res, error);
  }
});

/* ==========================================================
   STUDENT SEARCH
========================================================== */
router.get("/students/search", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    if (q.length < 2) {
      return res.status(200).json({ success: true, data: [] });
    }

    const rx = new RegExp(escapeRegex(q), "i");
    const students = await Admission.find({
      schoolId: req.schoolId,
      status: "Active",
      $or: [{ studentName: rx }, { fatherName: rx }, { mobile: rx }, { srNo: rx }, { schoolAdmissionNo: rx }],
    })
      .select("studentName fatherName mobile srNo schoolAdmissionNo className section session")
      .sort({ studentName: 1 })
      .limit(15)
      .lean();

    res.status(200).json({ success: true, data: students });
  } catch (error) {
    serverError(res, error);
  }
});

/* ==========================================================
   STUDENT PROFILE (read-only snapshot shown inside Fee Collection)
========================================================== */
router.get("/students/:id/profile", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid student id");

    const student = await Admission.findOne({ _id: req.params.id, schoolId: req.schoolId })
      .select(
        "studentName fatherName motherName mobile altMobile email srNo schoolAdmissionNo className section medium session admissionDate gender dob feePlan concessionPlan routeName vehicleName house siblingGroup status studentImage permanentAddress permanentCity permanentState permanentPin"
      )
      .lean();

    if (!student) return fail(res, 404, "Student not found");

    res.status(200).json({ success: true, data: student });
  } catch (error) {
    serverError(res, error);
  }
});

/* ==========================================================
   STUDENT FEE DASHBOARD
========================================================== */
router.get("/students/:id/dashboard", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid student id");

    const admission = await findStudent(req, req.params.id);
    if (!admission) return fail(res, 404, "Student not found");

    const session = String(req.query.session || admission.session || getCurrentSession()).trim();
    const data = await loadStudentFeeData(req, admission, session);

    const manualFees = data.manualFees.map((item) => {
      const row = data.rows.find((r) => r.manualFeeId && String(r.manualFeeId) === String(item._id));
      return {
        id: item._id,
        feeHeadName: item.feeHeadName,
        periodKey: item.periodKey,
        amount: item.amount,
        paid: row?.paid || 0,
        balance: row?.balance ?? item.amount,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        session,
        student: {
          id: admission._id,
          studentName: admission.studentName,
          fatherName: admission.fatherName,
          motherName: admission.motherName,
          mobile: admission.mobile,
          srNo: admission.srNo,
          admissionNo: admission.schoolAdmissionNo || "",
          medium: admission.medium,
          photo: admission.studentImage || "",
        },
        profile: {
          className: admission.className,
          section: admission.section,
          session: data.profileSession,
          feePlan: admission.feePlan,
          concessionPlan: admission.concessionPlan || NO_CONCESSION,
          routeName: data.transport?.routeName || "",
        },
        feePlanMissing: session === data.profileSession && !data.plan,
        periods: data.periods,
        rows: data.rows.map(presentRow),
        totals: data.totals,
        receipts: data.receipts.map(presentReceiptSummary),
        manualFees,
        transport: data.transport
          ? {
              routeId: data.transport.routeId,
              routeName: data.transport.routeName,
              monthlyFee: data.transport.monthlyFee,
              removedPeriods: data.transport.removedPeriods || [],
            }
          : null,
      },
    });
  } catch (error) {
    serverError(res, error);
  }
});

/* ==========================================================
   ADDED (MANUAL) FEES
========================================================== */
router.post("/students/:id/manual-fees", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid student id");

    const { session, feeHeadName, periodKey } = req.body;
    const amount = Number(req.body.amount);

    if (!session || !feeHeadName || !periodKey) {
      return fail(res, 400, "Session, fee head and fee period are required");
    }
    if (!(amount > 0)) return fail(res, 400, "Amount must be greater than zero");

    const [student, scheme] = await Promise.all([
      findStudent(req, req.params.id, "_id"),
      FeeScheme.findOne({ campusId: req.campusId }).select("schemeType installmentCount feeHeads").lean(),
    ]);

    if (!student) return fail(res, 404, "Student not found");

    if (!(scheme?.feeHeads || []).some((h) => h.feeHeadName === feeHeadName)) {
      return fail(res, 400, "Selected fee head is not part of the fee scheme");
    }

    const periods = getPeriods(scheme.schemeType, scheme.installmentCount);
    if (!periods.some((p) => p.key === periodKey)) {
      return fail(res, 400, "Selected fee period is not valid for the fee scheme");
    }

    const created = await FeeManualFee.create({
      ...ownerFields(req),
      studentId: student._id,
      session: String(session).trim(),
      feeHeadName,
      periodKey,
      amount: round2(amount),
      createdByName: collector(req).name,
    });

    res.status(201).json({ success: true, message: "Fee added successfully", data: created });
  } catch (error) {
    serverError(res, error);
  }
});

router.delete("/manual-fees/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid fee id");

    const manual = await FeeManualFee.findOne({ _id: req.params.id, campusId: req.campusId }).lean();
    if (!manual) return fail(res, 404, "Added fee not found");

    const hasPayment = await FeeReceipt.exists({
      campusId: req.campusId,
      status: "Active",
      rows: { $elemMatch: { manualFeeId: manual._id, paid: { $gt: 0 } } },
    });

    if (hasPayment) {
      return fail(res, 400, "Payment is already collected against this fee. Cancel the receipt first.");
    }

    await FeeManualFee.deleteOne({ _id: manual._id });
    res.status(200).json({ success: true, message: "Added fee deleted successfully" });
  } catch (error) {
    serverError(res, error);
  }
});

/* ==========================================================
   STUDENT TRANSPORT ALLOCATION (drives the Transport Fee rows)
========================================================== */
const transportHasPayment = (req, studentId, session, periodKey) => {
  const rowMatch = { source: "Transport", paid: { $gt: 0 } };
  if (periodKey) rowMatch.rowKey = `Transport|${periodKey}|${TRANSPORT_HEAD}|`;

  return FeeReceipt.exists({
    campusId: req.campusId,
    studentId,
    session,
    status: "Active",
    rows: { $elemMatch: rowMatch },
  });
};

router.put("/students/:id/transport", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid student id");

    const { session, routeId } = req.body;
    if (!session || !routeId || !isValidId(routeId)) return fail(res, 400, "Session and route are required");

    const [student, route, existing] = await Promise.all([
      findStudent(req, req.params.id, "_id session"),
      TransportRoute.findOne({ _id: routeId, campusId: req.campusId, isActive: true }).lean(),
      StudentTransport.findOne({ campusId: req.campusId, studentId: req.params.id, session }).lean(),
    ]);

    if (!student) return fail(res, 404, "Student not found");
    if (!route) return fail(res, 404, "Transport route not found");

    if (existing && String(existing.routeId) !== String(route._id)) {
      if (await transportHasPayment(req, student._id, session)) {
        return fail(res, 400, "Transport fee is already collected for this student. Cancel those receipts to change the route.");
      }
    }

    const allocation = await StudentTransport.findOneAndUpdate(
      { campusId: req.campusId, studentId: student._id, session },
      {
        $set: {
          schoolId: req.schoolId,
          routeId: route._id,
          routeName: route.routeName,
          monthlyFee: route.monthlyFee,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    // Keep the admission/student profile in sync for the session the student currently belongs to
    if ((student.session || getCurrentSession()) === session) {
      await Admission.updateOne({ _id: student._id }, { $set: { routeName: route.routeName } });
    }

    res.status(200).json({ success: true, message: "Transport allocated successfully", data: allocation });
  } catch (error) {
    serverError(res, error);
  }
});

router.delete("/students/:id/transport", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid student id");

    const session = String(req.query.session || "").trim();
    if (!session) return fail(res, 400, "Session is required");

    const student = await findStudent(req, req.params.id, "_id session");
    if (!student) return fail(res, 404, "Student not found");

    if (await transportHasPayment(req, student._id, session)) {
      return fail(res, 400, "Transport fee is already collected for this student. Cancel those receipts first.");
    }

    const removed = await StudentTransport.findOneAndDelete({
      campusId: req.campusId,
      studentId: student._id,
      session,
    });

    if (!removed) return fail(res, 404, "Transport is not allocated to this student");

    if ((student.session || getCurrentSession()) === session) {
      await Admission.updateOne(
        { _id: student._id },
        { $set: { routeName: "Not Assigned", vehicleName: "Not Assigned" } }
      );
    }

    res.status(200).json({ success: true, message: "Transport removed successfully" });
  } catch (error) {
    serverError(res, error);
  }
});

router.patch("/students/:id/transport/periods", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid student id");

    const { session, periodKey, restore } = req.body;
    if (!session || !periodKey) return fail(res, 400, "Session and fee period are required");

    if (!restore && (await transportHasPayment(req, req.params.id, session, periodKey))) {
      return fail(res, 400, "This period's transport fee is already paid.");
    }

    const update = restore ? { $pull: { removedPeriods: periodKey } } : { $addToSet: { removedPeriods: periodKey } };
    const allocation = await StudentTransport.findOneAndUpdate(
      { campusId: req.campusId, studentId: req.params.id, session },
      update,
      { new: true }
    ).lean();

    if (!allocation) return fail(res, 404, "Transport is not allocated to this student");

    res.status(200).json({ success: true, message: restore ? "Period restored" : "Period removed", data: allocation });
  } catch (error) {
    serverError(res, error);
  }
});

/* ==========================================================
   RECEIPTS
========================================================== */
router.post("/receipts", async (req, res) => {
  try {
    const { studentId, session, depositDate, paymentMode, paymentRef, remarks, rows, confirmZero } = req.body;

    if (!studentId || !isValidId(studentId)) return fail(res, 400, "Please select a student");
    if (!session) return fail(res, 400, "Session is required");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(depositDate || ""))) return fail(res, 400, "Valid deposit date is required");
    if (isFutureDate(depositDate)) return fail(res, 400, "Future date is not allowed");
    if (!PAYMENT_MODES.includes(paymentMode)) return fail(res, 400, "Invalid payment mode");
    if (paymentMode !== "Cash" && !String(paymentRef || "").trim()) {
      return fail(res, 400, "Payment reference is required for non-cash payments");
    }
    if (!Array.isArray(rows) || rows.length === 0) return fail(res, 400, "No fee rows selected");

    const admission = await findStudent(req, studentId);
    if (!admission) return fail(res, 404, "Student not found");
    if (admission.status !== "Active") return fail(res, 400, "Fee can only be collected for active students");

    const cleanSession = String(session).trim();
    const data = await loadStudentFeeData(req, admission, cleanSession);
    const rowMap = new Map(data.rows.map((row) => [row.rowKey, row]));

    const seen = new Set();
    const receiptRows = [];
    let total = 0;

    for (const input of rows) {
      const row = rowMap.get(input.rowKey);
      const pay = round2(input.paid);

      if (!row) return fail(res, 400, "Fee details changed. Please refresh and try again.");
      if (seen.has(input.rowKey)) return fail(res, 400, "Duplicate fee row submitted");
      if (!(pay >= 0)) return fail(res, 400, "Invalid paid amount");
      if (pay > row.payable + 0.001) {
        return fail(res, 400, `Paid amount for ${row.feeHeadName} (${row.periodShort}) exceeds the balance`);
      }

      seen.add(input.rowKey);
      total = round2(total + pay);

      receiptRows.push({
        rowKey: row.rowKey,
        source: row.source,
        manualFeeId: row.manualFeeId,
        periodKey: row.periodKey,
        periodShort: row.periodShort,
        feeHeadName: row.feeHeadName,
        fee: row.fee,
        concession: row.concession,
        prepaid: row.paid,
        paid: pay,
        balance: Math.max(round2(row.fee - row.concession - row.paid - pay), 0),
      });
    }

    const isZeroReceipt = total === 0;
    if (isZeroReceipt && !confirmZero) return fail(res, 400, "Please confirm ZERO amount receipt");

    const keptRows = isZeroReceipt ? receiptRows : receiptRows.filter((row) => row.paid > 0);

    const counter = await FeeCounter.findOneAndUpdate(
      { campusId: req.campusId, session: cleanSession },
      { $inc: { seq: 1 } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    const by = collector(req);
    const receipt = await FeeReceipt.create({
      ...ownerFields(req),
      session: cleanSession,
      receiptSeq: counter.seq,
      receiptNo: String(counter.seq).padStart(2, "0"),
      studentId: admission._id,
      studentName: admission.studentName,
      fatherName: admission.fatherName,
      mobile: admission.mobile,
      srNo: admission.srNo,
      admissionNo: admission.schoolAdmissionNo || "",
      className: admission.className,
      section: admission.section,
      routeName: data.transport?.routeName || "",
      depositDate,
      paymentMode,
      paymentRef: paymentMode === "Cash" ? "" : String(paymentRef).trim(),
      remarks: String(remarks || "").trim(),
      paidAmount: total,
      isZeroReceipt,
      periods: [...new Set(keptRows.map((row) => row.periodKey))],
      rows: keptRows,
      collectedByName: by.name,
      collectedById: by.id,
    });

    res.status(201).json({ success: true, message: "Receipt saved successfully", data: receipt });
  } catch (error) {
    serverError(res, error);
  }
});

router.get("/receipts", async (req, res) => {
  try {
    const { session, status, paymentMode, className, from, to, q, studentId } = req.query;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 25, 1), 100);

    const filter = { campusId: req.campusId };
    if (session) filter.session = session;
    if (status) filter.status = status;
    if (paymentMode) filter.paymentMode = paymentMode;
    if (className) filter.className = className;
    if (studentId && isValidId(studentId)) filter.studentId = new mongoose.Types.ObjectId(studentId);
    if (from || to) {
      filter.depositDate = {};
      if (from) filter.depositDate.$gte = from;
      if (to) filter.depositDate.$lte = to;
    }
    if (q && String(q).trim()) {
      const rx = new RegExp(escapeRegex(String(q).trim()), "i");
      filter.$or = [{ studentName: rx }, { fatherName: rx }, { receiptNo: rx }, { srNo: rx }, { mobile: rx }];
    }

    const [items, total, sums] = await Promise.all([
      FeeReceipt.find(filter)
        .select("-rows")
        .sort({ depositDate: -1, receiptSeq: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      FeeReceipt.countDocuments(filter),
      FeeReceipt.aggregate([{ $match: filter }, { $group: { _id: null, amount: { $sum: "$paidAmount" } } }]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        items,
        total,
        page,
        pages: Math.max(Math.ceil(total / limit), 1),
        totalAmount: round2(sums[0]?.amount || 0),
      },
    });
  } catch (error) {
    serverError(res, error);
  }
});

router.get("/receipts/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid receipt id");

    const receipt = await FeeReceipt.findOne({ _id: req.params.id, campusId: req.campusId }).lean();
    if (!receipt) return fail(res, 404, "Receipt not found");

    res.status(200).json({ success: true, data: receipt });
  } catch (error) {
    serverError(res, error);
  }
});

router.patch("/receipts/:id/cancel", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid receipt id");

    const reason = String(req.body.reason || "").trim();
    if (reason.length < 3) return fail(res, 400, "Cancellation reason is required");

    const receipt = await FeeReceipt.findOneAndUpdate(
      { _id: req.params.id, campusId: req.campusId, status: "Active" },
      {
        $set: {
          status: "Cancelled",
          cancelReason: reason,
          cancelledAt: new Date(),
          cancelledByName: collector(req).name,
        },
      },
      { new: true }
    )
      .select("-rows")
      .lean();

    if (!receipt) return fail(res, 404, "Active receipt not found");

    res.status(200).json({ success: true, message: "Receipt cancelled successfully", data: receipt });
  } catch (error) {
    serverError(res, error);
  }
});

/* ==========================================================
   SESSION DUES — fee, concession, paid and balance for every
   active student of a session (one pass over the school)
========================================================== */
const computeSessionDues = async (req, session) => {
  const campusId = req.campusId;

  const [scheme, plans, concessions, transports, manualFees, paidAgg, students] = await Promise.all([
    FeeScheme.findOne({ campusId }).select("schemeType installmentCount feeHeads").lean(),
    FeePlan.find({ campusId }).select("className feePlanName feeScheme newStudentAmounts oldStudentAmounts").lean(),
    Concession.find({ campusId }).lean(),
    StudentTransport.find({ campusId, session }).lean(),
    FeeManualFee.find({ campusId, session }).lean(),
    FeeReceipt.aggregate([
      { $match: { campusId, session, status: "Active" } },
      { $unwind: "$rows" },
      { $group: { _id: { s: "$studentId", k: "$rows.rowKey" }, paid: { $sum: "$rows.paid" } } },
    ]),
    Admission.find({ schoolId: req.schoolId, status: "Active", session })
      .select("studentName fatherName mobile srNo schoolAdmissionNo className section admissionDate feePlan concessionPlan")
      .sort({ className: 1, section: 1, studentName: 1 })
      .lean(),
  ]);

  const planMap = new Map(plans.map((p) => [`${p.className}|${p.feePlanName}`, p]));
  const concessionMap = new Map(concessions.map((c) => [c.concessionName, c]));
  const transportMap = new Map(transports.map((t) => [String(t.studentId), t]));

  const manualMap = new Map();
  manualFees.forEach((item) => {
    const key = String(item.studentId);
    if (!manualMap.has(key)) manualMap.set(key, []);
    manualMap.get(key).push(item);
  });

  const paidByStudent = new Map();
  paidAgg.forEach((item) => {
    const key = String(item._id.s);
    if (!paidByStudent.has(key)) paidByStudent.set(key, new Map());
    paidByStudent.get(key).set(item._id.k, round2(item.paid));
  });

  const dues = students.map((student) => {
    const key = String(student._id);
    const plan = planMap.get(`${student.className}|${student.feePlan}`);
    const { rows, totals } = buildStudentRows({
      admission: student,
      session,
      profileSession: session,
      scheme,
      plan,
      concession: student.concessionPlan === NO_CONCESSION ? null : concessionMap.get(student.concessionPlan),
      transport: transportMap.get(key),
      manualFees: manualMap.get(key) || [],
      historyRows: [],
      paidMap: paidByStudent.get(key) || new Map(),
    });

    const periodDue = {};
    rows.forEach((row) => {
      if (row.payable > 0) periodDue[row.periodKey] = round2((periodDue[row.periodKey] || 0) + row.payable);
    });

    return {
      studentId: student._id,
      studentName: student.studentName,
      fatherName: student.fatherName,
      mobile: student.mobile,
      srNo: student.srNo,
      admissionNo: student.schoolAdmissionNo || "",
      className: student.className,
      section: student.section,
      feePlan: student.feePlan,
      concessionPlan: student.concessionPlan || NO_CONCESSION,
      routeName: transportMap.get(key)?.routeName || "",
      totalFee: totals.totalFee,
      concession: totals.totalConcession,
      paid: totals.totalPaid,
      balance: totals.balance,
      periodDue,
      feePlanMissing: !plan,
    };
  });

  return {
    schemeType: scheme?.schemeType || "Monthly",
    periods: getPeriods(scheme?.schemeType || "Monthly", scheme?.installmentCount),
    dues,
  };
};

// Lean dues list used by Fee Due Notice (Student App Access)
router.get("/dues", async (req, res) => {
  try {
    const session = String(req.query.session || getCurrentSession()).trim();
    const data = await computeSessionDues(req, session);

    res.status(200).json({
      success: true,
      data: { session, ...data, schoolInfo: schoolInfoOf(req.school) },
    });
  } catch (error) {
    serverError(res, error);
  }
});

/* ==========================================================
   REPORTS — collections, head wise totals and dues
========================================================== */
router.get("/reports", async (req, res) => {
  try {
    const campusId = req.campusId;
    const session = String(req.query.session || getCurrentSession()).trim();

    const [dueData, receipts, headWise] = await Promise.all([
      computeSessionDues(req, session),
      FeeReceipt.find({ campusId, session }).select("-rows").sort({ depositDate: -1, receiptSeq: -1 }).lean(),
      FeeReceipt.aggregate([
        { $match: { campusId, session, status: "Active" } },
        { $unwind: "$rows" },
        { $group: { _id: "$rows.feeHeadName", collected: { $sum: "$rows.paid" } } },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.status(200).json({
      success: true,
      data: {
        session,
        paymentModes: PAYMENT_MODES,
        periods: dueData.periods,
        receipts,
        headWise: headWise.map((h) => ({ feeHeadName: h._id, collected: round2(h.collected) })),
        dues: dueData.dues,
      },
    });
  } catch (error) {
    serverError(res, error);
  }
});

module.exports = router;
