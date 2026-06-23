const jwt = require("jsonwebtoken");
const SchoolAdmin = require("../models/schoolAdminSchema");


const schoolAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token missing",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const school = await SchoolAdmin.findById(decoded.schoolId).select("-password");

    if (!school) {
      return res.status(401).json({
        success: false,
        message: "School not found",
      });
    }

    req.school = school;
    req.campusId = school._id;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = schoolAuth;