const PlatformSettings = require("../models/PlatformSettings");
const Subscription = require("../models/Subscription");
const BillingInvoice = require("../models/BillingInvoice");
const FeeCounter = require("../models/FeeCounter");
const Student = require("../models/Student");

const PLANS = [
  { name: "Monthly", months: 1 },
  { name: "Quarterly", months: 3 },
  { name: "Half-Yearly", months: 6 },
  { name: "Annual", months: 12 },
];

const DAY = 24 * 60 * 60 * 1000;

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;

const startOfTodayUTC = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
};

const getSettings = async () =>
  PlatformSettings.findOneAndUpdate(
    { key: "default" },
    { $setOnInsert: { key: "default" } },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  ).lean();

// start + months - 1 day (same rule the school billing page always used)
const addMonthsMinusOneDay = (start, months) => {
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + months);
  return new Date(end.getTime() - DAY);
};

// Derived status: None / Active / Grace / Expired
const subscriptionStatus = (subscription, settings, today = startOfTodayUTC()) => {
  if (!subscription || !subscription.expiryDate) return "None";
  const expiry = new Date(subscription.expiryDate);
  if (expiry >= today) return "Active";
  const graceEnd = new Date(expiry.getTime() + (settings?.gracePeriodDays || 0) * DAY);
  return graceEnd >= today ? "Grace" : "Expired";
};

// The next period starts the day after the current expiry; an expired or missing subscription restarts today
const nextPeriodStart = (subscription, today = startOfTodayUTC()) => {
  if (subscription?.expiryDate && new Date(subscription.expiryDate) >= today) {
    return new Date(new Date(subscription.expiryDate).getTime() + DAY);
  }
  return today;
};

const countBillingStudents = async (schoolId, settings) => {
  const [active, inactive] = await Promise.all([
    Student.countDocuments({ schoolId, status: "Active" }),
    Student.countDocuments({ schoolId, status: "Inactive" }),
  ]);
  return {
    activeStudents: active,
    inactiveStudents: inactive,
    billingStudents: settings.includeInactiveStudents ? active + inactive : active,
  };
};

const quote = (settings, plan, billingStudents) => {
  const discountPercent = settings.discounts?.[plan.name] || 0;
  const baseAmount = round2(billingStudents * settings.ratePerStudent * plan.months);
  const discountAmount = round2((baseAmount * discountPercent) / 100);
  const afterDiscount = baseAmount - discountAmount;
  const gstAmount = round2((afterDiscount * settings.gstPercent) / 100);
  return {
    plan: plan.name,
    months: plan.months,
    billingStudents,
    ratePerStudent: settings.ratePerStudent,
    baseAmount,
    discountPercent,
    discountAmount,
    gstPercent: settings.gstPercent,
    gstAmount,
    amount: round2(afterDiscount + gstAmount),
  };
};

// BILL-<campus>/<session>/<seq> with an atomic per-school counter
const nextBillNo = async (school) => {
  const now = new Date();
  const fyStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const session = `${fyStart}-${String(fyStart + 1).slice(-2)}`;
  const counter = await FeeCounter.findOneAndUpdate(
    { campusId: school._id, session: `bill-${session}` },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" }
  );
  return `BILL-${school.campusId}/${session}/${String(counter.seq).padStart(3, "0")}`;
};

// Builds (but does not save) an invoice for a plan, using the live settings and student counts
const buildInvoice = async (school, planName, settings, subscription) => {
  const plan = PLANS.find((p) => p.name === planName);
  if (!plan) return null;
  const counts = await countBillingStudents(school._id, settings);
  const q = quote(settings, plan, counts.billingStudents);
  const periodStart = nextPeriodStart(subscription);
  return {
    schoolId: school._id,
    campusCode: school.campusId,
    billNo: await nextBillNo(school),
    plan: plan.name,
    months: plan.months,
    periodStart,
    periodEnd: addMonthsMinusOneDay(periodStart, plan.months),
    billingStudents: q.billingStudents,
    ratePerStudent: q.ratePerStudent,
    baseAmount: q.baseAmount,
    discountPercent: q.discountPercent,
    gstPercent: q.gstPercent,
    amount: q.amount,
  };
};

// Applies a verified payment: extends the subscription to the invoice period end.
// Returns { subscription, reactivated } so callers can audit it.
const applyPaidInvoice = async (invoice, actorLabel) => {
  const SchoolAdmin = require("../models/schoolAdminSchema");
  const existing = await Subscription.findOne({ schoolId: invoice.schoolId });
  const keepsCurrentStart = existing?.expiryDate && new Date(existing.expiryDate) >= startOfTodayUTC();

  const subscription = await Subscription.findOneAndUpdate(
    { schoolId: invoice.schoolId },
    {
      $set: {
        plan: invoice.plan,
        expiryDate: invoice.periodEnd,
        updatedBy: actorLabel,
        ...(keepsCurrentStart && existing.startDate ? {} : { startDate: invoice.periodStart }),
      },
    },
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
  );

  // A payment never changes school access. Reactivating a suspended school is an explicit Super Admin action.
  const school = await SchoolAdmin.findById(invoice.schoolId).select("isActive").lean();
  return { subscription, schoolSuspended: school ? !school.isActive : false };
};

const normalizeTxn = (value) => String(value || "").trim().toLowerCase().replace(/\s+/g, "");

// What a School Admin may see about how to pay (no internal fields)
const publicPayment = (settings) => ({
  merchantName: settings.merchantName,
  upiId: settings.upiId,
  supportPhone: settings.supportPhone,
  supportEmail: settings.supportEmail,
  instructions: settings.paymentInstructions || "",
  accountDetails: settings.accountDetails || "",
  hasQr: Boolean(settings.paymentQrPath),
  proofRequired: settings.proofRequired !== false,
});

const toPublicInvoice = (inv) => ({
  id: inv._id,
  billNo: inv.billNo,
  plan: inv.plan,
  months: inv.months,
  periodStart: inv.periodStart,
  periodEnd: inv.periodEnd,
  billingStudents: inv.billingStudents,
  baseAmount: inv.baseAmount,
  discountPercent: inv.discountPercent,
  gstPercent: inv.gstPercent,
  amount: inv.amount,
  status: inv.status,
  source: inv.source,
  paymentMode: inv.paymentMode,
  transactionNo: inv.transactionNo,
  submittedAt: inv.submittedAt,
  paidAt: inv.paidAt,
  rejectReason: inv.rejectReason,
  amountPaid: inv.amountPaid,
  paymentDate: inv.paymentDate,
  payerName: inv.payerName,
  remarks: inv.remarks,
  hasProof: Boolean(inv.proofMime || inv.proofPath || inv.screenshot),
  createdAt: inv.createdAt,
});

module.exports = {
  PLANS,
  DAY,
  round2,
  startOfTodayUTC,
  getSettings,
  subscriptionStatus,
  nextPeriodStart,
  addMonthsMinusOneDay,
  countBillingStudents,
  quote,
  buildInvoice,
  applyPaidInvoice,
  toPublicInvoice,
  normalizeTxn,
  publicPayment,
  BillingInvoice,
};
