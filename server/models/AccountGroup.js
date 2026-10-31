const mongoose = require("mongoose");

const accountGroupSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin", required: true, index: true },
    campusId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin", required: true, index: true },
    groupName: { type: String, required: true, trim: true },
    groupType: { type: String, enum: ["INCOME", "EXPENSE"], required: true },
    // Groups created automatically by other modules (fee collection, salary) cannot be edited or deleted
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true }
);

accountGroupSchema.index({ campusId: 1, groupName: 1 }, { unique: true });

module.exports = mongoose.models.AccountGroup || mongoose.model("AccountGroup", accountGroupSchema);
