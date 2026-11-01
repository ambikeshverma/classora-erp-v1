const mongoose = require("mongoose");

const feePlanSchema = new mongoose.Schema(
  {
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SchoolAdmin",
      required: true,
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      default: null,
    },
    className: {
      type: String,
      required: true,
      trim: true,
    },
    feePlanNameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FeePlanName",
      default: null,
    },
    feePlanName: {
      type: String,
      required: true,
      trim: true,
    },
    feeScheme: {
      type: String,
      required: true,
      default: "Monthly",
    },
    newStudentAmounts: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    oldStudentAmounts: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Totals of every amount in the matrices. Always computed by the server on save.
    newTotal: { type: Number, default: 0 },
    oldTotal: { type: Number, default: 0 },
    createdBy: {
      type: String,
      default: "School Admin",
    },
  },
  { timestamps: true }
);

feePlanSchema.index({ campusId: 1, className: 1, feePlanName: 1 }, { unique: true });

// Sum of every numeric amount in a { feeHead: { column: amount } } matrix
const sumAmounts = (matrix) => {
  let total = 0;
  Object.values(matrix || {}).forEach((columns) => {
    Object.values(columns || {}).forEach((value) => {
      const n = Number(value);
      if (Number.isFinite(n) && n > 0) total += n;
    });
  });
  return Math.round(total * 100) / 100;
};

// Plans saved before totals were stored have none: derive them from the amounts
const withTotals = (plan) => ({
  ...plan,
  newTotal: Number.isFinite(plan.newTotal) ? plan.newTotal : sumAmounts(plan.newStudentAmounts),
  oldTotal: Number.isFinite(plan.oldTotal) ? plan.oldTotal : sumAmounts(plan.oldStudentAmounts),
});

const FeePlan = mongoose.models.FeePlan || mongoose.model("FeePlan", feePlanSchema);
FeePlan.sumAmounts = sumAmounts;
FeePlan.withTotals = withTotals;

module.exports = FeePlan;
