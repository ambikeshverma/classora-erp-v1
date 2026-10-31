const mongoose = require("mongoose");

const accountHeadSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin", required: true, index: true },
    campusId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin", required: true, index: true },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "AccountGroup", required: true },
    groupName: { type: String, required: true, trim: true },
    groupType: { type: String, enum: ["INCOME", "EXPENSE"], required: true },
    headName: { type: String, required: true, trim: true },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true }
);

accountHeadSchema.index({ campusId: 1, groupId: 1, headName: 1 }, { unique: true });

module.exports = mongoose.models.AccountHead || mongoose.model("AccountHead", accountHeadSchema);
