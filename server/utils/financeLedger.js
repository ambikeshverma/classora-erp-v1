// Shared helpers for the Finance Manager ledger. Other modules (fee collection, salary) post their
// money movements here so income and expense reports always include them.
const AccountGroup = require("../models/AccountGroup");
const AccountHead = require("../models/AccountHead");
const FinanceEntry = require("../models/FinanceEntry");
const FeeCounter = require("../models/FeeCounter");

const PAYMENT_MODES = ["Cash", "UPI", "Bank Transfer", "Cheque", "Card"];

// Academic year (April-March) start year, used in voucher numbers
const yearOf = (dateStr) => {
  const date = new Date(dateStr);
  return String(date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1);
};

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// Per school + type + year running number; income -> 20260001, expense -> EXP20260001
const nextVoucher = async (campusId, type, year) => {
  const counter = await FeeCounter.findOneAndUpdate(
    { campusId, session: `finance:${type}:${year}` },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  const padded = String(counter.seq).padStart(4, "0");
  return { seq: counter.seq, voucherNo: type === "INCOME" ? `${year}${padded}` : `EXP${year}${padded}` };
};

// Saves an entry whose group/head are already validated
const createEntry = async ({ schoolId, campusId }, data) => {
  const year = yearOf(data.date);
  const voucher = await nextVoucher(campusId, data.type, year);

  return FinanceEntry.create({
    ...data,
    schoolId,
    campusId,
    amount: round2(data.amount),
    year,
    voucherSeq: voucher.seq,
    voucherNo: voucher.voucherNo,
  });
};

// Group + head used by automatic postings are created on first use and locked from editing
const ensureSystemHead = async ({ schoolId, campusId }, type, groupName, headName) => {
  const group = await AccountGroup.findOneAndUpdate(
    { campusId, groupName },
    { $setOnInsert: { schoolId, groupType: type, isSystem: true } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  if (group.groupType !== type) return null;

  const head = await AccountHead.findOneAndUpdate(
    { campusId, groupId: group._id, headName },
    { $setOnInsert: { schoolId, groupName, groupType: type, status: "ACTIVE", isSystem: true } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return { group, head };
};

/**
 * Posts an automatic entry (fee receipt, salary payment). It never throws: a ledger problem must not
 * block the money movement that triggered it. Schools without the Finance module are skipped.
 */
const postSystemEntry = async (req, { type, source, sourceId, groupName, headName, ...fields }) => {
  try {
    if (!(req.school?.enabledModules || []).includes("finance")) return null;
    if (!(Number(fields.amount) > 0)) return null;

    const ctx = { schoolId: req.schoolId, campusId: req.campusId };
    const target = await ensureSystemHead(ctx, type, groupName, headName);
    if (!target) return null;

    return await createEntry(ctx, {
      type,
      source,
      sourceId: String(sourceId),
      groupId: target.group._id,
      groupName: target.group.groupName,
      headId: target.head._id,
      headName: target.head.headName,
      createdByName: req.user?.name || req.school?.schoolName || "",
      ...fields,
    });
  } catch (error) {
    if (error.code !== 11000) console.error("Finance ledger posting failed:", error.message);
    return null;
  }
};

// Marks the automatic entry of a cancelled source record as cancelled
const cancelSystemEntry = async (req, source, sourceId, reason) => {
  try {
    await FinanceEntry.updateOne(
      { campusId: req.campusId, source, sourceId: String(sourceId), status: "SUCCESS" },
      {
        $set: {
          status: "Cancelled",
          cancelReason: reason || "Source record cancelled",
          cancelledAt: new Date(),
          cancelledByName: req.user?.name || req.school?.schoolName || "",
        },
      }
    );
  } catch (error) {
    console.error("Finance ledger cancel failed:", error.message);
  }
};

module.exports = { PAYMENT_MODES, yearOf, round2, createEntry, postSystemEntry, cancelSystemEntry };
