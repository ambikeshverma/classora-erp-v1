const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const schoolAuth = require("../middleware/schoolAuth");

router.use(schoolAuth);

// Models
const Class = mongoose.models.Class || require("../models/Class");
const Medium = mongoose.models.Medium || require("../models/Medium");
const SiblingGroup = mongoose.models.SiblingGroup || require("../models/SiblingGroup");
const Admission = mongoose.models.Admission || require("../models/Admission");
const Student = mongoose.models.Student || require("../models/Student");

/* ══════════════════════════════════════════════════════════════
   INLINE MODELS (Section, House, StudentDocument, Promotion)
══════════════════════════════════════════════════════════════ */

// Section Model
const sectionSchema = new mongoose.Schema(
  {
    campusId:    { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    schoolId:    { type: mongoose.Schema.Types.ObjectId, index: true },
    sectionName: { type: String, required: true, trim: true },
    classId:     { type: mongoose.Schema.Types.ObjectId, ref: "Class", default: null },
    className:   { type: String, default: "" },
    capacity:    { type: Number, default: 0 },
    isActive:    { type: Boolean, default: true },
  },
  { timestamps: true }
);
sectionSchema.index({ campusId: 1, sectionName: 1 });
const Section = mongoose.models.Section || mongoose.model("Section", sectionSchema);

// House Model
const houseSchema = new mongoose.Schema(
  {
    campusId:  { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    schoolId:  { type: mongoose.Schema.Types.ObjectId, index: true },
    houseName: { type: String, required: true, trim: true },
    houseCode: { type: String, default: "" },
    color:     { type: String, default: "" },
    captain:   { type: String, default: "" },
    isActive:  { type: Boolean, default: true },
  },
  { timestamps: true }
);
houseSchema.index({ campusId: 1, houseName: 1 });
const House = mongoose.models.House || mongoose.model("House", houseSchema);

// Student Document Model
const studentDocumentSchema = new mongoose.Schema(
  {
    campusId:     { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    schoolId:     { type: mongoose.Schema.Types.ObjectId, index: true },
    studentId:    { type: mongoose.Schema.Types.ObjectId, ref: "Admission", required: true },
    studentName:  { type: String, required: true },
    className:    { type: String, default: "" },
    section:      { type: String, default: "" },
    rollNumber:   { type: String, default: "" },
    documentType: { type: String, required: true },
    documentUrl:  { type: String, default: "" },
    remarks:      { type: String, default: "" },
    uploadDate:   { type: String, default: "" },
  },
  { timestamps: true }
);
studentDocumentSchema.index({ campusId: 1, studentId: 1 });
const StudentDocument = mongoose.models.StudentDocument || mongoose.model("StudentDocument", studentDocumentSchema);

// Promotion Model
const promotionSchema = new mongoose.Schema(
  {
    campusId:       { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    schoolId:       { type: mongoose.Schema.Types.ObjectId, index: true },
    fromSession:    { type: String, required: true },
    toSession:      { type: String, required: true },
    fromClass:      { type: String, required: true },
    toClass:        { type: String, required: true },
    section:        { type: String, default: "" },
    promotedCount:  { type: Number, default: 0 },
    status:         { type: String, default: "Completed" },
    promotedAt:     { type: Date, default: Date.now },
  },
  { timestamps: true }
);
const Promotion = mongoose.models.Promotion || mongoose.model("Promotion", promotionSchema);

/* ══════════════════════════════════════════════════════════════
   HELPER: Student Normalizer
══════════════════════════════════════════════════════════════ */
const formatStudent = (s) => ({
  _id: s._id,
  id: s._id,
  studentName: s.studentName || s.name || s.fullName || "",
  fullName: s.studentName || s.name || s.fullName || "",
  admissionNo: s.schoolAdmissionNo || s.admissionNo || s.srNo || "",
  schoolAdmissionNo: s.schoolAdmissionNo || s.admissionNo || s.srNo || "",
  srNo: s.srNo || "",
  rollNo: s.rollNo || s.rollNumber || "",
  rollNumber: s.rollNumber || s.rollNo || "",
  className: s.className || s.class || "",
  class: s.className || s.class || "",
  sectionName: s.section || s.sectionName || "",
  section: s.section || s.sectionName || "",
  medium: s.medium || "",
  fatherName: s.fatherName || "",
  motherName: s.motherName || "",
  mobile: s.mobile || "",
  house: s.house || s.houseName || "",
  houseName: s.house || s.houseName || "",
  houseId: s.houseId || null,
  status: s.status || "Active",
  inactiveReason: s.inactiveReason || "",
  passYear: s.passYear || "",
  feePlan: s.feePlan || "",
  concessionPlan: s.concessionPlan || "",
  studentImage: s.studentImage || "",
  gender: s.gender || "",
  dob: s.dob || "",
  session: s.session || "",
  joiningSession: s.session || "",
  createdAt: s.createdAt,
});

const getSchoolScope = (req) => {
  const cid = req.campusId || req.schoolId;
  const sid = req.schoolId || req.campusId;
  return {
    $or: [{ campusId: cid }, { schoolId: sid }],
  };
};

/* ══════════════════════════════════════════════════════════════
   1. META ENDPOINT — Optimized batch load
══════════════════════════════════════════════════════════════ */
router.get("/meta", async (req, res) => {
  try {
    const cid = req.campusId || req.schoolId;
    const scope = getSchoolScope(req);

    const [classes, sections, mediums, houses, siblingGroups, totalStudents, activeStudents, inactiveStudents, alumniStudents] =
      await Promise.all([
        Class.find({ campusId: cid }).select("_id className classCode sections").sort({ className: 1 }).lean(),
        Section.find({ campusId: cid, isActive: true }).select("_id sectionName classId className capacity").sort({ sectionName: 1 }).lean(),
        Medium.find({ campusId: cid }).select("_id mediumName mediumCode").sort({ mediumName: 1 }).lean(),
        House.find({ campusId: cid, isActive: true }).select("_id houseName houseCode color captain").sort({ houseName: 1 }).lean(),
        SiblingGroup.find({ campusId: cid }).select("_id guardianName guardianMobileNo students").sort({ guardianName: 1 }).lean(),
        Admission.countDocuments(scope),
        Admission.countDocuments({ ...scope, status: "Active" }),
        Admission.countDocuments({ ...scope, status: "Inactive" }),
        Admission.countDocuments({ ...scope, status: "Alumni" }),
      ]);

    res.json({
      success: true,
      data: {
        classes: classes || [],
        sections: sections || [],
        mediums: mediums || [],
        houses: houses || [],
        siblingGroups: siblingGroups || [],
        stats: {
          totalStudents: totalStudents || 0,
          activeStudents: activeStudents || 0,
          inactiveStudents: inactiveStudents || 0,
          alumniStudents: alumniStudents || 0,
        },
      },
    });
  } catch (err) {
    console.error("StudentHub meta error:", err);
    res.status(500).json({ success: false, message: "Failed to load Student Hub metadata" });
  }
});

/* ══════════════════════════════════════════════════════════════
   2. CLASS MANAGEMENT CRUD
══════════════════════════════════════════════════════════════ */
router.get("/classes", async (req, res) => {
  try {
    const cid = req.campusId || req.schoolId;
    const classes = await Class.find({ campusId: cid }).sort({ className: 1 }).lean();
    res.json({ success: true, data: classes });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch classes" });
  }
});

router.post("/classes", async (req, res) => {
  try {
    const { className, classCode, sections } = req.body;
    const cid = req.campusId || req.schoolId;

    if (!className || !className.trim() || !classCode || !classCode.trim()) {
      return res.status(400).json({ success: false, message: "Class name and class code are required" });
    }

    const cleanName = className.trim();
    const cleanCode = classCode.trim().toUpperCase();

    const existingName = await Class.findOne({
      campusId: cid,
      className: { $regex: new RegExp(`^${cleanName}$`, "i") },
    });
    if (existingName) {
      return res.status(400).json({ success: false, message: `Class '${cleanName}' already exists` });
    }

    const existingCode = await Class.findOne({
      campusId: cid,
      classCode: cleanCode,
    });
    if (existingCode) {
      return res.status(400).json({ success: false, message: `Class code '${cleanCode}' is already in use` });
    }

    const newClass = await Class.create({
      campusId: cid,
      className: cleanName,
      classCode: cleanCode,
      sections: sections || [],
    });

    res.status(201).json({ success: true, data: newClass, message: "Class created successfully" });
  } catch (err) {
    console.error("Create class error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to create class" });
  }
});

router.put("/classes/:id", async (req, res) => {
  try {
    const { className, classCode, sections } = req.body;
    const cid = req.campusId || req.schoolId;

    if (!className || !className.trim() || !classCode || !classCode.trim()) {
      return res.status(400).json({ success: false, message: "Class name and class code are required" });
    }

    const cleanName = className.trim();
    const cleanCode = classCode.trim().toUpperCase();

    const duplicateName = await Class.findOne({
      campusId: cid,
      _id: { $ne: req.params.id },
      className: { $regex: new RegExp(`^${cleanName}$`, "i") },
    });
    if (duplicateName) {
      return res.status(400).json({ success: false, message: `Class '${cleanName}' already exists` });
    }

    const duplicateCode = await Class.findOne({
      campusId: cid,
      _id: { $ne: req.params.id },
      classCode: cleanCode,
    });
    if (duplicateCode) {
      return res.status(400).json({ success: false, message: `Class code '${cleanCode}' is already in use` });
    }

    const updated = await Class.findOneAndUpdate(
      { _id: req.params.id, campusId: cid },
      { $set: { className: cleanName, classCode: cleanCode, ...(sections ? { sections } : {}) } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    res.json({ success: true, data: updated, message: "Class updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to update class" });
  }
});

router.delete("/classes/:id", async (req, res) => {
  try {
    const cid = req.campusId || req.schoolId;
    const cls = await Class.findOne({ _id: req.params.id, campusId: cid });
    if (!cls) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    // Check if students exist in this class
    const studentCount = await Admission.countDocuments({
      ...getSchoolScope(req),
      className: cls.className,
    });
    if (studentCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete class '${cls.className}' because ${studentCount} student(s) are assigned to it.`,
      });
    }

    await Class.findByIdAndDelete(req.params.id);
    await Section.deleteMany({ campusId: cid, classId: req.params.id });

    res.json({ success: true, message: "Class deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to delete class" });
  }
});

/* ══════════════════════════════════════════════════════════════
   3. SECTION MANAGEMENT CRUD
══════════════════════════════════════════════════════════════ */
router.get("/sections", async (req, res) => {
  try {
    const cid = req.campusId || req.schoolId;
    const { classId, className } = req.query;
    const filter = { campusId: cid };
    if (classId) filter.classId = classId;
    if (className) filter.className = className;

    const sections = await Section.find(filter).sort({ className: 1, sectionName: 1 }).lean();
    res.json({ success: true, data: sections });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch sections" });
  }
});

router.post("/sections", async (req, res) => {
  try {
    const cid = req.campusId || req.schoolId;
    const { sectionName, classId, className, capacity, isActive } = req.body;

    if (!sectionName || !sectionName.trim()) {
      return res.status(400).json({ success: false, message: "Section name is required" });
    }

    let resolvedClassName = className || "";
    if (classId && !resolvedClassName) {
      const cls = await Class.findById(classId).lean();
      if (cls) resolvedClassName = cls.className;
    }

    // Check duplicate section for the class
    const duplicate = await Section.findOne({
      campusId: cid,
      sectionName: { $regex: new RegExp(`^${sectionName.trim()}$`, "i") },
      ...(classId ? { classId } : resolvedClassName ? { className: resolvedClassName } : {}),
    });
    if (duplicate) {
      return res.status(400).json({ success: false, message: `Section '${sectionName}' already exists for this class` });
    }

    const section = await Section.create({
      campusId: cid,
      schoolId: req.schoolId || cid,
      sectionName: sectionName.trim(),
      classId: classId || null,
      className: resolvedClassName,
      capacity: capacity ? Number(capacity) : 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    // Wire to Class.sections if class exists
    if (classId || resolvedClassName) {
      try {
        await Class.updateOne(
          { campusId: cid, ...(classId ? { _id: classId } : { className: resolvedClassName }) },
          { $addToSet: { sections: { sectionName: sectionName.trim(), sectionCode: sectionName.trim().toUpperCase() } } }
        );
      } catch (cErr) {
        console.warn("Class sections sync notice:", cErr.message);
      }
    }

    res.status(201).json({ success: true, data: section, message: "Section created successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to create section" });
  }
});

router.put("/sections/:id", async (req, res) => {
  try {
    const cid = req.campusId || req.schoolId;
    const { sectionName, classId, className, capacity, isActive } = req.body;

    const oldSec = await Section.findOne({ _id: req.params.id, campusId: cid });
    if (!oldSec) return res.status(404).json({ success: false, message: "Section not found" });

    let resolvedClassName = className || oldSec.className;
    if (classId && !className) {
      const cls = await Class.findById(classId).lean();
      if (cls) resolvedClassName = cls.className;
    }

    const updated = await Section.findOneAndUpdate(
      { _id: req.params.id, campusId: cid },
      {
        $set: {
          sectionName: sectionName ? sectionName.trim() : oldSec.sectionName,
          classId: classId || oldSec.classId,
          className: resolvedClassName,
          capacity: capacity !== undefined ? Number(capacity) : oldSec.capacity,
          isActive: isActive !== undefined ? isActive : oldSec.isActive,
        },
      },
      { new: true }
    );

    res.json({ success: true, data: updated, message: "Section updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to update section" });
  }
});

router.delete("/sections/:id", async (req, res) => {
  try {
    const cid = req.campusId || req.schoolId;
    const sec = await Section.findOneAndDelete({ _id: req.params.id, campusId: cid });
    if (!sec) return res.status(404).json({ success: false, message: "Section not found" });

    res.json({ success: true, message: "Section deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to delete section" });
  }
});

/* ══════════════════════════════════════════════════════════════
   4. MEDIUM MANAGEMENT CRUD
══════════════════════════════════════════════════════════════ */
router.get("/mediums", async (req, res) => {
  try {
    const cid = req.campusId || req.schoolId;
    const mediums = await Medium.find({ campusId: cid }).sort({ mediumName: 1 }).lean();
    res.json({ success: true, data: mediums });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch mediums" });
  }
});

router.post("/mediums", async (req, res) => {
  try {
    const cid = req.campusId || req.schoolId;
    const { mediumName, mediumCode } = req.body;

    if (!mediumName || !mediumName.trim() || !mediumCode || !mediumCode.trim()) {
      return res.status(400).json({ success: false, message: "Medium name and medium code are required" });
    }

    const cleanName = mediumName.trim();
    const cleanCode = mediumCode.trim().toUpperCase();

    const existing = await Medium.findOne({
      campusId: cid,
      $or: [
        { mediumName: { $regex: new RegExp(`^${cleanName}$`, "i") } },
        { mediumCode: cleanCode },
      ],
    });
    if (existing) {
      return res.status(400).json({ success: false, message: "Medium name or code already exists" });
    }

    const medium = await Medium.create({
      campusId: cid,
      mediumName: cleanName,
      mediumCode: cleanCode,
    });

    res.status(201).json({ success: true, data: medium, message: "Medium created successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to create medium" });
  }
});

router.put("/mediums/:id", async (req, res) => {
  try {
    const cid = req.campusId || req.schoolId;
    const { mediumName, mediumCode } = req.body;

    if (!mediumName || !mediumName.trim() || !mediumCode || !mediumCode.trim()) {
      return res.status(400).json({ success: false, message: "Medium name and medium code are required" });
    }

    const cleanName = mediumName.trim();
    const cleanCode = mediumCode.trim().toUpperCase();

    const duplicate = await Medium.findOne({
      campusId: cid,
      _id: { $ne: req.params.id },
      $or: [
        { mediumName: { $regex: new RegExp(`^${cleanName}$`, "i") } },
        { mediumCode: cleanCode },
      ],
    });
    if (duplicate) {
      return res.status(400).json({ success: false, message: "Medium name or code already exists" });
    }

    const updated = await Medium.findOneAndUpdate(
      { _id: req.params.id, campusId: cid },
      { $set: { mediumName: cleanName, mediumCode: cleanCode } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: "Medium not found" });

    res.json({ success: true, data: updated, message: "Medium updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to update medium" });
  }
});

router.delete("/mediums/:id", async (req, res) => {
  try {
    const cid = req.campusId || req.schoolId;
    const deleted = await Medium.findOneAndDelete({ _id: req.params.id, campusId: cid });
    if (!deleted) return res.status(404).json({ success: false, message: "Medium not found" });

    res.json({ success: true, message: "Medium deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to delete medium" });
  }
});

/* ══════════════════════════════════════════════════════════════
   5. HOUSE MANAGEMENT CRUD
══════════════════════════════════════════════════════════════ */
router.get("/houses", async (req, res) => {
  try {
    const cid = req.campusId || req.schoolId;
    const houses = await House.find({ campusId: cid }).sort({ houseName: 1 }).lean();
    res.json({ success: true, data: houses });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch houses" });
  }
});

router.post("/houses", async (req, res) => {
  try {
    const cid = req.campusId || req.schoolId;
    const { houseName, houseCode, color, captain, isActive } = req.body;

    if (!houseName || !houseName.trim()) {
      return res.status(400).json({ success: false, message: "House name is required" });
    }

    const cleanName = houseName.trim();
    const existing = await House.findOne({
      campusId: cid,
      houseName: { $regex: new RegExp(`^${cleanName}$`, "i") },
    });
    if (existing) {
      return res.status(400).json({ success: false, message: `House '${cleanName}' already exists` });
    }

    const house = await House.create({
      campusId: cid,
      schoolId: req.schoolId || cid,
      houseName: cleanName,
      houseCode: houseCode ? houseCode.trim().toUpperCase() : "",
      color: color || "",
      captain: captain || "",
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({ success: true, data: house, message: "House created successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to create house" });
  }
});

router.put("/houses/:id", async (req, res) => {
  try {
    const cid = req.campusId || req.schoolId;
    const { houseName, houseCode, color, captain, isActive } = req.body;

    if (houseName) {
      const duplicate = await House.findOne({
        campusId: cid,
        _id: { $ne: req.params.id },
        houseName: { $regex: new RegExp(`^${houseName.trim()}$`, "i") },
      });
      if (duplicate) {
        return res.status(400).json({ success: false, message: `House '${houseName.trim()}' already exists` });
      }
    }

    const updated = await House.findOneAndUpdate(
      { _id: req.params.id, campusId: cid },
      {
        $set: {
          ...(houseName ? { houseName: houseName.trim() } : {}),
          ...(houseCode !== undefined ? { houseCode: houseCode.trim().toUpperCase() } : {}),
          ...(color !== undefined ? { color } : {}),
          ...(captain !== undefined ? { captain } : {}),
          ...(isActive !== undefined ? { isActive } : {}),
        },
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: "House not found" });

    res.json({ success: true, data: updated, message: "House updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to update house" });
  }
});

router.delete("/houses/:id", async (req, res) => {
  try {
    const cid = req.campusId || req.schoolId;
    const deleted = await House.findOneAndDelete({ _id: req.params.id, campusId: cid });
    if (!deleted) return res.status(404).json({ success: false, message: "House not found" });

    res.json({ success: true, message: "House deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to delete house" });
  }
});

/* ══════════════════════════════════════════════════════════════
   6. HOUSE ALLOCATION
══════════════════════════════════════════════════════════════ */
router.get("/house-allocations", async (req, res) => {
  try {
    const scope = getSchoolScope(req);
    const { className, section, houseName, search } = req.query;

    const query = { ...scope, status: "Active" };
    if (className) query.className = className;
    if (section) query.section = section;
    if (houseName) query.house = houseName;
    if (search) {
      const rx = new RegExp(search.trim(), "i");
      query.$or = [{ studentName: rx }, { srNo: rx }, { schoolAdmissionNo: rx }, { rollNo: rx }, { rollNumber: rx }];
    }

    const students = await Admission.find(query)
      .select("_id studentName className section rollNo rollNumber house houseId schoolAdmissionNo srNo status")
      .sort({ className: 1, section: 1, studentName: 1 })
      .lean();

    res.json({ success: true, data: students.map(formatStudent) });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch house allocations" });
  }
});

router.patch("/house-allocations/:studentId", async (req, res) => {
  try {
    const scope = getSchoolScope(req);
    const { houseName, houseId } = req.body;

    const student = await Admission.findOneAndUpdate(
      { _id: req.params.studentId, ...scope },
      { $set: { house: houseName || "", houseId: houseId || null } },
      { new: true }
    );
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    // Sync Student model if present
    try {
      await Student.findOneAndUpdate(
        { _id: req.params.studentId },
        { $set: { house: houseName || "", houseId: houseId || null } }
      );
    } catch (e) {}

    res.json({ success: true, data: formatStudent(student), message: "House allocated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to allocate house" });
  }
});

router.patch("/house-allocations/bulk", async (req, res) => {
  try {
    const scope = getSchoolScope(req);
    const { studentIds, houseName, houseId } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0 || !houseName) {
      return res.status(400).json({ success: false, message: "Student IDs and house are required" });
    }

    await Admission.updateMany(
      { _id: { $in: studentIds }, ...scope },
      { $set: { house: houseName, houseId: houseId || null } }
    );

    try {
      await Student.updateMany(
        { _id: { $in: studentIds } },
        { $set: { house: houseName, houseId: houseId || null } }
      );
    } catch (e) {}

    res.json({ success: true, message: `${studentIds.length} student(s) allocated to ${houseName} successfully` });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to allocate houses in bulk" });
  }
});

/* ══════════════════════════════════════════════════════════════
   7. SIBLING MANAGEMENT CRUD
══════════════════════════════════════════════════════════════ */
router.get("/sibling-groups", async (req, res) => {
  try {
    const cid = req.campusId || req.schoolId;
    const groups = await SiblingGroup.find({ campusId: cid }).sort({ guardianName: 1 }).lean();
    res.json({ success: true, data: groups });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch sibling groups" });
  }
});

router.post("/sibling-groups", async (req, res) => {
  try {
    const cid = req.campusId || req.schoolId;
    const { guardianName, guardianMobile, guardianMobileNo, address, students } = req.body;

    const mob = guardianMobile || guardianMobileNo;
    if (!guardianName || !mob) {
      return res.status(400).json({ success: false, message: "Guardian name and mobile number are required" });
    }

    const group = await SiblingGroup.create({
      campusId: cid,
      guardianName: guardianName.trim(),
      guardianMobileNo: mob.trim(),
      students: students || [],
    });

    res.status(201).json({ success: true, data: group, message: "Sibling group created successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to create sibling group" });
  }
});

router.put("/sibling-groups/:id", async (req, res) => {
  try {
    const cid = req.campusId || req.schoolId;
    const { guardianName, guardianMobile, guardianMobileNo, students } = req.body;
    const mob = guardianMobile || guardianMobileNo;

    const updated = await SiblingGroup.findOneAndUpdate(
      { _id: req.params.id, campusId: cid },
      {
        $set: {
          ...(guardianName ? { guardianName: guardianName.trim() } : {}),
          ...(mob ? { guardianMobileNo: mob.trim() } : {}),
          ...(students ? { students } : {}),
        },
      },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: "Sibling group not found" });

    res.json({ success: true, data: updated, message: "Sibling group updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to update sibling group" });
  }
});

router.delete("/sibling-groups/:id", async (req, res) => {
  try {
    const cid = req.campusId || req.schoolId;
    const deleted = await SiblingGroup.findOneAndDelete({ _id: req.params.id, campusId: cid });
    if (!deleted) return res.status(404).json({ success: false, message: "Sibling group not found" });

    res.json({ success: true, message: "Sibling group deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to delete sibling group" });
  }
});

/* ══════════════════════════════════════════════════════════════
   8. STUDENT SEARCH
══════════════════════════════════════════════════════════════ */
router.get("/students/search", async (req, res) => {
  try {
    const scope = getSchoolScope(req);
    const { q, className, section, medium, status } = req.query;

    const filter = { ...scope };
    if (status) {
      filter.status = status;
    } else {
      filter.status = { $ne: "Inactive" };
    }

    if (className) filter.className = className;
    if (section) filter.section = section;
    if (medium) filter.medium = medium;

    if (q && q.trim()) {
      const rx = new RegExp(q.trim(), "i");
      filter.$or = [
        { studentName: rx },
        { fatherName: rx },
        { motherName: rx },
        { srNo: rx },
        { schoolAdmissionNo: rx },
        { rollNo: rx },
        { rollNumber: rx },
        { mobile: rx },
        { aadhar: rx },
      ];
    }

    const students = await Admission.find(filter)
      .select(
        "_id studentName fatherName motherName admissionNo schoolAdmissionNo srNo rollNo rollNumber className section medium mobile status dob gender house"
      )
      .sort({ className: 1, section: 1, studentName: 1 })
      .limit(200)
      .lean();

    res.json({ success: true, data: students.map(formatStudent) });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to search students" });
  }
});

/* ══════════════════════════════════════════════════════════════
   9. INACTIVE STUDENTS
══════════════════════════════════════════════════════════════ */
router.get("/students/inactive", async (req, res) => {
  try {
    const scope = getSchoolScope(req);
    const { className, section, search } = req.query;

    const filter = { ...scope, status: "Inactive" };
    if (className) filter.className = className;
    if (section) filter.section = section;
    if (search) {
      const rx = new RegExp(search.trim(), "i");
      filter.$or = [{ studentName: rx }, { srNo: rx }, { schoolAdmissionNo: rx }, { mobile: rx }, { inactiveReason: rx }];
    }

    const students = await Admission.find(filter)
      .sort({ updatedAt: -1 })
      .lean();

    res.json({ success: true, data: students.map(formatStudent) });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch inactive students" });
  }
});

router.patch("/students/:id/deactivate", async (req, res) => {
  try {
    const scope = getSchoolScope(req);
    const { reason } = req.body;

    const student = await Admission.findOneAndUpdate(
      { _id: req.params.id, ...scope },
      { $set: { status: "Inactive", inactiveReason: reason || "Deactivated by admin" } },
      { new: true }
    );
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    try {
      await Student.findOneAndUpdate(
        { _id: req.params.id },
        { $set: { status: "Inactive", inactiveReason: reason || "Deactivated by admin" } }
      );
    } catch (e) {}

    res.json({ success: true, data: formatStudent(student), message: "Student marked as inactive" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to deactivate student" });
  }
});

router.patch("/students/:id/restore", async (req, res) => {
  try {
    const scope = getSchoolScope(req);

    const student = await Admission.findOneAndUpdate(
      { _id: req.params.id, ...scope },
      { $set: { status: "Active", inactiveReason: "" } },
      { new: true }
    );
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    try {
      await Student.findOneAndUpdate(
        { _id: req.params.id },
        { $set: { status: "Active", inactiveReason: "" } }
      );
    } catch (e) {}

    res.json({ success: true, data: formatStudent(student), message: "Student restored successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to restore student" });
  }
});

router.patch("/students/bulk-deactivate", async (req, res) => {
  try {
    const scope = getSchoolScope(req);
    const { studentIds, reason } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, message: "Student IDs are required" });
    }

    await Admission.updateMany(
      { _id: { $in: studentIds }, ...scope },
      { $set: { status: "Inactive", inactiveReason: reason || "Bulk Deactivated" } }
    );

    try {
      await Student.updateMany(
        { _id: { $in: studentIds } },
        { $set: { status: "Inactive", inactiveReason: reason || "Bulk Deactivated" } }
      );
    } catch (e) {}

    res.json({ success: true, message: `${studentIds.length} student(s) deactivated successfully` });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to deactivate students" });
  }
});

/* ══════════════════════════════════════════════════════════════
   10. STUDENT DOCUMENTS CRUD
══════════════════════════════════════════════════════════════ */
router.get("/student-documents", async (req, res) => {
  try {
    const cid = req.campusId || req.schoolId;
    const { studentId, className, section } = req.query;

    const filter = { campusId: cid };
    if (studentId) filter.studentId = studentId;
    if (className) filter.className = className;
    if (section) filter.section = section;

    const docs = await StudentDocument.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: docs });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch student documents" });
  }
});

router.post("/student-documents", async (req, res) => {
  try {
    const cid = req.campusId || req.schoolId;
    const { studentId, studentName, documentType, className, section, rollNumber, documentUrl, remarks } = req.body;

    if (!studentId || !studentName || !documentType) {
      return res.status(400).json({ success: false, message: "Student, student name, and document type are required" });
    }

    const doc = await StudentDocument.create({
      campusId: cid,
      schoolId: req.schoolId || cid,
      studentId,
      studentName,
      className: className || "",
      section: section || "",
      rollNumber: rollNumber || "",
      documentType,
      documentUrl: documentUrl || "",
      remarks: remarks || "",
      uploadDate: new Date().toISOString().split("T")[0],
    });

    res.status(201).json({ success: true, data: doc, message: "Document uploaded successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || "Failed to upload document" });
  }
});

router.delete("/student-documents/:id", async (req, res) => {
  try {
    const cid = req.campusId || req.schoolId;
    const deleted = await StudentDocument.findOneAndDelete({ _id: req.params.id, campusId: cid });
    if (!deleted) return res.status(404).json({ success: false, message: "Document not found" });

    res.json({ success: true, message: "Document deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete document" });
  }
});

/* ══════════════════════════════════════════════════════════════
   11. ROLL NUMBER UPDATE
══════════════════════════════════════════════════════════════ */
router.get("/roll-numbers", async (req, res) => {
  try {
    const scope = getSchoolScope(req);
    const { className, section } = req.query;

    if (!className) {
      return res.status(400).json({ success: false, message: "Class is required" });
    }

    const filter = { ...scope, className, status: "Active" };
    if (section) filter.section = section;

    const students = await Admission.find(filter)
      .select("_id studentName className section rollNo rollNumber schoolAdmissionNo srNo")
      .sort({ rollNo: 1, rollNumber: 1, studentName: 1 })
      .lean();

    res.json({ success: true, data: students.map(formatStudent) });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch students for roll number update" });
  }
});

router.patch("/roll-numbers/bulk-update", async (req, res) => {
  try {
    const scope = getSchoolScope(req);
    const { updates } = req.body; // [{ studentId, rollNumber, rollNo }]

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ success: false, message: "No updates provided" });
    }

    const bulkOps = updates.map(({ studentId, rollNumber, rollNo }) => {
      const val = rollNumber || rollNo || "";
      return {
        updateOne: {
          filter: { _id: studentId, ...scope },
          update: { $set: { rollNumber: val, rollNo: val } },
        },
      };
    });

    await Admission.bulkWrite(bulkOps);

    // Sync Student collection
    try {
      const studentBulkOps = updates.map(({ studentId, rollNumber, rollNo }) => {
        const val = rollNumber || rollNo || "";
        return {
          updateOne: {
            filter: { _id: studentId },
            update: { $set: { rollNumber: val, rollNo: val } },
          },
        };
      });
      await Student.bulkWrite(studentBulkOps);
    } catch (e) {}

    res.json({ success: true, message: `${updates.length} roll number(s) updated successfully` });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update roll numbers" });
  }
});

/* ══════════════════════════════════════════════════════════════
   12. SECTION TRANSFER
══════════════════════════════════════════════════════════════ */
router.get("/section-transfer/students", async (req, res) => {
  try {
    const scope = getSchoolScope(req);
    const { className, section } = req.query;

    if (!className) {
      return res.status(400).json({ success: false, message: "Class is required" });
    }

    const filter = { ...scope, className, status: "Active" };
    if (section) filter.section = section;

    const students = await Admission.find(filter)
      .select("_id studentName className section rollNo rollNumber schoolAdmissionNo srNo")
      .sort({ section: 1, studentName: 1 })
      .lean();

    res.json({ success: true, data: students.map(formatStudent) });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch students for section transfer" });
  }
});

router.patch("/section-transfer/bulk", async (req, res) => {
  try {
    const scope = getSchoolScope(req);
    const { studentIds, toSection } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0 || !toSection) {
      return res.status(400).json({ success: false, message: "Student IDs and target section are required" });
    }

    await Admission.updateMany(
      { _id: { $in: studentIds }, ...scope },
      { $set: { section: toSection } }
    );

    try {
      await Student.updateMany(
        { _id: { $in: studentIds } },
        { $set: { section: toSection } }
      );
    } catch (e) {}

    res.json({ success: true, message: `${studentIds.length} student(s) transferred to section ${toSection}` });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to transfer students" });
  }
});

/* ══════════════════════════════════════════════════════════════
   13. PROMOTION MANAGEMENT
══════════════════════════════════════════════════════════════ */
router.get("/promotions", async (req, res) => {
  try {
    const cid = req.campusId || req.schoolId;
    const promotions = await Promotion.find({ campusId: cid })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json({ success: true, data: promotions });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch promotion records" });
  }
});

router.get("/promotion/students", async (req, res) => {
  try {
    const scope = getSchoolScope(req);
    const { className, section } = req.query;

    if (!className) {
      return res.status(400).json({ success: false, message: "Class is required" });
    }

    const filter = { ...scope, className, status: "Active" };
    if (section) filter.section = section;

    const students = await Admission.find(filter)
      .select("_id studentName className section rollNo rollNumber schoolAdmissionNo srNo fatherName")
      .sort({ studentName: 1 })
      .lean();

    res.json({ success: true, data: students.map(formatStudent) });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch students for promotion" });
  }
});

router.post("/promotions", async (req, res) => {
  try {
    const cid = req.campusId || req.schoolId;
    const scope = getSchoolScope(req);
    const { fromClass, toClass, section, fromSession, toSession, studentIds } = req.body;

    if (!fromClass || !toClass || !fromSession || !toSession || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "From class, to class, sessions, and at least one student ID are required",
      });
    }

    // Update students in Admission
    await Admission.updateMany(
      { _id: { $in: studentIds }, ...scope },
      { $set: { className: toClass, session: toSession } }
    );

    // Sync Student collection
    try {
      await Student.updateMany(
        { _id: { $in: studentIds } },
        { $set: { class: toClass, className: toClass } }
      );
    } catch (e) {}

    // Record promotion log
    const promotion = await Promotion.create({
      campusId: cid,
      schoolId: req.schoolId || cid,
      fromSession,
      toSession,
      fromClass,
      toClass,
      section: section || "",
      promotedCount: studentIds.length,
      status: "Completed",
    });

    res.status(201).json({
      success: true,
      data: promotion,
      message: `${studentIds.length} student(s) promoted from ${fromClass} to ${toClass} for session ${toSession}`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to promote students" });
  }
});

/* ══════════════════════════════════════════════════════════════
   14. ALUMNI MANAGEMENT
══════════════════════════════════════════════════════════════ */
router.get("/alumni", async (req, res) => {
  try {
    const scope = getSchoolScope(req);
    const { passYear, session, search } = req.query;

    const filter = { ...scope, status: "Alumni" };
    if (passYear) filter.passYear = passYear;
    if (session) filter.session = session;
    if (search) {
      const rx = new RegExp(search.trim(), "i");
      filter.$or = [{ studentName: rx }, { srNo: rx }, { schoolAdmissionNo: rx }, { mobile: rx }, { fatherName: rx }];
    }

    const alumni = await Admission.find(filter)
      .sort({ passYear: -1, updatedAt: -1 })
      .lean();

    res.json({ success: true, data: alumni.map(formatStudent) });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch alumni" });
  }
});

router.patch("/alumni/:id/mark", async (req, res) => {
  try {
    const scope = getSchoolScope(req);
    const { passYear } = req.body;
    const year = passYear || new Date().getFullYear().toString();

    const student = await Admission.findOneAndUpdate(
      { _id: req.params.id, ...scope },
      { $set: { status: "Alumni", passYear: year } },
      { new: true }
    );
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });

    try {
      await Student.findOneAndUpdate(
        { _id: req.params.id },
        { $set: { status: "Alumni", passYear: year } }
      );
    } catch (e) {}

    res.json({ success: true, data: formatStudent(student), message: "Student marked as Alumni" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to mark student as alumni" });
  }
});

router.patch("/alumni/bulk-mark", async (req, res) => {
  try {
    const scope = getSchoolScope(req);
    const { studentIds, passYear } = req.body;
    const year = passYear || new Date().getFullYear().toString();

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, message: "Student IDs are required" });
    }

    await Admission.updateMany(
      { _id: { $in: studentIds }, ...scope },
      { $set: { status: "Alumni", passYear: year } }
    );

    try {
      await Student.updateMany(
        { _id: { $in: studentIds } },
        { $set: { status: "Alumni", passYear: year } }
      );
    } catch (e) {}

    res.json({ success: true, message: `${studentIds.length} student(s) marked as Alumni` });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to bulk mark students as alumni" });
  }
});

/* ══════════════════════════════════════════════════════════════
   15. BULK STUDENT UPDATE
══════════════════════════════════════════════════════════════ */
router.patch("/students/bulk-update", async (req, res) => {
  try {
    const scope = getSchoolScope(req);
    const { studentIds, section, house, medium, status, feePlan, concessionPlan } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, message: "Student IDs are required" });
    }

    const updateFields = {};
    if (section) updateFields.section = section;
    if (house) updateFields.house = house;
    if (medium) updateFields.medium = medium;
    if (status) updateFields.status = status;
    if (feePlan) updateFields.feePlan = feePlan;
    if (concessionPlan !== undefined) updateFields.concessionPlan = concessionPlan;

    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields provided to update" });
    }

    await Admission.updateMany(
      { _id: { $in: studentIds }, ...scope },
      { $set: updateFields }
    );

    try {
      await Student.updateMany(
        { _id: { $in: studentIds } },
        { $set: updateFields }
      );
    } catch (e) {}

    res.json({ success: true, message: `${studentIds.length} student(s) updated successfully` });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to bulk update students" });
  }
});

/* ══════════════════════════════════════════════════════════════
   16. DATA EXPORT
══════════════════════════════════════════════════════════════ */
router.get("/data-export", async (req, res) => {
  try {
    const scope = getSchoolScope(req);
    const { className, section, status, session } = req.query;

    const filter = { ...scope };
    if (className) filter.className = className;
    if (section) filter.section = section;
    if (status) filter.status = status;
    if (session) filter.session = session;

    const students = await Admission.find(filter)
      .sort({ className: 1, section: 1, studentName: 1 })
      .lean();

    res.json({
      success: true,
      data: students.map(formatStudent),
      count: students.length,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to export student data" });
  }
});

/* ══════════════════════════════════════════════════════════════
   17. ANALYTICS & REPORTS
══════════════════════════════════════════════════════════════ */
router.get("/reports", async (req, res) => {
  try {
    const cid = req.campusId || req.schoolId;
    const scope = getSchoolScope(req);

    const [total, active, inactive, alumni, houses, sections, classes] = await Promise.all([
      Admission.countDocuments(scope),
      Admission.countDocuments({ ...scope, status: "Active" }),
      Admission.countDocuments({ ...scope, status: "Inactive" }),
      Admission.countDocuments({ ...scope, status: "Alumni" }),
      House.countDocuments({ campusId: cid }),
      Section.countDocuments({ campusId: cid }),
      Class.countDocuments({ campusId: cid }),
    ]);

    // Class-wise breakdown
    const classBreakdown = await Admission.aggregate([
      { $match: { ...scope, status: "Active" } },
      { $group: { _id: "$className", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // House-wise breakdown
    const houseBreakdown = await Admission.aggregate([
      { $match: { ...scope, status: "Active", house: { $exists: true, $ne: "" } } },
      { $group: { _id: "$house", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Gender breakdown
    const genderBreakdown = await Admission.aggregate([
      { $match: { ...scope, status: "Active" } },
      { $group: { _id: "$gender", count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        students: { total, active, inactive, alumni },
        infrastructure: { classes, sections, houses },
        classBreakdown,
        houseBreakdown,
        genderBreakdown,
      },
    });
  } catch (err) {
    console.error("StudentHub reports error:", err);
    res.status(500).json({ success: false, message: "Failed to load student hub reports" });
  }
});

module.exports = router;
