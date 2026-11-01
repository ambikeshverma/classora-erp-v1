const mongoose = require("mongoose");

const examSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin", required: true, index: true },
    campusId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin", required: true, index: true },
    examName: { type: String, required: true, trim: true },
    // Class names exactly as created in Class Management
    applicableClasses: { type: [String], default: [] },
    allowCoScholastic: { type: Boolean, default: false },
  },
  { timestamps: true }
);

examSchema.index({ campusId: 1, examName: 1 }, { unique: true });

module.exports = mongoose.models.Exam || mongoose.model("Exam", examSchema);
