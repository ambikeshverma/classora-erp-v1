const { verifyAccessToken } = require("../utils/tokenService");
const { validateAndTouchSession } = require("../utils/sessionService");
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

    // 🛑 Check Session Status in UserSession collection (Force-Logout Enforcement)
    if (decoded && decoded.sessionId) {
      const sessionCheck = await validateAndTouchSession(decoded.sessionId, decoded, req);
      if (!sessionCheck.valid && sessionCheck.isForceLoggedOut) {
        return res.status(401).json({
          success: false,
          isForceLoggedOut: true,
          message: sessionCheck.reason || "Your session has been terminated by Super Admin. Please log in again.",
        });
      }
    }

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

const disabled = (res, moduleKey, subModule) =>
  res.status(403).json({
    success: false,
    isModuleDisabled: true,
    module: moduleKey,
    ...(subModule ? { subModule } : {}),
    message: subModule
      ? `The '${subModule}' feature is disabled for your school. Please contact Super Admin to enable it.`
      : `The '${moduleKey}' module is disabled for your school. Please contact Super Admin to enable it.`,
  });

// Sub-module entitlement: an absent entry for the module means "not restricted" (legacy schools)
const hasSubModule = (school, moduleKey, subKeys) => {
  const map = school.enabledSubModules;
  const list = map && typeof map.get === "function" ? map.get(moduleKey) : map?.[moduleKey];
  if (!Array.isArray(list)) return true;
  return subKeys.some((key) => list.includes(key));
};

/**
 * Path-aware guard for a router that serves one module.
 * rules: [{ re: /^\/vehicles/, method: "GET" (optional), sub: "vehicle_management" | [..] | null, open: true (optional) }]
 * - The first matching rule wins. `sub: null` means "module must be enabled, any sub-module".
 * - `open: true` lets any authenticated, active school through (read-only shared data).
 * - Unmatched paths only require the module.
 * Requires req.school (run after schoolAuth).
 */
const guardRoutes = (moduleKey, rules = []) => (req, res, next) => {
  if (!req.school) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  const rule = rules.find((r) => (!r.method || r.method === req.method) && r.re.test(req.path));
  if (rule?.open) return next();

  if (!(req.school.enabledModules || []).includes(moduleKey)) {
    return disabled(res, moduleKey);
  }

  const subs = rule?.sub ? (Array.isArray(rule.sub) ? rule.sub : [rule.sub]) : null;
  if (subs && !hasSubModule(req.school, moduleKey, subs)) {
    return disabled(res, moduleKey, subs[0]);
  }

  next();
};

// Shared endpoints: allowed when ANY of the given modules is enabled
const checkAnyModule = (moduleKeys) => (req, res, next) => {
  if (!req.school) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }
  const enabled = req.school.enabledModules || [];
  if (!moduleKeys.some((key) => enabled.includes(key))) {
    return disabled(res, moduleKeys[0]);
  }
  next();
};

module.exports = schoolAuth;
module.exports.checkModule = checkModule;
module.exports.guardRoutes = guardRoutes;
module.exports.checkAnyModule = checkAnyModule;
module.exports.hasSubModule = hasSubModule;