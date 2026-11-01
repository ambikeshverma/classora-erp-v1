const mongoose = require("mongoose");

// Lock / live state of one class section's results for a session
const resultStatusSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin", required: true, index: true },
    campusId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin", required: true, index: true },
    session: { type: String, required: true, trim: true },
    className: { type: String, required: true, trim: true },
    sectionName: { type: String, required: true, trim: true },
    isLocked: { type: Boolean, default: false },
    isClassLive: { type: Boolean, default: false },
  },
  { timestamps: true }
);

resultStatusSchema.index({ campusId: 1, session: 1, className: 1, sectionName: 1 }, { unique: true });

module.exports = mongoose.models.ResultStatus || mongoose.model("ResultStatus", resultStatusSchema);
