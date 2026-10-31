const mongoose = require("mongoose");

const studentTransportSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin", required: true, index: true },
    campusId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin", required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Admission", required: true },
    session: { type: String, required: true, trim: true },
    routeId: { type: mongoose.Schema.Types.ObjectId, ref: "TransportRoute", required: true },
    routeName: { type: String, default: "" },
    monthlyFee: { type: Number, default: 0 },
    removedPeriods: { type: [String], default: [] },
  },
  { timestamps: true }
);

studentTransportSchema.index({ campusId: 1, studentId: 1, session: 1 }, { unique: true });
studentTransportSchema.index({ campusId: 1, session: 1 });
studentTransportSchema.index({ campusId: 1, routeId: 1 });

module.exports = mongoose.models.StudentTransport || mongoose.model("StudentTransport", studentTransportSchema);
