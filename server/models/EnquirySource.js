const mongoose = require("mongoose");

// Where an admission enquiry came from; managed in Reception Desk and used by Admission Enquiries
const enquirySourceSchema = new mongoose.Schema(
  {
    campusId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    schoolId: { type: mongoose.Schema.Types.ObjectId, index: true },
    sourceName: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

enquirySourceSchema.index({ campusId: 1, sourceName: 1 }, { unique: true });

module.exports = mongoose.models.EnquirySource || mongoose.model("EnquirySource", enquirySourceSchema);
