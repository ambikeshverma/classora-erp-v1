const mongoose = require("mongoose");

const vehicleDocumentSchema = new mongoose.Schema({
  documentType: { type: String, required: true, trim: true },
  fileName: { type: String, default: "" },
  fileUrl: { type: String, default: "" },
  uploadedAt: { type: Date, default: Date.now },
});

const vehicleSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin", required: true, index: true },
    campusId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin", required: true, index: true },

    vehicleName: { type: String, required: true, trim: true },
    vehicleNo: { type: String, default: undefined, trim: true, uppercase: true },
    madeYear: { type: String, default: "" },
    totalSeats: { type: Number, required: true, min: 1 },

    // Driver and conductor come from HR & Staff Management
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", default: null },
    driverName: { type: String, default: "" },
    driverMobile: { type: String, default: "" },
    conductorId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", default: null },
    conductorName: { type: String, default: "" },
    conductorMobile: { type: String, default: "" },

    documents: { type: [vehicleDocumentSchema], default: [] },
  },
  { timestamps: true }
);

vehicleSchema.index({ campusId: 1, vehicleName: 1 }, { unique: true });
// Vehicle number is optional, but unique per school when given
vehicleSchema.index(
  { campusId: 1, vehicleNo: 1 },
  { unique: true, partialFilterExpression: { vehicleNo: { $type: "string" } } }
);

module.exports = mongoose.models.Vehicle || mongoose.model("Vehicle", vehicleSchema);
