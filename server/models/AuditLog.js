const mongoose = require("mongoose");

// Audit trail of sensitive Super Admin actions (school status, modules, billing, settings)
const auditLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId },
    actorName: { type: String, default: "Super Admin" },
    actorEmail: { type: String, default: "" },
    action: { type: String, required: true },
    category: {
      type: String,
      enum: ["school", "modules", "subscription", "billing", "settings", "announcement", "security"],
      default: "school",
    },
    schoolId: { type: mongoose.Schema.Types.ObjectId },
    schoolName: { type: String, default: "" },
    summary: { type: String, default: "" },
    meta: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ category: 1, createdAt: -1 });
auditLogSchema.index({ schoolId: 1, createdAt: -1 });

module.exports = mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);
