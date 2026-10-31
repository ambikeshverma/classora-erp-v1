const mongoose = require("mongoose");

// Atomic per campus + session sequence used for receipt numbers
const feeCounterSchema = new mongoose.Schema({
  campusId: { type: mongoose.Schema.Types.ObjectId, required: true },
  session: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

feeCounterSchema.index({ campusId: 1, session: 1 }, { unique: true });

module.exports = mongoose.models.FeeCounter || mongoose.model("FeeCounter", feeCounterSchema);
