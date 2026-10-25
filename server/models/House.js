const mongoose = require("mongoose");

const houseSchema = new mongoose.Schema(
  {
    campusId:  { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    schoolId:  { type: mongoose.Schema.Types.ObjectId, index: true },
    houseName: { type: String, required: true, trim: true },
    houseCode: { type: String, default: "" },
    color:     { type: String, default: "" },
    captain:   { type: String, default: "" },
    isActive:  { type: Boolean, default: true },
  },
  { timestamps: true }
);

houseSchema.index({ campusId: 1, houseName: 1 });

module.exports = mongoose.models.House || mongoose.model("House", houseSchema);
