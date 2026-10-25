const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SchoolAdmin",
      required: true,
      index: true,
    },
    departmentName: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

departmentSchema.index({ campusId: 1, departmentName: 1 }, { unique: true });

module.exports = mongoose.model("Department", departmentSchema);
