const AuditLog = require("../models/AuditLog");

// Records a Super Admin action. Never throws: auditing must not break the action itself.
const logAudit = async (req, { action, category = "school", school, summary = "", meta }) => {
  try {
    await AuditLog.create({
      actorId: req.admin?._id,
      actorName: req.admin?.name || "Super Admin",
      actorEmail: req.admin?.email || "",
      action,
      category,
      schoolId: school?._id,
      schoolName: school?.schoolName || "",
      summary,
      meta,
      ip: req.ip || "",
    });
  } catch (err) {
    console.error("Audit log failed:", err.message);
  }
};

module.exports = { logAudit };
