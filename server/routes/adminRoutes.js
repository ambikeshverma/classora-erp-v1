const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");
const SchoolAdmin = require("../models/schoolAdminSchema");
const superAdminAuth = require("../middleware/superAdminAuth");
const {
  generateSuperAdminTokens,
  verifyRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
} = require("../utils/tokenService");

/* ==========================================================
   SUPER ADMIN AUTHENTICATION
========================================================== */

// 👑 1. Initialize or Seed Super Admin
router.post("/init", async (req, res) => {
  try {
    const existingAdmin = await Admin.findOne();
    if (existingAdmin) {
      return res.status(200).json({
        success: true,
        message: "Super Admin already initialized",
        email: existingAdmin.email,
      });
    }

    const email = (process.env.SUPER_ADMIN_EMAIL || "admin@classora.com").toLowerCase();
    const rawPassword = process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin@2026";
    const name = process.env.SUPER_ADMIN_NAME || "Classora Super Admin";

    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const newAdmin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      role: "superAdmin",
    });

    res.status(201).json({
      success: true,
      message: "Initial Super Admin created successfully ✅",
      admin: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
      },
      note: "Use your environment or default credentials to login.",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 🔄 1b. Reset Super Admin — deletes existing and re-creates from .env
// ⚠️  Only use this during initial setup / credential recovery
router.post("/reset-super-admin", async (req, res) => {
  try {
    const { confirmReset } = req.body;
    if (confirmReset !== "CONFIRM_RESET") {
      return res.status(400).json({
        success: false,
        message: 'Send { "confirmReset": "CONFIRM_RESET" } in the request body to confirm.',
      });
    }

    // Delete all existing super admin records
    await Admin.deleteMany({});

    const email = (process.env.SUPER_ADMIN_EMAIL || "admin@classora.com").toLowerCase();
    const rawPassword = process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin@2026";
    const name = process.env.SUPER_ADMIN_NAME || "Classora Super Admin";

    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const newAdmin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      role: "superAdmin",
    });

    res.status(201).json({
      success: true,
      message: "Super Admin reset and re-created from .env values ✅",
      admin: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
      },
      loginWith: {
        email: newAdmin.email,
        password: rawPassword,
        url: "/super-admin/login",
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 🔐 2. Super Admin Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    let admin = await Admin.findOne({ email: email.toLowerCase().trim() });

    // Auto-create initial admin if none exists in the DB yet
    if (!admin) {
      const totalAdmins = await Admin.countDocuments();
      if (totalAdmins === 0) {
        const defaultEmail = (process.env.SUPER_ADMIN_EMAIL || "admin@classora.com").toLowerCase();
        const defaultPass = process.env.SUPER_ADMIN_PASSWORD || "SuperAdmin@2026";

        if (email.toLowerCase().trim() === defaultEmail && password === defaultPass) {
          const hashedPassword = await bcrypt.hash(defaultPass, 10);
          admin = await Admin.create({
            name: process.env.SUPER_ADMIN_NAME || "Classora Super Admin",
            email: defaultEmail,
            password: hashedPassword,
            role: "superAdmin",
          });
        }
      }
    }

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Invalid Super Admin credentials ❌",
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid Super Admin credentials ❌",
      });
    }

    const { accessToken, refreshToken } = generateSuperAdminTokens(admin);

    admin.refreshToken = refreshToken;
    await admin.save();

    setRefreshCookie(res, refreshToken, "superAdminRefreshToken");

    res.json({
      success: true,
      message: "Super Admin Login Successful ✅",
      accessToken,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 🔄 3. Super Admin Token Refresh
router.post("/refresh", async (req, res) => {
  try {
    const token =
      req.cookies?.superAdminRefreshToken ||
      req.body?.refreshToken ||
      req.headers["x-refresh-token"];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Refresh token missing",
      });
    }

    const decoded = verifyRefreshToken(token);

    if (decoded.role !== "superAdmin") {
      return res.status(403).json({
        success: false,
        message: "Invalid token role",
      });
    }

    const admin = await Admin.findById(decoded.adminId);
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Admin account not found",
      });
    }

    const { accessToken } = generateSuperAdminTokens(admin);

    res.json({
      success: true,
      accessToken,
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
});

// 🚪 4. Super Admin Logout
router.post("/logout", async (req, res) => {
  try {
    clearRefreshCookie(res, "superAdminRefreshToken");
    res.json({
      success: true,
      message: "Super Admin logged out successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 👤 5. Super Admin Profile
router.get("/me", superAdminAuth, async (req, res) => {
  res.json({
    success: true,
    admin: req.admin,
  });
});

/* ==========================================================
   SCHOOL MANAGEMENT (SUPER ADMIN PRIVILEGES)
========================================================== */

// 📋 6. Fetch all schools with summary stats
router.get("/schools", superAdminAuth, async (req, res) => {
  try {
    const schools = await SchoolAdmin.find()
      .select("-password -refreshToken")
      .sort({ createdAt: -1 });

    const totalSchools = schools.length;
    const activeSchools = schools.filter((s) => s.isActive).length;
    const inactiveSchools = totalSchools - activeSchools;

    res.json({
      success: true,
      stats: {
        totalSchools,
        activeSchools,
        inactiveSchools,
        allModulesCount: SchoolAdmin.DEFAULT_MODULES.length,
      },
      availableModules: SchoolAdmin.DEFAULT_MODULES,
      data: schools,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 🏫 7. Create a New School (with School ID / Campus ID and Credentials)
router.post("/schools", superAdminAuth, async (req, res) => {
  try {
    const {
      campusId,
      schoolName,
      principalName,
      email,
      password,
      contactNo,
      address,
      website,
      schoolLogo,
      principalSignature,
      enabledModules,
      isActive,
    } = req.body;

    if (!campusId || !schoolName || !principalName || !email || !password || !contactNo || !address) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields (Campus ID, School Name, Principal Name, Email, Password, Contact, Address)",
      });
    }

    const cleanCampusId = campusId.toUpperCase().trim();
    const cleanEmail = email.toLowerCase().trim();

    const existingSchool = await SchoolAdmin.findOne({
      $or: [{ campusId: cleanCampusId }, { email: cleanEmail }],
    });

    if (existingSchool) {
      if (existingSchool.campusId === cleanCampusId) {
        return res.status(409).json({
          success: false,
          message: `Campus ID / School ID '${cleanCampusId}' is already registered.`,
        });
      }
      return res.status(409).json({
        success: false,
        message: `Email '${cleanEmail}' is already registered to another school.`,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newSchool = await SchoolAdmin.create({
      campusId: cleanCampusId,
      schoolName: schoolName.trim(),
      principalName: principalName.trim(),
      email: cleanEmail,
      password: hashedPassword,
      contactNo: contactNo.trim(),
      address: address.trim(),
      website: (website || "").trim(),
      schoolLogo: schoolLogo || "",
      principalSignature: principalSignature || "",
      enabledModules: Array.isArray(enabledModules) && enabledModules.length > 0
        ? enabledModules
        : SchoolAdmin.DEFAULT_MODULES,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      role: "schoolAdmin",
    });

    res.status(201).json({
      success: true,
      message: `School '${newSchool.schoolName}' created successfully! ✅`,
      data: {
        id: newSchool._id,
        schoolId: newSchool._id,
        campusId: newSchool.campusId,
        schoolName: newSchool.schoolName,
        principalName: newSchool.principalName,
        email: newSchool.email,
        contactNo: newSchool.contactNo,
        address: newSchool.address,
        website: newSchool.website,
        isActive: newSchool.isActive,
        enabledModules: newSchool.enabledModules,
        createdAt: newSchool.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✏️ 8. Update School Info
router.put("/schools/:id", superAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      schoolName,
      principalName,
      contactNo,
      address,
      website,
      schoolLogo,
      principalSignature,
    } = req.body;

    const school = await SchoolAdmin.findById(id);
    if (!school) {
      return res.status(404).json({ success: false, message: "School not found" });
    }

    if (schoolName) school.schoolName = schoolName.trim();
    if (principalName) school.principalName = principalName.trim();
    if (contactNo) school.contactNo = contactNo.trim();
    if (address) school.address = address.trim();
    if (website !== undefined) school.website = website.trim();
    if (schoolLogo !== undefined) school.schoolLogo = schoolLogo;
    if (principalSignature !== undefined) school.principalSignature = principalSignature;

    await school.save();

    res.json({
      success: true,
      message: "School details updated successfully ✅",
      data: school,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ⚡ 9. Toggle Active/Inactive Status
router.patch("/schools/:id/toggle-status", superAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const school = await SchoolAdmin.findById(id);
    if (!school) {
      return res.status(404).json({ success: false, message: "School not found" });
    }

    const nextStatus = isActive !== undefined ? Boolean(isActive) : !school.isActive;
    school.isActive = nextStatus;

    // If deactivating, invalidate refresh token so immediate re-authentication fails
    if (!nextStatus) {
      school.refreshToken = null;
    }

    await school.save();

    res.json({
      success: true,
      message: `School '${school.schoolName}' is now ${nextStatus ? "Active 🟢" : "Inactive 🔴"}`,
      data: {
        id: school._id,
        campusId: school.campusId,
        schoolName: school.schoolName,
        isActive: school.isActive,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 🧩 10. Update Enabled Functionality/Modules for School
router.patch("/schools/:id/modules", superAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { enabledModules } = req.body;

    if (!Array.isArray(enabledModules)) {
      return res.status(400).json({
        success: false,
        message: "enabledModules must be an array of module identifiers",
      });
    }

    const school = await SchoolAdmin.findById(id);
    if (!school) {
      return res.status(404).json({ success: false, message: "School not found" });
    }

    school.enabledModules = enabledModules;
    await school.save();

    res.json({
      success: true,
      message: `Updated module permissions for '${school.schoolName}' (${enabledModules.length} active) ✅`,
      data: {
        id: school._id,
        campusId: school.campusId,
        schoolName: school.schoolName,
        enabledModules: school.enabledModules,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 🔑 11. Reset School Password
router.patch("/schools/:id/reset-password", superAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    const school = await SchoolAdmin.findById(id);
    if (!school) {
      return res.status(404).json({ success: false, message: "School not found" });
    }

    school.password = await bcrypt.hash(newPassword, 10);
    school.refreshToken = null; // force re-login
    await school.save();

    res.json({
      success: true,
      message: `Password reset successfully for '${school.schoolName}' ✅`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 🗑️ 12. Delete School
router.delete("/schools/:id", superAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const school = await SchoolAdmin.findByIdAndDelete(id);

    if (!school) {
      return res.status(404).json({ success: false, message: "School not found" });
    }

    res.json({
      success: true,
      message: `School '${school.schoolName}' has been removed successfully.`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ==========================================================
   NOTICE / ANNOUNCEMENT MANAGEMENT (SUPER ADMIN → SCHOOLS)
========================================================== */

// 📢 13. Add a Notice to a specific school
router.post("/schools/:id/notices", superAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, message, type } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: "Notice message is required" });
    }

    const school = await SchoolAdmin.findById(id);
    if (!school) return res.status(404).json({ success: false, message: "School not found" });

    school.notices.push({
      title: (title || "").trim(),
      message: message.trim(),
      type: type || "info",
      isActive: true,
      createdBy: req.admin?.name || "Super Admin",
    });
    await school.save();

    const addedNotice = school.notices[school.notices.length - 1];
    res.status(201).json({
      success: true,
      message: `Notice sent to '${school.schoolName}' ✅`,
      notice: addedNotice,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 📋 14. Get all notices for a school
router.get("/schools/:id/notices", superAdminAuth, async (req, res) => {
  try {
    const school = await SchoolAdmin.findById(req.params.id).select("schoolName campusId notices");
    if (!school) return res.status(404).json({ success: false, message: "School not found" });

    res.json({
      success: true,
      schoolName: school.schoolName,
      campusId: school.campusId,
      notices: (school.notices || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ✏️ 15. Toggle notice active/inactive
router.patch("/schools/:id/notices/:noticeId/toggle", superAdminAuth, async (req, res) => {
  try {
    const { id, noticeId } = req.params;
    const school = await SchoolAdmin.findById(id);
    if (!school) return res.status(404).json({ success: false, message: "School not found" });

    const notice = school.notices.id(noticeId);
    if (!notice) return res.status(404).json({ success: false, message: "Notice not found" });

    notice.isActive = !notice.isActive;
    await school.save();

    res.json({
      success: true,
      message: `Notice is now ${notice.isActive ? "Active 🟢" : "Hidden 🔴"}`,
      notice,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 🗑️ 16. Delete a notice
router.delete("/schools/:id/notices/:noticeId", superAdminAuth, async (req, res) => {
  try {
    const { id, noticeId } = req.params;
    const school = await SchoolAdmin.findById(id);
    if (!school) return res.status(404).json({ success: false, message: "School not found" });

    const notice = school.notices.id(noticeId);
    if (!notice) return res.status(404).json({ success: false, message: "Notice not found" });

    notice.deleteOne();
    await school.save();

    res.json({ success: true, message: "Notice deleted successfully ✅" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;