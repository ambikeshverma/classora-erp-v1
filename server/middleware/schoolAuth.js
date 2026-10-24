const { verifyAccessToken } = require("../utils/tokenService");
const SchoolAdmin = require("../models/schoolAdminSchema");

const schoolAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authorization token missing",
      });
    }

    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token missing",
      });
    }

    const decoded = verifyAccessToken(token);

    if (!decoded || !decoded.schoolId) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload: schoolId missing",
      });
    }

    const school = await SchoolAdmin.findById(decoded.schoolId).select("-password");

    if (!school) {
      return res.status(401).json({
        success: false,
        message: "School not found",
      });
    }

    if (!school.isActive) {
      return res.status(403).json({
        success: false,
        isDeactivated: true,
        message: "This school account is currently deactivated. Please contact Super Admin.",
      });
    }

    // Attach school information across all common naming patterns:
    // Models with campusId: ObjectId (like Class, Medium) use school._id
    // Models with schoolId: ObjectId (like Student, Admission) use school._id
    req.school = school;
    req.schoolId = school._id;
    req.campusId = school._id;
    req.campusCode = school.campusId;
    req.user = {
      id: school._id,
      schoolId: school._id,
      campusId: school._id,
      campusCode: school.campusId,
      name: school.schoolName,
      email: school.email,
      role: school.role || decoded.role || "schoolAdmin",
      enabledModules: school.enabledModules || [],
      ...decoded,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        isExpired: true,
        message: "Access token expired. Please refresh token.",
      });
    }
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

const checkModule = (moduleKey) => {
  return (req, res, next) => {
    if (!req.school) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const enabledModules = req.school.enabledModules || [];
    if (!enabledModules.includes(moduleKey)) {
      return res.status(403).json({
        success: false,
        isModuleDisabled: true,
        module: moduleKey,
        message: `The '${moduleKey}' module is disabled for your school. Please contact Super Admin to enable it.`,
      });
    }

    next();
  };
};

module.exports = schoolAuth;
module.exports.checkModule = checkModule;