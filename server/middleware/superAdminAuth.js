const { verifyAccessToken } = require("../utils/tokenService");
const Admin = require("../models/Admin");

const superAdminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Super Admin token missing or malformed",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    if (decoded.role !== "superAdmin") {
      return res.status(403).json({
        success: false,
        message: "Access forbidden. Super Admin rights required.",
      });
    }

    const admin = await Admin.findById(decoded.adminId || decoded.id).select("-password");
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Super Admin account not found",
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
        isExpired: true,
      });
    }
    return res.status(401).json({
      success: false,
      message: "Invalid token",
    });
  }
};

module.exports = superAdminAuth;
