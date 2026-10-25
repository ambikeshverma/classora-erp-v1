const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SchoolAdmin",
      required: true,
      index: true,
    },
    subjectName: {
      type: String,
      required: true,
      trim: true,
    },
    subjectCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },
    subjectType: {
      type: String,
      enum: ["Scholastic", "Co-Scholastic"],
      default: "Scholastic",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

subjectSchema.index({ campusId: 1, subjectName: 1 }, { unique: true });

module.exports = mongoose.model("Subject", subjectSchema);
