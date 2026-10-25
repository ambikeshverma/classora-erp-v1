const mongoose = require("mongoose");

const feePlanNameSchema = new mongoose.Schema(
  {
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SchoolAdmin",
      required: true,
      index: true,
    },
    feePlanName: {
      type: String,
      required: true,
      trim: true,
    },
    isUsed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

feePlanNameSchema.index({ campusId: 1, feePlanName: 1 }, { unique: true });

module.exports = mongoose.model("FeePlanName", feePlanNameSchema);
