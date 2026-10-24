/**
 * Role-Based Access Control (RBAC) Middleware
 * Checks whether the authenticated user has one of the allowed roles.
 * Supports checking roles case-insensitively.
 *
 * Usage:
 *   const roleAuth = require("../middleware/roleAuth");
 *   router.get("/protected-route", schoolAuth, roleAuth("schoolAdmin", "superAdmin"), handler);
 */

const roleAuth = (...allowedRoles) => {
  return (req, res, next) => {
    // Determine the role from req.user, req.admin, or req.school
    const userRole =
      req.user?.role ||
      req.admin?.role ||
      req.school?.role;

    if (!userRole) {
      return res.status(401).json({
        success: false,
        message: "Authentication required to verify permissions",
      });
    }

    if (!allowedRoles || allowedRoles.length === 0) {
      return next();
    }

    // Normalize roles (lowercase, trimmed, strip underscores/hyphens/spaces for resilient matching)
    const normalize = (r) => (r || "").toString().toLowerCase().replace(/[\s_-]/g, "");

    const normalizedUserRole = normalize(userRole);
    const hasPermission = allowedRoles.some(
      (role) => normalize(role) === normalizedUserRole
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        isRoleUnauthorized: true,
        userRole,
        allowedRoles,
        message: `Access denied. Role '${userRole}' is not authorized to access this resource.`,
      });
    }

    next();
  };
};

module.exports = roleAuth;
