const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const schoolAuth = require("../middleware/schoolAuth");
const Department = require("../models/Department");
const Position = require("../models/Position");
const Staff = require("../models/Staff");
const SystemUser = require("../models/SystemUser");
const ClassTeacherAssignment = require("../models/ClassTeacherAssignment");
const SubjectTeacherAssignment = require("../models/SubjectTeacherAssignment");
const StaffLeave = require("../models/StaffLeave");
const SalaryStructure = require("../models/SalaryStructure");
const SalaryRecord = require("../models/SalaryRecord");

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Heavy base64 fields are left out of list responses and loaded one staff at a time
const STAFF_LIST_EXCLUDE = "-employeePhoto -documents.fileUrl";

const cleanDate = (value) => (/^\d{4}-\d{2}-\d{2}$/.test(String(value || "")) ? value : "");

// Staff are "working" when active and without a last working date
const isWorking = (staff) => staff.isActive !== false && !staff.lastWorkingDate;

// Session runs April-March, e.g. April 2026 -> 2026-2027
const sessionOf = (monthIndex, year) => {
  const start = monthIndex >= 3 ? Number(year) : Number(year) - 1;
  return `${start}-${start + 1}`;
};

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

router.use(schoolAuth, schoolAuth.checkModule("hr_staff"), schoolAdminOnly);

const fail = (res, status, message) => res.status(status).json({ success: false, message });

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const uploader = (req) => req.user?.name || req.school?.schoolName || "";

// Rejects another staff member of the same school using the same mobile / email
const findStaffConflict = async (req, { mobile, email, excludeId }) => {
  const base = { campusId: req.campusId };
  if (excludeId) base._id = { $ne: excludeId };

  if (mobile && (await Staff.exists({ ...base, mobile }))) return "Mobile number already exists";
  if (email && (await Staff.exists({ ...base, email }))) return "Email already exists";
  return "";
};

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
      .select(STAFF_LIST_EXCLUDE)
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
      .select("-documents.fileUrl")
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

const STAFF_FIELDS = [
  "gender", "joiningDate", "dob", "aadhaar", "pan", "religion", "community", "caste", "bloodGroup",
  "highestEducation", "localAddress", "state", "city", "postalCode", "permanentAddress", "bankName",
  "branchName", "accountNumber", "ifscCode", "schoolEmployeeCode", "biometricId", "resignationNoticeDate",
  "lastWorkingDate",
];

// Only the fields the client actually sent are written, so partial updates never blank other data
const pickStaffFields = (body) => {
  const out = {};
  STAFF_FIELDS.forEach((field) => {
    if (body[field] !== undefined) out[field] = typeof body[field] === "string" ? body[field].trim() : body[field];
  });
  if (body.employeePhoto !== undefined) out.employeePhoto = body.employeePhoto;
  return out;
};

const validateStaffInput = ({ mobile, email }) => {
  if (mobile && !/^[0-9]{10}$/.test(mobile)) return "Enter valid 10 digit mobile number";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter valid email address";
  return "";
};

// Department and position must belong to this school, and the position to that department
const checkOrgRefs = async (req, departmentId, positionId) => {
  if (!isValidId(departmentId) || !isValidId(positionId)) return "Invalid department or position";

  const [department, position] = await Promise.all([
    Department.exists({ _id: departmentId, campusId: req.campusId }),
    Position.exists({ _id: positionId, campusId: req.campusId, departmentId }),
  ]);

  if (!department) return "Department not found";
  if (!position) return "Selected position does not belong to the selected department";
  return "";
};

// CREATE staff
router.post("/staff", async (req, res) => {
  try {
    const { employeeName, mobile, departmentId, positionId, teachingStaff, employeeCode } = req.body;
    const email = req.body.email ? req.body.email.trim().toLowerCase() : "";

    if (!employeeName || !employeeName.trim() || !mobile || !mobile.trim() || !departmentId || !positionId) {
      return fail(res, 400, "Employee name, mobile, department, and position are required.");
    }

    const inputError = validateStaffInput({ mobile: mobile.trim(), email });
    if (inputError) return fail(res, 400, inputError);

    const orgError = await checkOrgRefs(req, departmentId, positionId);
    if (orgError) return fail(res, 400, orgError);

    const conflict = await findStaffConflict(req, { mobile: mobile.trim(), email });
    if (conflict) return fail(res, 400, conflict);

    // Auto-generate employee code if missing; skip codes already taken after deletions
    let code = employeeCode ? employeeCode.trim().toUpperCase() : "";
    if (code) {
      if (await Staff.exists({ campusId: req.campusId, employeeCode: code })) {
        return fail(res, 400, `Employee code '${code}' already exists`);
      }
    } else {
      const prefix = req.campusCode || "EMP";
      let next = (await Staff.countDocuments({ campusId: req.campusId })) + 1;
      do {
        code = `${prefix}-EMP-${String(next).padStart(4, "0")}`;
        next += 1;
      } while (await Staff.exists({ campusId: req.campusId, employeeCode: code }));
    }

    const staff = await Staff.create({
      ...pickStaffFields(req.body),
      campusId: req.campusId,
      employeeCode: code,
      employeeName: employeeName.trim(),
      mobile: mobile.trim(),
      email,
      departmentId,
      positionId,
      teachingStaff: teachingStaff === "Yes" ? "Yes" : "No",
      isActive: true,
      documents: [],
    });

    const populated = await Staff.findById(staff._id)
      .select(STAFF_LIST_EXCLUDE)
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
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid staff id");

    const current = await Staff.findOne({ _id: req.params.id, campusId: req.campusId })
      .select("mobile email departmentId positionId")
      .lean();
    if (!current) return fail(res, 404, "Staff not found");

    const mobile = req.body.mobile !== undefined ? String(req.body.mobile).trim() : current.mobile;
    const email = req.body.email !== undefined ? String(req.body.email).trim().toLowerCase() : current.email;
    const departmentId = req.body.departmentId || current.departmentId;
    const positionId = req.body.positionId || current.positionId;

    if (!mobile) return fail(res, 400, "Mobile number is required");
    if (req.body.employeeName !== undefined && !String(req.body.employeeName).trim()) {
      return fail(res, 400, "Employee name is required");
    }

    const inputError = validateStaffInput({ mobile, email });
    if (inputError) return fail(res, 400, inputError);

    const orgError = await checkOrgRefs(req, departmentId, positionId);
    if (orgError) return fail(res, 400, orgError);

    const conflict = await findStaffConflict(req, { mobile, email, excludeId: req.params.id });
    if (conflict) return fail(res, 400, conflict);

    const changes = { ...pickStaffFields(req.body), mobile, email, departmentId, positionId };
    if (req.body.employeeName !== undefined) changes.employeeName = String(req.body.employeeName).trim();
    if (req.body.teachingStaff !== undefined) changes.teachingStaff = req.body.teachingStaff === "Yes" ? "Yes" : "No";

    const updated = await Staff.findOneAndUpdate(
      { _id: req.params.id, campusId: req.campusId },
      { $set: changes },
      { new: true }
    )
      .select("-documents.fileUrl")
      .populate("departmentId", "departmentName")
      .populate("positionId", "positionName")
      .lean();

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
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid staff id");

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

    const hasSalary = await SalaryRecord.exists({ campusId: req.campusId, staffId: req.params.id });
    if (hasSalary) {
      return res.status(400).json({
        success: false,
        message: "This staff has generated salary records. Mark the staff inactive instead of deleting.",
      });
    }

    const deleted = await Staff.findOneAndDelete({
      _id: req.params.id,
      campusId: req.campusId,
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Staff not found" });
    }

    // Records that only make sense with the staff member
    await Promise.all([
      SalaryStructure.deleteMany({ campusId: req.campusId, staffId: req.params.id }),
      StaffLeave.deleteMany({ campusId: req.campusId, staffId: req.params.id }),
    ]);

    res.status(200).json({ success: true, message: "Staff deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ==========================================================
   STAFF DOCUMENTS (files are kept in the staff record)
========================================================== */
const MAX_DOCUMENT_CHARS = 8 * 1024 * 1024; // data URL length, roughly a 6MB file

const documentMeta = (doc) => ({
  _id: doc._id,
  documentName: doc.documentName,
  fileName: doc.fileName,
  uploadedBy: doc.uploadedBy,
  uploadedAt: doc.uploadedAt,
});

router.post("/staff/:id/documents", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid staff id");

    const { documentName, fileName, fileUrl } = req.body;
    if (!documentName || !String(documentName).trim() || !fileUrl) {
      return fail(res, 400, "Document type and file are required");
    }
    if (!String(fileUrl).startsWith("data:")) return fail(res, 400, "Invalid file data");
    if (String(fileUrl).length > MAX_DOCUMENT_CHARS) return fail(res, 400, "File is too large (max 6 MB)");

    const staff = await Staff.findOne({ _id: req.params.id, campusId: req.campusId }).select("documents");
    if (!staff) return fail(res, 404, "Staff not found");

    // Uploading a document type again replaces the earlier file
    const name = String(documentName).trim();
    staff.documents = staff.documents.filter((doc) => doc.documentName !== name);
    staff.documents.push({
      documentName: name,
      fileName: fileName || "",
      fileUrl,
      uploadedBy: uploader(req),
      uploadedAt: new Date(),
    });

    await staff.save();

    res.status(201).json({
      success: true,
      message: "Document uploaded successfully",
      data: staff.documents.map(documentMeta),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/staff/:id/documents/:docId", async (req, res) => {
  try {
    if (!isValidId(req.params.id) || !isValidId(req.params.docId)) return fail(res, 400, "Invalid id");

    const staff = await Staff.findOne({ _id: req.params.id, campusId: req.campusId }).select("documents").lean();
    const doc = staff?.documents?.find((item) => String(item._id) === req.params.docId);
    if (!doc) return fail(res, 404, "Document not found");

    res.status(200).json({ success: true, data: { fileName: doc.fileName, fileUrl: doc.fileUrl } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/staff/:id/documents/:docId", async (req, res) => {
  try {
    if (!isValidId(req.params.id) || !isValidId(req.params.docId)) return fail(res, 400, "Invalid id");

    const staff = await Staff.findOneAndUpdate(
      { _id: req.params.id, campusId: req.campusId, "documents._id": req.params.docId },
      { $pull: { documents: { _id: req.params.docId } } },
      { new: true }
    )
      .select("documents")
      .lean();

    if (!staff) return fail(res, 404, "Document not found");

    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
      data: staff.documents.map(documentMeta),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ==========================================================
   LEAVE MANAGEMENT (Connected with Attendance System and Salary)
========================================================== */

// GET Leaves
router.get("/leaves", async (req, res) => {
  try {
    const { status, staffId } = req.query;
    const filter = { campusId: req.campusId };
    if (status) filter.status = status;
    if (staffId && isValidId(staffId)) filter.staffId = staffId;

    const leaves = await StaffLeave.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, data: leaves });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

const validateLeaveDates = (fromDate, toDate) => {
  if (!cleanDate(fromDate) || !cleanDate(toDate)) return "Valid from date and to date are required";
  if (toDate < fromDate) return "To date cannot be before from date";
  return "";
};

// A staff member cannot have two live leaves covering the same day
const hasOverlappingLeave = (req, staffId, fromDate, toDate, excludeId) =>
  StaffLeave.exists({
    campusId: req.campusId,
    staffId,
    status: { $in: ["Approved", "Pending"] },
    fromDate: { $lte: toDate },
    toDate: { $gte: fromDate },
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  });

// CREATE Leave
router.post("/leaves", async (req, res) => {
  try {
    const { staffId, leaveType, fromDate, toDate, reason, status } = req.body;
    if (!staffId || !leaveType || !fromDate || !toDate) {
      return res.status(400).json({
        success: false,
        message: "Staff member, leave type, from date and to date are required",
      });
    }
    if (!isValidId(staffId)) return fail(res, 400, "Invalid staff member");

    const dateError = validateLeaveDates(fromDate, toDate);
    if (dateError) return fail(res, 400, dateError);

    const staff = await Staff.findOne({ _id: staffId, campusId: req.campusId })
      .populate("departmentId", "departmentName")
      .populate("positionId", "positionName");

    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff member not found" });
    }
    if (!isWorking(staff)) return fail(res, 400, "Leave can only be added for working staff");

    if (await hasOverlappingLeave(req, staff._id, fromDate, toDate)) {
      return fail(res, 400, "This staff member already has a leave in the selected dates");
    }

    const leave = new StaffLeave({
      schoolId: req.schoolId,
      campusId: req.campusId,
      staffId: staff._id,
      employeeCode: staff.employeeCode,
      employeeName: staff.employeeName,
      department: staff.departmentId?.departmentName || "",
      position: staff.positionId?.positionName || "",
      leaveType,
      fromDate,
      toDate,
      reason: reason || "",
      status: ["Approved", "Pending", "Rejected"].includes(status) ? status : "Approved",
    });

    await leave.save();
    res.status(201).json({ success: true, message: "Leave record created successfully", data: leave });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE Leave
router.put("/leaves/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid leave id");

    const { leaveType, fromDate, toDate, reason, status } = req.body;
    if (!leaveType) return fail(res, 400, "Leave type is required");

    const dateError = validateLeaveDates(fromDate, toDate);
    if (dateError) return fail(res, 400, dateError);

    const existing = await StaffLeave.findOne({ _id: req.params.id, campusId: req.campusId }).select("staffId").lean();
    if (!existing) {
      return res.status(404).json({ success: false, message: "Leave record not found" });
    }

    if (await hasOverlappingLeave(req, existing.staffId, fromDate, toDate, req.params.id)) {
      return fail(res, 400, "This staff member already has a leave in the selected dates");
    }

    const changes = { leaveType, fromDate, toDate, reason: reason || "" };
    if (["Approved", "Pending", "Rejected"].includes(status)) changes.status = status;

    const updated = await StaffLeave.findOneAndUpdate(
      { _id: req.params.id, campusId: req.campusId },
      { $set: changes },
      { new: true }
    );

    res.status(200).json({ success: true, message: "Leave record updated successfully", data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE Leave
router.delete("/leaves/:id", async (req, res) => {
  try {
    const deleted = await StaffLeave.findOneAndDelete({
      _id: req.params.id,
      campusId: req.campusId,
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Leave record not found" });
    }

    res.status(200).json({ success: true, message: "Leave record deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE Leave Status (Approve/Reject)
router.patch("/leaves/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Approved", "Pending", "Rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const updated = await StaffLeave.findOneAndUpdate(
      { _id: req.params.id, campusId: req.campusId },
      { $set: { status } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Leave record not found" });
    }

    res.status(200).json({ success: true, message: `Leave status updated to ${status}`, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ==========================================================
   META — departments, positions and working staff in one call
   (used by Leave, Salary and Reports screens)
========================================================== */
router.get("/meta", async (req, res) => {
  try {
    const campusId = req.campusId;

    const [departments, positions, staff] = await Promise.all([
      Department.find({ campusId }).select("departmentName").sort({ departmentName: 1 }).lean(),
      Position.find({ campusId }).select("positionName departmentId").sort({ positionName: 1 }).lean(),
      Staff.find({ campusId, isActive: { $ne: false }, lastWorkingDate: { $in: ["", null] } })
        .select("employeeCode employeeName departmentId positionId mobile")
        .sort({ employeeName: 1 })
        .lean(),
    ]);

    res.status(200).json({ success: true, data: { departments, positions, staff } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ==========================================================
   SALARY STRUCTURE
========================================================== */
const MONTH_INPUT = /^\d{4}-(0[1-9]|1[0-2])$/;

router.get("/salary-structures", async (req, res) => {
  try {
    const structures = await SalaryStructure.find({ campusId: req.campusId }).sort({ createdAt: 1 }).lean();

    const staff = await Staff.find({ _id: { $in: structures.map((item) => item.staffId) } })
      .select("employeeCode employeeName departmentId positionId")
      .lean();
    const staffMap = new Map(staff.map((item) => [String(item._id), item]));

    res.status(200).json({
      success: true,
      data: structures
        .filter((item) => staffMap.has(String(item.staffId)))
        .map((item) => {
          const member = staffMap.get(String(item.staffId));
          return {
            ...item,
            employeeCode: member.employeeCode,
            employeeName: member.employeeName,
            departmentId: member.departmentId,
            positionId: member.positionId,
          };
        }),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/salary-structures", async (req, res) => {
  try {
    const { staffId, effectiveFrom } = req.body;
    const monthlySalary = Number(req.body.monthlySalary);

    if (!staffId || !isValidId(staffId)) return fail(res, 400, "Employee is required");
    if (!(monthlySalary > 0)) return fail(res, 400, "Monthly salary must be greater than zero");
    if (!MONTH_INPUT.test(String(effectiveFrom || ""))) return fail(res, 400, "Valid effective month is required");

    const staff = await Staff.findOne({ _id: staffId, campusId: req.campusId })
      .select("isActive lastWorkingDate")
      .lean();
    if (!staff) return fail(res, 404, "Staff member not found");
    if (!isWorking(staff)) return fail(res, 400, "Salary structure can only be added for working staff");

    if (await SalaryStructure.exists({ campusId: req.campusId, staffId })) {
      return fail(res, 400, "Salary structure already exists for this employee");
    }

    const created = await SalaryStructure.create({
      schoolId: req.schoolId,
      campusId: req.campusId,
      staffId,
      monthlySalary: round2(monthlySalary),
      effectiveFrom,
    });

    res.status(201).json({ success: true, message: "Salary structure added successfully", data: created });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/salary-structures/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid salary structure id");

    const monthlySalary = Number(req.body.monthlySalary);
    if (!(monthlySalary > 0)) return fail(res, 400, "Monthly salary must be greater than zero");
    if (!MONTH_INPUT.test(String(req.body.effectiveFrom || ""))) return fail(res, 400, "Valid effective month is required");

    const updated = await SalaryStructure.findOneAndUpdate(
      { _id: req.params.id, campusId: req.campusId },
      { $set: { monthlySalary: round2(monthlySalary), effectiveFrom: req.body.effectiveFrom } },
      { new: true }
    ).lean();

    if (!updated) return fail(res, 404, "Salary structure not found");

    res.status(200).json({ success: true, message: "Salary structure updated successfully", data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/salary-structures/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid salary structure id");

    const deleted = await SalaryStructure.findOneAndDelete({ _id: req.params.id, campusId: req.campusId });
    if (!deleted) return fail(res, 404, "Salary structure not found");

    res.status(200).json({ success: true, message: "Salary structure deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ==========================================================
   MONTHLY SALARY (leave deductions come from Leave Management)
========================================================== */
const PAYMENT_MODES = ["Cash", "Bank Transfer", "UPI", "Cheque"];

router.get("/salaries", async (req, res) => {
  try {
    const { month, year, staffId, departmentId, positionId, session } = req.query;
    const filter = { campusId: req.campusId };
    if (month) filter.month = month;
    if (year) filter.year = year;
    if (session) filter.session = session;
    if (staffId && isValidId(staffId)) filter.staffId = staffId;
    if (departmentId && isValidId(departmentId)) filter.departmentId = departmentId;
    if (positionId && isValidId(positionId)) filter.positionId = positionId;

    const records = await SalaryRecord.find(filter)
      .select("-payments")
      .sort({ year: -1, createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Full record with payment history plus school details for the salary slip
router.get("/salaries/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid salary id");

    const record = await SalaryRecord.findOne({ _id: req.params.id, campusId: req.campusId }).lean();
    if (!record) return fail(res, 404, "Salary record not found");

    res.status(200).json({
      success: true,
      data: {
        ...record,
        school: {
          schoolName: req.school?.schoolName || "",
          address: req.school?.address || "",
          email: req.school?.email || "",
          phone: req.school?.contactNo || "",
          website: req.school?.website || "",
          logo: req.school?.schoolLogo || "",
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/salaries/generate", async (req, res) => {
  try {
    const { staffId, month, year } = req.body;
    const otherDeduction = round2(req.body.otherDeduction || 0);
    const monthIndex = MONTHS.indexOf(month);

    if (!staffId || !isValidId(staffId) || monthIndex === -1 || !/^\d{4}$/.test(String(year || ""))) {
      return fail(res, 400, "Employee, month and year are required");
    }
    if (otherDeduction < 0) return fail(res, 400, "Other deduction cannot be negative");

    const [staff, structure, existing] = await Promise.all([
      Staff.findOne({ _id: staffId, campusId: req.campusId })
        .populate("departmentId", "departmentName")
        .populate("positionId", "positionName")
        .lean(),
      SalaryStructure.findOne({ campusId: req.campusId, staffId }).lean(),
      SalaryRecord.exists({ campusId: req.campusId, staffId, month, year: String(year) }),
    ]);

    if (!staff) return fail(res, 404, "Staff member not found");
    if (!isWorking(staff)) return fail(res, 400, "Salary can only be generated for working staff");
    if (!structure) return fail(res, 400, "Salary structure not found for selected employee");
    if (existing) return fail(res, 400, "Salary already generated for this month");

    const monthKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
    if (monthKey < structure.effectiveFrom) {
      return fail(res, 400, `Salary structure is effective from ${structure.effectiveFrom}`);
    }

    const monthDays = new Date(Number(year), monthIndex + 1, 0).getDate();
    const monthStart = `${monthKey}-01`;
    const monthEnd = `${monthKey}-${String(monthDays).padStart(2, "0")}`;

    const leaves = await StaffLeave.find({
      campusId: req.campusId,
      staffId,
      status: "Approved",
      fromDate: { $lte: monthEnd },
      toDate: { $gte: monthStart },
    })
      .select("leaveType fromDate toDate")
      .lean();

    // Only the days that fall inside this month count
    let totalLeave = 0;
    let paidLeave = 0;
    leaves.forEach((leave) => {
      const from = new Date(leave.fromDate > monthStart ? leave.fromDate : monthStart);
      const to = new Date(leave.toDate < monthEnd ? leave.toDate : monthEnd);
      const days = Math.round((to - from) / 86400000) + 1;
      totalLeave += days;
      if (leave.leaveType === "Paid Leave") paidLeave += days;
    });

    const deductibleLeave = totalLeave - paidLeave;
    const grossSalary = round2(structure.monthlySalary);
    const leaveDeduction = round2((grossSalary / monthDays) * deductibleLeave);
    const netSalary = round2(grossSalary - leaveDeduction - otherDeduction);

    if (netSalary < 0) return fail(res, 400, "Deductions cannot be more than the gross salary");

    const record = await SalaryRecord.create({
      schoolId: req.schoolId,
      campusId: req.campusId,
      staffId,
      employeeCode: staff.employeeCode,
      employeeName: staff.employeeName,
      departmentId: staff.departmentId?._id || null,
      positionId: staff.positionId?._id || null,
      department: staff.departmentId?.departmentName || "",
      position: staff.positionId?.positionName || "",
      month,
      year: String(year),
      session: sessionOf(monthIndex, year),
      grossSalary,
      totalLeave,
      paidLeave,
      deductibleLeave,
      leaveDeduction,
      otherDeduction,
      netSalary,
      paidAmount: 0,
      remainingAmount: netSalary,
      paymentStatus: netSalary === 0 ? "Paid" : "Unpaid",
      generatedByName: uploader(req),
    });

    res.status(201).json({ success: true, message: "Salary generated successfully", data: record });
  } catch (error) {
    if (error.code === 11000) return fail(res, 400, "Salary already generated for this month");
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/salaries/:id/pay", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid salary id");

    const amount = round2(req.body.paymentAmount ?? req.body.amount);
    const { paymentDate, paymentMode } = req.body;

    if (!(amount > 0)) return fail(res, 400, "Enter valid payment amount");
    if (!cleanDate(paymentDate)) return fail(res, 400, "Valid payment date is required");
    if (!PAYMENT_MODES.includes(paymentMode)) return fail(res, 400, "Invalid payment mode");

    const record = await SalaryRecord.findOne({ _id: req.params.id, campusId: req.campusId })
      .select("netSalary paidAmount")
      .lean();
    if (!record) return fail(res, 404, "Salary record not found");

    const remaining = round2(record.netSalary - record.paidAmount);
    if (amount > remaining) return fail(res, 400, "Payment amount cannot be greater than remaining amount");

    const totalPaid = round2(record.paidAmount + amount);
    const status = totalPaid >= record.netSalary ? "Paid" : "Partially Paid";

    const text = (key) => String(req.body[key] || "").trim();

    // paidAmount in the filter guards against two payments being saved at the same moment
    const updated = await SalaryRecord.findOneAndUpdate(
      { _id: req.params.id, campusId: req.campusId, paidAmount: record.paidAmount },
      {
        $set: {
          paidAmount: totalPaid,
          remainingAmount: round2(record.netSalary - totalPaid),
          paymentStatus: status,
        },
        $push: {
          payments: {
            amount,
            paymentDate,
            paymentMode,
            remarks: text("remarks"),
            bankName: text("bankName"),
            transactionNumber: text("transactionNumber"),
            transactionDate: text("transactionDate"),
            upiAppName: text("upiAppName"),
            transactionId: text("transactionId"),
            chequeNumber: text("chequeNumber"),
            issueDate: text("issueDate"),
            paidByName: uploader(req),
          },
        },
      },
      { new: true }
    )
      .select("-payments")
      .lean();

    if (!updated) return fail(res, 409, "Salary was updated by someone else. Please refresh and try again.");

    res.status(200).json({ success: true, message: "Payment updated successfully", data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/salaries/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid salary id");

    const record = await SalaryRecord.findOne({ _id: req.params.id, campusId: req.campusId })
      .select("paidAmount")
      .lean();
    if (!record) return fail(res, 404, "Salary record not found");
    if (record.paidAmount > 0) return fail(res, 400, "Salary with payments cannot be deleted");

    await SalaryRecord.deleteOne({ _id: req.params.id });

    res.status(200).json({ success: true, message: "Salary record deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ==========================================================
   REPORTS — everything the HR report screen needs in one call
========================================================== */
router.get("/reports", async (req, res) => {
  try {
    const campusId = req.campusId;

    const [departments, positions, staff, leaves, structures, salaries] = await Promise.all([
      Department.find({ campusId }).select("departmentName").sort({ departmentName: 1 }).lean(),
      Position.find({ campusId }).select("positionName departmentId").sort({ positionName: 1 }).lean(),
      Staff.find({ campusId })
        .select("employeeCode employeeName departmentId positionId mobile email gender joiningDate isActive lastWorkingDate")
        .sort({ employeeName: 1 })
        .lean(),
      StaffLeave.find({ campusId, status: "Approved" }).sort({ fromDate: -1 }).lean(),
      SalaryStructure.find({ campusId }).lean(),
      SalaryRecord.find({ campusId }).select("-payments").sort({ year: -1, createdAt: -1 }).lean(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        departments,
        positions,
        staff,
        leaves,
        structures,
        salaries,
        school: {
          schoolName: req.school?.schoolName || "",
          address: req.school?.address || "",
          email: req.school?.email || "",
          phone: req.school?.contactNo || "",
          website: req.school?.website || "",
          logo: req.school?.schoolLogo || "",
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
