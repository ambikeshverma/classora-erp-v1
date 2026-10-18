const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const SchoolAdmin = require("../models/schoolAdminSchema");
const schoolAuth = require("../middleware/schoolAuth");
const {
  generateSchoolTokens,
  verifyRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
} = require("../utils/tokenService");

/* ==========================================================
   SCHOOL AUTHENTICATION (DUAL TOKEN CONCEPT)
========================================================== */

// 🏫 1. School Login
router.post("/login", async (req, res) => {
  try {
    const { campusId, email, password } = req.body;

    if (!campusId || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Campus ID, Email, and Password are all required",
      });
    }

    const cleanCampusId = campusId.toUpperCase().trim();
    const cleanEmail = email.toLowerCase().trim();

    const school = await SchoolAdmin.findOne({
      campusId: cleanCampusId,
      email: cleanEmail,
    });

    if (!school) {
      return res.status(400).json({
        success: false,
        message: "Invalid Campus ID or Email address ❌",
      });
    }

    // 🛑 Check if school has been marked inactive by Super Admin
    if (!school.isActive) {
      return res.status(403).json({
        success: false,
        isDeactivated: true,
        message: "This school account has been deactivated by Super Admin. Please contact Classora Support.",
      });
    }

    const isMatch = await bcrypt.compare(password, school.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid Password ❌",
      });
    }

    // 🔑 Generate short-term Access Token & long-term Refresh Token
    const { accessToken, refreshToken } = generateSchoolTokens(school);

    // Save refresh token reference
    school.refreshToken = refreshToken;
    await school.save();

    // 🍪 Store refresh token in HTTP-only cookie
    setRefreshCookie(res, refreshToken, "refreshToken");

    // Return access token and school data (with schoolId included)
    res.json({
      success: true,
      message: "School Login Successful ✅",
      token: accessToken,
      accessToken,
      schoolId: school._id,
      campusId: school.campusId,
      schoolName: school.schoolName,
      name: school.schoolName,
      email: school.email,
      role: school.role,
      enabledModules: school.enabledModules || [],
      isActive: school.isActive,
      address: school.address,
      contactNo: school.contactNo,
      schoolLogo: school.schoolLogo,
    });
  } catch (err) {
    console.error("School Login Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 🔄 2. Refresh Access Token using Refresh Token in HTTP-Only Cookie
router.post("/refresh", async (req, res) => {
  try {
    const token =
      req.cookies?.refreshToken ||
      req.body?.refreshToken ||
      req.headers["x-refresh-token"];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Refresh token missing. Please log in again.",
      });
    }

    const decoded = verifyRefreshToken(token);

    if (!decoded.schoolId) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token payload",
      });
    }

    const school = await SchoolAdmin.findById(decoded.schoolId);

    if (!school) {
      return res.status(401).json({
        success: false,
        message: "School record not found",
      });
    }

    // 🛑 Check if school was deactivated after token was issued
    if (!school.isActive) {
      clearRefreshCookie(res, "refreshToken");
      return res.status(403).json({
        success: false,
        isDeactivated: true,
        message: "School account has been deactivated by Super Admin.",
      });
    }

    // Generate fresh tokens
    const { accessToken, refreshToken: newRefreshToken } = generateSchoolTokens(school);

    school.refreshToken = newRefreshToken;
    await school.save();

    setRefreshCookie(res, newRefreshToken, "refreshToken");

    res.json({
      success: true,
      token: accessToken,
      accessToken,
      schoolId: school._id,
      campusId: school.campusId,
      schoolName: school.schoolName,
      name: school.schoolName,
      enabledModules: school.enabledModules || [],
      isActive: school.isActive,
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
});

// 🚪 3. School Logout
router.post("/logout", async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      try {
        const decoded = verifyRefreshToken(token);
        if (decoded?.schoolId) {
          await SchoolAdmin.findByIdAndUpdate(decoded.schoolId, { refreshToken: null });
        }
      } catch (e) {
        // Ignore token decoding error on logout
      }
    }

    clearRefreshCookie(res, "refreshToken");
    res.json({
      success: true,
      message: "Logged out successfully ✅",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 👤 4. Get Current School Profile
router.get("/profile", schoolAuth, async (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.school._id,
      schoolId: req.school._id,
      campusId: req.school.campusId,
      schoolName: req.school.schoolName,
      principalName: req.school.principalName,
      email: req.school.email,
      contactNo: req.school.contactNo,
      address: req.school.address,
      website: req.school.website,
      schoolLogo: req.school.schoolLogo,
      enabledModules: req.school.enabledModules,
      isActive: req.school.isActive,
    },
  });
});

// 📢 5. Get Active Notices for This School (called by school dashboard)
router.get("/notices", schoolAuth, async (req, res) => {
  try {
    const school = await SchoolAdmin.findById(req.schoolId).select("notices");
    if (!school) return res.status(404).json({ success: false, message: "School not found" });

    const activeNotices = (school.notices || [])
      .filter((n) => n.isActive)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json({ success: true, notices: activeNotices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;