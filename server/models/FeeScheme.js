const mongoose = require("mongoose");

const feeHeadItemSchema = new mongoose.Schema(
  {
    feeHeadName: {
      type: String,
      required: true,
      trim: true,
    },
    feeType: {
      type: String,
      enum: ["Monthly", "Installment", "Quarterly", "Half Yearly", "Yearly"],
      default: "Monthly",
    },
    months: {
      type: String,
      default: "",
    },
    isUsedInFeePlan: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const feeSchemeSchema = new mongoose.Schema(
  {
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SchoolAdmin",
      required: true,
      unique: true,
      index: true,
    },
    schemeType: {
      type: String,
      enum: ["Monthly", "Installment", "Quarterly", "Half Yearly", "Yearly"],
      default: "Monthly",
    },
    installmentCount: {
      type: Number,
      default: 3,
    },
    feeHeads: {
      type: [feeHeadItemSchema],
      default: [],
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FeeScheme", feeSchemeSchema);
