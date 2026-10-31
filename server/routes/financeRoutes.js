const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const schoolAuth = require("../middleware/schoolAuth");

const AccountGroup = require("../models/AccountGroup");
const AccountHead = require("../models/AccountHead");
const FinanceEntry = require("../models/FinanceEntry");

const { PAYMENT_MODES, round2, createEntry } = require("../utils/financeLedger");

// Every finance record is stored against the school/campus resolved from the access token (schoolAuth)
router.use(schoolAuth, schoolAuth.checkModule("finance"));

const TYPES = ["INCOME", "EXPENSE"];
const MAX_ATTACHMENT_CHARS = 4 * 1024 * 1024; // data URL length, roughly a 3MB file

const fail = (res, status, message) => res.status(status).json({ success: false, message });
const serverError = (res, error) => res.status(500).json({ success: false, message: error.message });
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const exactNameRegex = (name) => new RegExp(`^${escapeRegex(name.trim())}$`, "i");

const owner = (req) => ({ schoolId: req.schoolId, campusId: req.campusId });
const actorName = (req) => req.user?.name || req.school?.schoolName || "";

// Deposit / voucher dates are plain yyyy-mm-dd strings; allow a day of timezone slack
const isFutureDate = (dateStr) => dateStr > new Date(Date.now() + 14 * 60 * 60 * 1000).toISOString().split("T")[0];

const schoolInfoOf = (school) => ({
  schoolName: school?.schoolName || "",
  address: school?.address || "",
  email: school?.email || "",
  phone: school?.contactNo || "",
  website: school?.website || "",
  logo: school?.schoolLogo || "",
});

/* ==========================================================
   META — groups, active heads, payment modes and school info
   for the entry screens in one round trip
========================================================== */
router.get("/meta", async (req, res) => {
  try {
    const [groups, heads] = await Promise.all([
      AccountGroup.find({ campusId: req.campusId }).select("groupName groupType").sort({ groupName: 1 }).lean(),
      AccountHead.find({ campusId: req.campusId, status: "ACTIVE" })
        .select("headName groupId groupName groupType")
        .sort({ headName: 1 })
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      data: { groups, heads, paymentModes: PAYMENT_MODES, schoolInfo: schoolInfoOf(req.school) },
    });
  } catch (error) {
    serverError(res, error);
  }
});

/* ==========================================================
   ACCOUNT GROUPS
========================================================== */
router.get("/groups", async (req, res) => {
  try {
    const groups = await AccountGroup.find({ campusId: req.campusId }).sort({ groupName: 1 }).lean();
    res.status(200).json({ success: true, data: groups });
  } catch (error) {
    serverError(res, error);
  }
});

router.post("/groups", async (req, res) => {
  try {
    const groupName = String(req.body.groupName || "").trim();
    const { groupType } = req.body;

    if (!groupName || !TYPES.includes(groupType)) return fail(res, 400, "Please fill all fields");

    if (await AccountGroup.exists({ campusId: req.campusId, groupName: exactNameRegex(groupName) })) {
      return fail(res, 400, "Group already exists");
    }

    const group = await AccountGroup.create({ ...owner(req), groupName, groupType });
    res.status(201).json({ success: true, message: "Group created successfully", data: group });
  } catch (error) {
    serverError(res, error);
  }
});

router.put("/groups/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid group id");

    const groupName = String(req.body.groupName || "").trim();
    const { groupType } = req.body;
    if (!groupName || !TYPES.includes(groupType)) return fail(res, 400, "Please fill all fields");

    const group = await AccountGroup.findOne({ _id: req.params.id, campusId: req.campusId });
    if (!group) return fail(res, 404, "Group not found");
    if (group.isSystem) return fail(res, 400, "This group is created by the system and cannot be edited");

    if (
      await AccountGroup.exists({
        campusId: req.campusId,
        _id: { $ne: group._id },
        groupName: exactNameRegex(groupName),
      })
    ) {
      return fail(res, 400, "Group already exists");
    }

    if (groupType !== group.groupType && (await AccountHead.exists({ campusId: req.campusId, groupId: group._id }))) {
      return fail(res, 400, "Group type cannot be changed because account heads exist under this group");
    }

    group.groupName = groupName;
    group.groupType = groupType;
    await group.save();

    // Keep the names stored with heads and entries in step with the group
    await Promise.all([
      AccountHead.updateMany({ campusId: req.campusId, groupId: group._id }, { $set: { groupName } }),
      FinanceEntry.updateMany({ campusId: req.campusId, groupId: group._id }, { $set: { groupName } }),
    ]);

    res.status(200).json({ success: true, message: "Group updated successfully", data: group });
  } catch (error) {
    serverError(res, error);
  }
});

router.delete("/groups/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid group id");

    const group = await AccountGroup.findOne({ _id: req.params.id, campusId: req.campusId }).lean();
    if (!group) return fail(res, 404, "Group not found");
    if (group.isSystem) return fail(res, 400, "This group is created by the system and cannot be deleted");

    const [hasHeads, hasEntries] = await Promise.all([
      AccountHead.exists({ campusId: req.campusId, groupId: group._id }),
      FinanceEntry.exists({ campusId: req.campusId, groupId: group._id }),
    ]);
    if (hasHeads || hasEntries) return fail(res, 400, "Group already in use. Cannot delete.");

    await AccountGroup.deleteOne({ _id: group._id });
    res.status(200).json({ success: true, message: "Group deleted successfully" });
  } catch (error) {
    serverError(res, error);
  }
});

/* ==========================================================
   ACCOUNT HEADS
========================================================== */
router.get("/heads", async (req, res) => {
  try {
    const heads = await AccountHead.find({ campusId: req.campusId }).sort({ groupName: 1, headName: 1 }).lean();
    res.status(200).json({ success: true, data: heads });
  } catch (error) {
    serverError(res, error);
  }
});

router.post("/heads", async (req, res) => {
  try {
    const headName = String(req.body.headName || "").trim();
    const { groupId } = req.body;

    if (!groupId || !isValidId(groupId) || !headName) {
      return fail(res, 400, "Please select group and enter head name");
    }

    const group = await AccountGroup.findOne({ _id: groupId, campusId: req.campusId }).lean();
    if (!group) return fail(res, 404, "Account group not found");

    if (await AccountHead.exists({ campusId: req.campusId, groupId, headName: exactNameRegex(headName) })) {
      return fail(res, 400, "This account head already exists in selected group");
    }

    const head = await AccountHead.create({
      ...owner(req),
      groupId: group._id,
      groupName: group.groupName,
      groupType: group.groupType,
      headName,
    });

    res.status(201).json({ success: true, message: "Account head created successfully", data: head });
  } catch (error) {
    serverError(res, error);
  }
});

router.put("/heads/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid head id");

    const headName = String(req.body.headName || "").trim();
    const { groupId } = req.body;
    if (!groupId || !isValidId(groupId) || !headName) {
      return fail(res, 400, "Please select group and enter head name");
    }

    const [head, group] = await Promise.all([
      AccountHead.findOne({ _id: req.params.id, campusId: req.campusId }),
      AccountGroup.findOne({ _id: groupId, campusId: req.campusId }).lean(),
    ]);
    if (!head) return fail(res, 404, "Account head not found");
    if (!group) return fail(res, 404, "Account group not found");
    if (head.isSystem) return fail(res, 400, "This account head is created by the system and cannot be edited");

    if (
      await AccountHead.exists({
        campusId: req.campusId,
        _id: { $ne: head._id },
        groupId,
        headName: exactNameRegex(headName),
      })
    ) {
      return fail(res, 400, "This account head already exists in selected group");
    }

    const groupChanged = String(head.groupId) !== String(group._id);
    if (groupChanged && (await FinanceEntry.exists({ campusId: req.campusId, headId: head._id }))) {
      return fail(res, 400, "Group cannot be changed because entries already exist for this head");
    }

    head.headName = headName;
    head.groupId = group._id;
    head.groupName = group.groupName;
    head.groupType = group.groupType;
    await head.save();

    await FinanceEntry.updateMany({ campusId: req.campusId, headId: head._id }, { $set: { headName } });

    res.status(200).json({ success: true, message: "Account head updated successfully", data: head });
  } catch (error) {
    serverError(res, error);
  }
});

router.delete("/heads/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid head id");

    const head = await AccountHead.findOne({ _id: req.params.id, campusId: req.campusId }).lean();
    if (!head) return fail(res, 404, "Account head not found");
    if (head.isSystem) return fail(res, 400, "This account head is created by the system and cannot be deleted");

    if (await FinanceEntry.exists({ campusId: req.campusId, headId: head._id })) {
      return fail(res, 400, "Account Head is already in use. Cannot delete.");
    }

    await AccountHead.deleteOne({ _id: head._id });
    res.status(200).json({ success: true, message: "Account head deleted successfully" });
  } catch (error) {
    serverError(res, error);
  }
});

/* ==========================================================
   INCOME / EXPENSE ENTRIES
========================================================== */
router.get("/entries", async (req, res) => {
  try {
    const { type, voucher, from, to, status } = req.query;
    if (!TYPES.includes(type)) return fail(res, 400, "Entry type is required");

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);

    // Summary cards ignore the status filter so success and cancelled totals both stay visible
    const filter = { campusId: req.campusId, type };
    if (voucher && String(voucher).trim()) filter.voucherNo = new RegExp(escapeRegex(String(voucher).trim()), "i");
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }
    const listFilter = status ? { ...filter, status } : filter;

    const [items, total, sums] = await Promise.all([
      FinanceEntry.find(listFilter)
        .select("-attachmentUrl")
        .sort({ date: -1, voucherSeq: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      FinanceEntry.countDocuments(listFilter),
      FinanceEntry.aggregate([
        { $match: filter },
        { $group: { _id: "$status", amount: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
    ]);

    const summary = { totalEntries: 0, successAmount: 0, cancelledAmount: 0 };
    sums.forEach((item) => {
      summary.totalEntries += item.count;
      if (item._id === "SUCCESS") summary.successAmount = round2(item.amount);
      if (item._id === "Cancelled") summary.cancelledAmount = round2(item.amount);
    });

    res.status(200).json({
      success: true,
      data: { items, total, page, pages: Math.max(Math.ceil(total / limit), 1), summary },
    });
  } catch (error) {
    serverError(res, error);
  }
});

router.get("/entries/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid entry id");

    const entry = await FinanceEntry.findOne({ _id: req.params.id, campusId: req.campusId }).lean();
    if (!entry) return fail(res, 404, "Entry not found");

    res.status(200).json({ success: true, data: entry });
  } catch (error) {
    serverError(res, error);
  }
});

router.post("/entries", async (req, res) => {
  try {
    const { type, groupId, headId, date, partyRef, paymentMode, attachmentName, attachmentUrl } = req.body;
    const amount = Number(req.body.amount);
    const partyName = String(req.body.partyName || "").trim();

    if (!TYPES.includes(type)) return fail(res, 400, "Entry type is required");
    if (!groupId || !headId || !isValidId(groupId) || !isValidId(headId) || !date || !partyName || !paymentMode) {
      return fail(res, 400, "Please fill all required fields");
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) return fail(res, 400, "Valid date is required");
    if (isFutureDate(date)) return fail(res, 400, "Future date is not allowed");
    if (!(amount > 0)) return fail(res, 400, "Amount must be greater than zero");
    if (!PAYMENT_MODES.includes(paymentMode)) return fail(res, 400, "Invalid payment mode");

    if (attachmentUrl) {
      if (!String(attachmentUrl).startsWith("data:")) return fail(res, 400, "Invalid attachment");
      if (String(attachmentUrl).length > MAX_ATTACHMENT_CHARS) return fail(res, 400, "Attachment is too large (max 3 MB)");
    }

    const [group, head] = await Promise.all([
      AccountGroup.findOne({ _id: groupId, campusId: req.campusId }).lean(),
      AccountHead.findOne({ _id: headId, campusId: req.campusId }).lean(),
    ]);

    if (!group || !head || String(head.groupId) !== String(group._id)) {
      return fail(res, 400, "Selected account head does not belong to the selected group");
    }
    if (group.groupType !== type) return fail(res, 400, `Selected group is not an ${type.toLowerCase()} group`);
    if (head.status !== "ACTIVE") return fail(res, 400, "Selected account head is inactive");

    const text = (key) => String(req.body[key] || "").trim();

    const entry = await createEntry(owner(req), {
      type,
      date,
      amount,
      groupId: group._id,
      groupName: group.groupName,
      headId: head._id,
      headName: head.headName,
      partyRef: String(partyRef || "").trim(),
      partyName,
      paymentMode,
      bankName: paymentMode === "Cash" ? "" : text("bankName"),
      transactionNo: paymentMode === "Cash" ? "" : text("transactionNo"),
      transactionDate: paymentMode === "Cash" ? "" : text("transactionDate"),
      description: text("description"),
      attachmentName: attachmentUrl ? String(attachmentName || "") : "",
      attachmentUrl: attachmentUrl || "",
      source: "MANUAL",
      createdByName: actorName(req),
    });

    const { attachmentUrl: omitted, ...safeEntry } = entry.toObject();
    res.status(201).json({
      success: true,
      message: `${type === "INCOME" ? "Income" : "Expense"} entry saved successfully`,
      data: safeEntry,
    });
  } catch (error) {
    serverError(res, error);
  }
});

router.patch("/entries/:id/cancel", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid entry id");

    const entry = await FinanceEntry.findOne({ _id: req.params.id, campusId: req.campusId }).select("source status").lean();
    if (!entry) return fail(res, 404, "Entry not found");
    if (entry.status === "Cancelled") return fail(res, 400, "Entry is already cancelled");
    if (entry.source !== "MANUAL") {
      return fail(res, 400, "This entry was posted automatically. Cancel the original fee receipt or salary payment instead.");
    }

    const updated = await FinanceEntry.findOneAndUpdate(
      { _id: entry._id, campusId: req.campusId, status: "SUCCESS" },
      {
        $set: {
          status: "Cancelled",
          cancelReason: String(req.body.reason || "").trim(),
          cancelledAt: new Date(),
          cancelledByName: actorName(req),
        },
      },
      { new: true }
    )
      .select("-attachmentUrl")
      .lean();

    res.status(200).json({ success: true, message: "Entry cancelled successfully", data: updated });
  } catch (error) {
    serverError(res, error);
  }
});

/* ==========================================================
   REPORTS — every entry of the range plus the lists needed
   for the report filters, in one call
========================================================== */
router.get("/reports", async (req, res) => {
  try {
    const { from, to } = req.query;
    const filter = { campusId: req.campusId };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    }

    const [entries, groups, heads] = await Promise.all([
      FinanceEntry.find(filter).select("-attachmentUrl").sort({ date: 1, voucherSeq: 1 }).lean(),
      AccountGroup.find({ campusId: req.campusId }).select("groupName groupType").sort({ groupName: 1 }).lean(),
      AccountHead.find({ campusId: req.campusId }).select("headName groupName groupType").sort({ headName: 1 }).lean(),
    ]);

    res.status(200).json({
      success: true,
      data: { entries, groups, heads, paymentModes: PAYMENT_MODES, schoolInfo: schoolInfoOf(req.school) },
    });
  } catch (error) {
    serverError(res, error);
  }
});

module.exports = router;
