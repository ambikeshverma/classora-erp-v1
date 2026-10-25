const mongoose = require("mongoose");

const concessionSchema = new mongoose.Schema(
  {
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SchoolAdmin",
      required: true,
      index: true,
    },
    concessionName: {
      type: String,
      required: true,
      trim: true,
    },
    concessionType: {
      type: String,
      enum: ["Percentage", "Amount"],
      default: "Percentage",
    },
    concessionValue: {
      type: Number,
      required: true,
      default: 0,
    },
    applicableFeeHeads: {
      type: [String],
      default: [],
    },
    applicableMonths: {
      type: [String],
      default: [],
    },
    feeScheme: {
      type: String,
      default: "Monthly",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

concessionSchema.index({ campusId: 1, concessionName: 1 }, { unique: true });

module.exports = mongoose.model("Concession", concessionSchema);
