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
    createdBy: {
      type: String,
      default: "School Admin",
    },
  },
  { timestamps: true }
);

feePlanSchema.index({ campusId: 1, className: 1, feePlanName: 1 }, { unique: true });

module.exports = mongoose.model("FeePlan", feePlanSchema);
