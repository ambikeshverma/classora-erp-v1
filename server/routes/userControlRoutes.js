const express = require("express");
const router = express.Router();
const schoolAuth = require("../middleware/schoolAuth");
const SystemUser = require("../models/SystemUser");
const Staff = require("../models/Staff");
const Class = require("../models/Class");
const Subject = require("../models/Subject");
const ClassTeacherAssignment = require("../models/ClassTeacherAssignment");
const SubjectTeacherAssignment = require("../models/SubjectTeacherAssignment");

// Role guard: Only schoolAdmin can manage User Control
const schoolAdminOnly = (req, res, next) => {
  const role = req.user?.role || req.school?.role;
  if (role && role !== "schoolAdmin" && role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access restricted: This feature is only accessible to School Admins.",
    });
  }
  next();
};

router.use(schoolAuth, schoolAdminOnly);

/* ==========================================================
   OPTIMIZED META ENDPOINT
   Provides dropdown data (classes, subjects, teaching staff)
   in a single, lean query to avoid repetitive network calls.
========================================================== */
router.get("/meta", async (req, res) => {
  try {
    const [classes, subjects, teachingStaff, allStaff] = await Promise.all([
      Class.find({ campusId: req.campusId }).select("className classCode sections").sort({ className: 1 }).lean(),
      Subject.find({ campusId: req.campusId, isActive: true }).select("subjectName subjectCode subjectType").sort({ subjectName: 1 }).lean(),
      Staff.find({ campusId: req.campusId, teachingStaff: "Yes", isActive: true })
        .select("employeeName employeeCode mobile email departmentId positionId teachingStaff isActive")
        .populate("departmentId", "departmentName")
        .populate("positionId", "positionName")
        .sort({ employeeName: 1 })
        .lean(),
      Staff.find({ campusId: req.campusId, isActive: true })
        .select("employeeName employeeCode mobile email departmentId positionId teachingStaff isActive")
        .populate("departmentId", "departmentName")
        .populate("positionId", "positionName")
        .sort({ employeeName: 1 })
        .lean(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        classes,
        subjects,
        teachingStaff,
        allStaff,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ==========================================================
   USER MANAGEMENT CRUD
========================================================== */

// GET system users with optional filters
router.get("/users", async (req, res) => {
  try {
    const filter = { campusId: req.campusId };

    if (req.query.userType) {
      filter.userType = req.query.userType;
    }

    if (req.query.status === "Active Users") {
      filter.isActive = true;
    } else if (req.query.status === "Inactive Users") {
      filter.isActive = false;
    }

    const users = await SystemUser.find(filter)
      .select("-password")
      .populate("employeeId", "employeeName employeeCode departmentId positionId")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// CREATE system user
router.post("/users", async (req, res) => {
  try {
    const {
      employeeId,
      userType,
      userName,
      displayName,
      mobile,
      email,
      defaultSession,
      password,
      isActive,
    } = req.body;

    if (!employeeId || !userType || !userName || !displayName || !defaultSession) {
      return res.status(400).json({
        success: false,
        message: "Employee, User Type, Username, Display Name, and Default Session are required.",
      });
    }

    // Verify staff belongs to this campus
    const staff = await Staff.findOne({ _id: employeeId, campusId: req.campusId });
    if (!staff) {
      return res.status(404).json({ success: false, message: "Selected staff member does not exist." });
    }

    // Check duplicate username for this campus
    const cleanUserName = userName.trim().toLowerCase();
    const existing = await SystemUser.findOne({
      campusId: req.campusId,
      userName: cleanUserName,
    });

    if (existing) {
      return res.status(400).json({ success: false, message: "Username already exists for this school." });
    }

    const user = await SystemUser.create({
      campusId: req.campusId,
      employeeId,
      employeeName: staff.employeeName,
      userType: userType.trim(),
      userName: cleanUserName,
      displayName: displayName.trim(),
      mobile: (mobile || staff.mobile || "").trim(),
      email: (email || staff.email || "").trim().toLowerCase(),
      defaultSession: defaultSession.trim(),
      password: password || "Classora@123", // default password
      isActive: isActive !== undefined ? isActive : true,
    });

    const safeUser = user.toObject();
    delete safeUser.password;

    res.status(201).json({ success: true, message: "User created successfully", data: safeUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE system user
router.put("/users/:id", async (req, res) => {
  try {
    const {
      userType,
      userName,
      displayName,
      mobile,
      email,
      defaultSession,
      isActive,
    } = req.body;

    const user = await SystemUser.findOne({ _id: req.params.id, campusId: req.campusId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (userName && userName.trim().toLowerCase() !== user.userName) {
      const duplicate = await SystemUser.findOne({
        campusId: req.campusId,
        _id: { $ne: req.params.id },
        userName: userName.trim().toLowerCase(),
      });
      if (duplicate) {
        return res.status(400).json({ success: false, message: "Username already in use." });
      }
      user.userName = userName.trim().toLowerCase();
    }

    if (userType) user.userType = userType.trim();
    if (displayName) user.displayName = displayName.trim();
    if (mobile !== undefined) user.mobile = mobile.trim();
    if (email !== undefined) user.email = email.trim().toLowerCase();
    if (defaultSession) user.defaultSession = defaultSession.trim();
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;

    res.status(200).json({ success: true, message: "User updated successfully", data: safeUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// TOGGLE user status
router.patch("/users/:id/toggle-status", async (req, res) => {
  try {
    const user = await SystemUser.findOne({ _id: req.params.id, campusId: req.campusId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User marked as ${user.isActive ? "Active" : "Inactive"}`,
      isActive: user.isActive,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// RESET password
router.post("/users/:id/reset-password", async (req, res) => {
  try {
    const user = await SystemUser.findOne({ _id: req.params.id, campusId: req.campusId });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.email) {
      return res.status(400).json({
        success: false,
        message: "No registered email found for this user. Please add an email address first.",
      });
    }

    // Generate random 8-character temporary password or reset notification
    const tempPassword = `Cls@${Math.floor(1000 + Math.random() * 9000)}`;
    user.password = tempPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: `Password reset successfully. A temporary password (${tempPassword}) has been set for ${user.email}.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE user
router.delete("/users/:id", async (req, res) => {
  try {
    const deleted = await SystemUser.findOneAndDelete({
      _id: req.params.id,
      campusId: req.campusId,
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ==========================================================
   CLASS TEACHER ASSIGNMENT CRUD
========================================================== */

// GET class teacher assignments
router.get("/class-teachers", async (req, res) => {
  try {
    const assignments = await ClassTeacherAssignment.find({ campusId: req.campusId })
      .populate("classId", "className classCode")
      .populate("classTeacher1Id", "employeeName employeeCode mobile email")
      .populate("classTeacher2Id", "employeeName employeeCode mobile email")
      .lean();

    res.status(200).json({ success: true, data: assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ASSIGN / UPDATE class teacher
router.post("/class-teachers/assign", async (req, res) => {
  try {
    const { classId, sectionId, sectionName, classTeacher1Id, classTeacher2Id } = req.body;

    if (!classId || !sectionId) {
      return res.status(400).json({ success: false, message: "Class and Section are required." });
    }

    if (classTeacher1Id && classTeacher2Id && classTeacher1Id === classTeacher2Id) {
      return res.status(400).json({
        success: false,
        message: "Class Teacher 1 and Class Teacher 2 cannot be the same person.",
      });
    }

    const assignment = await ClassTeacherAssignment.findOneAndUpdate(
      { campusId: req.campusId, classId, sectionId },
      {
        campusId: req.campusId,
        classId,
        sectionId,
        sectionName: sectionName || "",
        classTeacher1Id: classTeacher1Id || null,
        classTeacher2Id: classTeacher2Id || null,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
      .populate("classId", "className classCode")
      .populate("classTeacher1Id", "employeeName employeeCode")
      .populate("classTeacher2Id", "employeeName employeeCode")
      .lean();

    res.status(200).json({
      success: true,
      message: "Class teacher assigned successfully",
      data: assignment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE class teacher assignment
router.delete("/class-teachers/:id", async (req, res) => {
  try {
    const deleted = await ClassTeacherAssignment.findOneAndDelete({
      _id: req.params.id,
      campusId: req.campusId,
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    res.status(200).json({ success: true, message: "Assignment deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ==========================================================
   SUBJECT TEACHER ASSIGNMENT CRUD
========================================================== */

// GET subject teacher assignments (supports ?classId=...&sectionId=...)
router.get("/subject-teachers", async (req, res) => {
  try {
    const filter = { campusId: req.campusId };
    if (req.query.classId) filter.classId = req.query.classId;
    if (req.query.sectionId) filter.sectionId = req.query.sectionId;

    const assignments = await SubjectTeacherAssignment.find(filter)
      .populate("classId", "className classCode")
      .populate("subjectId", "subjectName subjectCode subjectType")
      .populate("teacherStaffId", "employeeName employeeCode mobile email")
      .lean();

    res.status(200).json({ success: true, data: assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ASSIGN / UPDATE subject teacher
router.post("/subject-teachers/assign", async (req, res) => {
  try {
    const { classId, sectionId, sectionName, subjectId, teacherStaffId } = req.body;

    if (!classId || !sectionId || !subjectId || !teacherStaffId) {
      return res.status(400).json({
        success: false,
        message: "Class, Section, Subject, and Teacher are all required.",
      });
    }

    const assignment = await SubjectTeacherAssignment.findOneAndUpdate(
      { campusId: req.campusId, classId, sectionId, subjectId },
      {
        campusId: req.campusId,
        classId,
        sectionId,
        sectionName: sectionName || "",
        subjectId,
        teacherStaffId,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
      .populate("classId", "className classCode")
      .populate("subjectId", "subjectName subjectCode subjectType")
      .populate("teacherStaffId", "employeeName employeeCode")
      .lean();

    res.status(200).json({
      success: true,
      message: "Subject teacher assigned successfully",
      data: assignment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE subject teacher assignment
router.delete("/subject-teachers/:id", async (req, res) => {
  try {
    const deleted = await SubjectTeacherAssignment.findOneAndDelete({
      _id: req.params.id,
      campusId: req.campusId,
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Assignment not found" });
    }

    res.status(200).json({ success: true, message: "Assignment deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
