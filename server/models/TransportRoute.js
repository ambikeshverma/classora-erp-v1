const mongoose = require("mongoose");

const transportRouteSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin", required: true, index: true },
    campusId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin", required: true, index: true },
    routeName: { type: String, required: true, trim: true },
    startPoint: { type: String, default: "", trim: true },
    endPoint: { type: String, default: "", trim: true },
    distance: { type: Number, default: 0 },
    monthlyFee: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

transportRouteSchema.index({ campusId: 1, routeName: 1 }, { unique: true });

module.exports = mongoose.models.TransportRoute || mongoose.model("TransportRoute", transportRouteSchema);
