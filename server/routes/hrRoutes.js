const express = require("express");
const router = express.Router();
const schoolAuth = require("../middleware/schoolAuth");
const Department = require("../models/Department");
const Position = require("../models/Position");
const Staff = require("../models/Staff");
const SystemUser = require("../models/SystemUser");
const ClassTeacherAssignment = require("../models/ClassTeacherAssignment");
const SubjectTeacherAssignment = require("../models/SubjectTeacherAssignment");

// Role guard: Only schoolAdmin can manage HR and Staff
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
   DEPARTMENT CRUD
========================================================== */

// GET all departments
router.get("/departments", async (req, res) => {
  try {
    const departments = await Department.find({ campusId: req.campusId })
      .sort({ departmentName: 1 })
      .lean();

    res.status(200).json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// CREATE department
router.post("/departments", async (req, res) => {
  try {
    const { departmentName } = req.body;
    if (!departmentName || !departmentName.trim()) {
      return res.status(400).json({ success: false, message: "Department name is required" });
    }

    const existing = await Department.findOne({
      campusId: req.campusId,
      departmentName: { $regex: new RegExp(`^${departmentName.trim()}$`, "i") },
    });

    if (existing) {
      return res.status(400).json({ success: false, message: "Department already exists" });
    }

    const department = await Department.create({
      campusId: req.campusId,
      departmentName: departmentName.trim(),
    });

    res.status(201).json({ success: true, message: "Department created successfully", data: department });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE department
router.put("/departments/:id", async (req, res) => {
  try {
    const { departmentName } = req.body;
    if (!departmentName || !departmentName.trim()) {
      return res.status(400).json({ success: false, message: "Department name is required" });
    }

    const duplicate = await Department.findOne({
      campusId: req.campusId,
      _id: { $ne: req.params.id },
      departmentName: { $regex: new RegExp(`^${departmentName.trim()}$`, "i") },
    });

    if (duplicate) {
      return res.status(400).json({ success: false, message: "Department name already in use" });
    }

    const updated = await Department.findOneAndUpdate(
      { _id: req.params.id, campusId: req.campusId },
      { departmentName: departmentName.trim() },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }

    res.status(200).json({ success: true, message: "Department updated successfully", data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE department
router.delete("/departments/:id", async (req, res) => {
  try {
    const isUsedInPosition = await Position.exists({
      campusId: req.campusId,
      departmentId: req.params.id,
    });
    if (isUsedInPosition) {
      return res.status(400).json({
        success: false,
        message: "This department is linked with Position Management and cannot be deleted.",
      });
    }

    const isUsedInStaff = await Staff.exists({
      campusId: req.campusId,
      departmentId: req.params.id,
    });
    if (isUsedInStaff) {
      return res.status(400).json({
        success: false,
        message: "This department is linked with Staff records and cannot be deleted.",
      });
    }

    const deleted = await Department.findOneAndDelete({
      _id: req.params.id,
      campusId: req.campusId,
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }

    res.status(200).json({ success: true, message: "Department deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ==========================================================
   POSITION CRUD
========================================================== */

// GET positions (optional department filter)
router.get("/positions", async (req, res) => {
  try {
    const filter = { campusId: req.campusId };
    if (req.query.departmentId) {
      filter.departmentId = req.query.departmentId;
    }

    const positions = await Position.find(filter)
      .populate("departmentId", "departmentName")
      .sort({ positionName: 1 })
      .lean();

    res.status(200).json({ success: true, data: positions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// CREATE position
router.post("/positions", async (req, res) => {
  try {
    const { departmentId, positionName } = req.body;
    if (!departmentId || !positionName || !positionName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Department and Position name are required",
      });
    }

    const existing = await Position.findOne({
      campusId: req.campusId,
      departmentId,
      positionName: { $regex: new RegExp(`^${positionName.trim()}$`, "i") },
    });

    if (existing) {
      return res.status(400).json({ success: false, message: "Position already exists in this department" });
    }

    const position = await Position.create({
      campusId: req.campusId,
      departmentId,
      positionName: positionName.trim(),
    });

    const populated = await Position.findById(position._id).populate("departmentId", "departmentName").lean();
    res.status(201).json({ success: true, message: "Position created successfully", data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE position
router.put("/positions/:id", async (req, res) => {
  try {
    const { departmentId, positionName } = req.body;
    if (!departmentId || !positionName || !positionName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Department and Position name are required",
      });
    }

    const duplicate = await Position.findOne({
      campusId: req.campusId,
      _id: { $ne: req.params.id },
      departmentId,
      positionName: { $regex: new RegExp(`^${positionName.trim()}$`, "i") },
    });

    if (duplicate) {
      return res.status(400).json({ success: false, message: "Position already exists in this department" });
    }

    const updated = await Position.findOneAndUpdate(
      { _id: req.params.id, campusId: req.campusId },
      { departmentId, positionName: positionName.trim() },
      { new: true }
    ).populate("departmentId", "departmentName");

    if (!updated) {
      return res.status(404).json({ success: false, message: "Position not found" });
    }

    res.status(200).json({ success: true, message: "Position updated successfully", data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE position
router.delete("/positions/:id", async (req, res) => {
  try {
    const isUsedInStaff = await Staff.exists({
      campusId: req.campusId,
      positionId: req.params.id,
    });
    if (isUsedInStaff) {
      return res.status(400).json({
        success: false,
        message: "This position is assigned to Staff and cannot be deleted.",
      });
    }

    const deleted = await Position.findOneAndDelete({
      _id: req.params.id,
      campusId: req.campusId,
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Position not found" });
    }

    res.status(200).json({ success: true, message: "Position deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ==========================================================
   STAFF CRUD
========================================================== */

// GET staff list (supports optimized query filters)
router.get("/staff", async (req, res) => {
  try {
    const filter = { campusId: req.campusId };
    if (req.query.teachingStaff) filter.teachingStaff = req.query.teachingStaff;
    if (req.query.departmentId) filter.departmentId = req.query.departmentId;
    if (req.query.positionId) filter.positionId = req.query.positionId;
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === "true";

    const staffList = await Staff.find(filter)
      .populate("departmentId", "departmentName")
      .populate("positionId", "positionName")
      .sort({ employeeName: 1 })
      .lean();

    res.status(200).json({ success: true, data: staffList });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single staff
router.get("/staff/:id", async (req, res) => {
  try {
    const staff = await Staff.findOne({
      _id: req.params.id,
      campusId: req.campusId,
    })
      .populate("departmentId", "departmentName")
      .populate("positionId", "positionName")
      .lean();

    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff not found" });
    }

    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// CREATE staff
router.post("/staff", async (req, res) => {
  try {
    const {
      employeeName,
      mobile,
      email,
      departmentId,
      positionId,
      teachingStaff,
      employeeCode,
      gender,
      joiningDate,
      dob,
      aadhaar,
      pan,
      religion,
      community,
      caste,
      bloodGroup,
      highestEducation,
      localAddress,
      state,
      city,
      postalCode,
      permanentAddress,
      bankName,
      branchName,
      accountNumber,
      ifscCode,
    } = req.body;

    if (!employeeName || !mobile || !departmentId || !positionId) {
      return res.status(400).json({
        success: false,
        message: "Employee name, mobile, department, and position are required.",
      });
    }

    // Auto-generate employee code if missing
    let code = employeeCode ? employeeCode.trim().toUpperCase() : "";
    if (!code) {
      const count = await Staff.countDocuments({ campusId: req.campusId });
      const prefix = req.campusCode || "EMP";
      code = `${prefix}-${String(count + 1).padStart(4, "0")}`;
    }

    const codeExists = await Staff.findOne({ campusId: req.campusId, employeeCode: code });
    if (codeExists) {
      return res.status(400).json({ success: false, message: `Employee code '${code}' already exists` });
    }

    const staff = await Staff.create({
      campusId: req.campusId,
      employeeCode: code,
      employeeName: employeeName.trim(),
      mobile: mobile.trim(),
      email: email ? email.trim().toLowerCase() : "",
      departmentId,
      positionId,
      teachingStaff: teachingStaff === "Yes" ? "Yes" : "No",
      gender: gender || "",
      joiningDate: joiningDate || "",
      dob: dob || "",
      aadhaar: aadhaar || "",
      pan: pan || "",
      religion: religion || "",
      community: community || "",
      caste: caste || "",
      bloodGroup: bloodGroup || "",
      highestEducation: highestEducation || "",
      localAddress: localAddress || "",
      state: state || "",
      city: city || "",
      postalCode: postalCode || "",
      permanentAddress: permanentAddress || "",
      bankName: bankName || "",
      branchName: branchName || "",
      accountNumber: accountNumber || "",
      ifscCode: ifscCode || "",
      isActive: true,
      documents: [],
    });

    const populated = await Staff.findById(staff._id)
      .populate("departmentId", "departmentName")
      .populate("positionId", "positionName")
      .lean();

    res.status(201).json({ success: true, message: "Staff created successfully", data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE staff
router.put("/staff/:id", async (req, res) => {
  try {
    const {
      employeeName,
      mobile,
      email,
      departmentId,
      positionId,
      teachingStaff,
      gender,
      joiningDate,
      dob,
      aadhaar,
      pan,
      religion,
      community,
      caste,
      bloodGroup,
      highestEducation,
      localAddress,
      state,
      city,
      postalCode,
      permanentAddress,
      bankName,
      branchName,
      accountNumber,
      ifscCode,
    } = req.body;

    const updated = await Staff.findOneAndUpdate(
      { _id: req.params.id, campusId: req.campusId },
      {
        employeeName: employeeName?.trim(),
        mobile: mobile?.trim(),
        email: email ? email.trim().toLowerCase() : "",
        departmentId,
        positionId,
        teachingStaff: teachingStaff === "Yes" ? "Yes" : "No",
        gender,
        joiningDate,
        dob,
        aadhaar,
        pan,
        religion,
        community,
        caste,
        bloodGroup,
        highestEducation,
        localAddress,
        state,
        city,
        postalCode,
        permanentAddress,
        bankName,
        branchName,
        accountNumber,
        ifscCode,
      },
      { new: true }
    )
      .populate("departmentId", "departmentName")
      .populate("positionId", "positionName")
      .lean();

    if (!updated) {
      return res.status(404).json({ success: false, message: "Staff not found" });
    }

    res.status(200).json({ success: true, message: "Staff updated successfully", data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// TOGGLE staff active/inactive
router.patch("/staff/:id/toggle-status", async (req, res) => {
  try {
    const staff = await Staff.findOne({ _id: req.params.id, campusId: req.campusId });
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff not found" });
    }

    staff.isActive = !staff.isActive;
    await staff.save();

    res.status(200).json({
      success: true,
      message: `Staff marked as ${staff.isActive ? "Active" : "Inactive"}`,
      isActive: staff.isActive,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE staff
router.delete("/staff/:id", async (req, res) => {
  try {
    // Check if linked to user control
    const isUser = await SystemUser.exists({ campusId: req.campusId, employeeId: req.params.id });
    if (isUser) {
      return res.status(400).json({
        success: false,
        message: "This staff has a login user account in User Control. Delete the user account first.",
      });
    }

    const isClassTeacher = await ClassTeacherAssignment.exists({
      campusId: req.campusId,
      $or: [{ classTeacher1Id: req.params.id }, { classTeacher2Id: req.params.id }],
    });
    if (isClassTeacher) {
      return res.status(400).json({
        success: false,
        message: "This staff is assigned as Class Teacher. Remove assignments first.",
      });
    }

    const isSubjectTeacher = await SubjectTeacherAssignment.exists({
      campusId: req.campusId,
      teacherStaffId: req.params.id,
    });
    if (isSubjectTeacher) {
      return res.status(400).json({
        success: false,
        message: "This staff is assigned as Subject Teacher. Remove assignments first.",
      });
    }

    const deleted = await Staff.findOneAndDelete({
      _id: req.params.id,
      campusId: req.campusId,
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Staff not found" });
    }

    res.status(200).json({ success: true, message: "Staff deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
