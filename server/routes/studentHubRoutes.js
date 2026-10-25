const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const schoolAuth = require("../middleware/schoolAuth");

router.use(schoolAuth);

/* ══════════════════════════════════════════════════════════════
   INLINE MODELS
══════════════════════════════════════════════════════════════ */

// Section
const sectionSchema = new mongoose.Schema(
  {
    campusId:    { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
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

// House
const houseSchema = new mongoose.Schema(
  {
    campusId:  { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    houseName: { type: String, required: true, trim: true },
    houseCode: { type: String, default: "" },
    color:     { type: String, default: "" },
    captain:   { type: String, default: "" },
    isActive:  { type: Boolean, default: true },
  },
  { timestamps: true }
);
houseSchema.index({ campusId: 1, houseName: 1 }, { unique: true });
const House = mongoose.models.House || mongoose.model("House", houseSchema);

// Student Document
const studentDocumentSchema = new mongoose.Schema(
  {
    campusId:     { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    studentId:    { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
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

// Promotion
const promotionSchema = new mongoose.Schema(
  {
    campusId:       { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
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
   META — batch fetch for all dropdowns
══════════════════════════════════════════════════════════════ */
router.get("/meta", async (req, res) => {
  try {
    const cid = req.campusId;
    const Class = mongoose.models.Class || require("../models/Class");
    const Medium = mongoose.models.Medium || require("../models/Medium");

    const [classes, sections, mediums, houses] = await Promise.all([
      Class.find({ campusId: cid }).select("_id className classCode").sort({ className: 1 }).lean(),
      Section.find({ campusId: cid, isActive: true }).select("_id sectionName classId className").sort({ sectionName: 1 }).lean(),
      Medium.find({ campusId: cid }).select("_id mediumName mediumCode").sort({ mediumName: 1 }).lean(),
      House.find({ campusId: cid, isActive: true }).select("_id houseName houseCode color").sort({ houseName: 1 }).lean(),
    ]);

    res.json({ success: true, data: { classes, sections, mediums, houses } });
  } catch (err) {
    console.error("StudentHub meta error:", err);
    res.status(500).json({ success: false, message: "Failed to load meta" });
  }
});

/* ══════════════════════════════════════════════════════════════
   SECTION MANAGEMENT CRUD
══════════════════════════════════════════════════════════════ */
router.get("/sections", async (req, res) => {
  try {
    const { classId } = req.query;
    const filter = { campusId: req.campusId };
    if (classId) filter.classId = classId;
    const sections = await Section.find(filter).sort({ sectionName: 1 }).lean();
    res.json({ success: true, data: sections });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch sections" });
  }
});

router.post("/sections", async (req, res) => {
  try {
    const { sectionName, classId, className, capacity } = req.body;
    if (!sectionName) return res.status(400).json({ success: false, message: "Section name is required" });

    const Class = mongoose.models.Class || require("../models/Class");
    let resolvedClassName = className;
    if (classId && !resolvedClassName) {
      const cls = await Class.findById(classId).lean();
      resolvedClassName = cls?.className || "";
    }

    const section = await Section.create({
      campusId: req.campusId,
      sectionName: sectionName.trim(),
      classId: classId || null,
      className: resolvedClassName || "",
      capacity: capacity || 0,
    });
    res.status(201).json({ success: true, data: section, message: "Section created successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to create section" });
  }
});

router.put("/sections/:id", async (req, res) => {
  try {
    const { sectionName, classId, className, capacity, isActive } = req.body;
    const updated = await Section.findOneAndUpdate(
      { _id: req.params.id, campusId: req.campusId },
      { $set: { sectionName, classId, className, capacity, isActive } },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: "Section not found" });
    res.json({ success: true, data: updated, message: "Section updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update section" });
  }
});

router.delete("/sections/:id", async (req, res) => {
  try {
    const deleted = await Section.findOneAndDelete({ _id: req.params.id, campusId: req.campusId });
    if (!deleted) return res.status(404).json({ success: false, message: "Section not found" });
    res.json({ success: true, message: "Section deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete section" });
  }
});

/* ══════════════════════════════════════════════════════════════
   HOUSE MANAGEMENT CRUD
══════════════════════════════════════════════════════════════ */
router.get("/houses", async (req, res) => {
  try {
    const houses = await House.find({ campusId: req.campusId }).sort({ houseName: 1 }).lean();
    res.json({ success: true, data: houses });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch houses" });
  }
});

router.post("/houses", async (req, res) => {
  try {
    const { houseName, houseCode, color, captain } = req.body;
    if (!houseName) return res.status(400).json({ success: false, message: "House name is required" });

    const exists = await House.findOne({ campusId: req.campusId, houseName: houseName.trim() });
    if (exists) return res.status(400).json({ success: false, message: "House name already exists" });

    const house = await House.create({ campusId: req.campusId, houseName: houseName.trim(), houseCode, color, captain });
    res.status(201).json({ success: true, data: house, message: "House created successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to create house" });
  }
});

router.put("/houses/:id", async (req, res) => {
  try {
    const updated = await House.findOneAndUpdate(
      { _id: req.params.id, campusId: req.campusId },
      { $set: req.body },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: "House not found" });
    res.json({ success: true, data: updated, message: "House updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update house" });
  }
});

router.delete("/houses/:id", async (req, res) => {
  try {
    const deleted = await House.findOneAndDelete({ _id: req.params.id, campusId: req.campusId });
    if (!deleted) return res.status(404).json({ success: false, message: "House not found" });
    res.json({ success: true, message: "House deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete house" });
  }
});

/* ══════════════════════════════════════════════════════════════
   HOUSE ALLOCATION — assign house to students
══════════════════════════════════════════════════════════════ */
router.get("/house-allocations", async (req, res) => {
  try {
    const Student = mongoose.models.Student || require("../models/Student");
    const { className, section, houseId } = req.query;
    const filter = { campusId: req.campusId };
    if (className) filter.class = className;
    if (section) filter.section = section;
    if (houseId) filter.houseId = houseId;
    const students = await Student.find(filter)
      .select("_id fullName class section rollNumber houseId houseName")
      .sort({ class: 1, section: 1, rollNumber: 1 })
      .lean();
    res.json({ success: true, data: students });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch house allocations" });
  }
});

router.patch("/house-allocations/:studentId", async (req, res) => {
  try {
    const Student = mongoose.models.Student || require("../models/Student");
    const { houseId, houseName } = req.body;
    const student = await Student.findOneAndUpdate(
      { _id: req.params.studentId, campusId: req.campusId },
      { $set: { houseId, houseName } },
      { new: true }
    );
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });
    res.json({ success: true, data: student, message: "House allocated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to allocate house" });
  }
});

/* ══════════════════════════════════════════════════════════════
   STUDENT SEARCH
══════════════════════════════════════════════════════════════ */
router.get("/students/search", async (req, res) => {
  try {
    const Student = mongoose.models.Student || require("../models/Student");
    const { q, className, section, medium } = req.query;
    const filter = { campusId: req.campusId, status: { $ne: "Inactive" } };
    if (className) filter.class = className;
    if (section) filter.section = section;
    if (medium) filter.medium = medium;
    if (q) {
      const rx = new RegExp(q, "i");
      filter.$or = [{ fullName: rx }, { rollNumber: rx }, { admissionNo: rx }, { fatherName: rx }, { mobile: rx }];
    }
    const students = await Student.find(filter)
      .select("_id fullName admissionNo rollNumber class section medium fatherName mobile status")
      .sort({ class: 1, section: 1, rollNumber: 1 })
      .limit(100)
      .lean();
    res.json({ success: true, data: students });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to search students" });
  }
});

/* ══════════════════════════════════════════════════════════════
   INACTIVE STUDENTS — fetch & restore
══════════════════════════════════════════════════════════════ */
router.get("/students/inactive", async (req, res) => {
  try {
    const Student = mongoose.models.Student || require("../models/Student");
    const { className, section } = req.query;
    const filter = { campusId: req.campusId, status: "Inactive" };
    if (className) filter.class = className;
    if (section) filter.section = section;
    const students = await Student.find(filter)
      .select("_id fullName admissionNo rollNumber class section medium fatherName mobile status")
      .sort({ updatedAt: -1 })
      .lean();
    res.json({ success: true, data: students });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch inactive students" });
  }
});

router.patch("/students/:id/restore", async (req, res) => {
  try {
    const Student = mongoose.models.Student || require("../models/Student");
    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, campusId: req.campusId },
      { $set: { status: "Active" } },
      { new: true }
    );
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });
    res.json({ success: true, data: student, message: "Student restored successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to restore student" });
  }
});

router.patch("/students/:id/deactivate", async (req, res) => {
  try {
    const Student = mongoose.models.Student || require("../models/Student");
    const { reason } = req.body;
    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, campusId: req.campusId },
      { $set: { status: "Inactive", inactiveReason: reason || "" } },
      { new: true }
    );
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });
    res.json({ success: true, data: student, message: "Student deactivated" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to deactivate student" });
  }
});

/* ══════════════════════════════════════════════════════════════
   STUDENT DOCUMENTS CRUD
══════════════════════════════════════════════════════════════ */
router.get("/student-documents", async (req, res) => {
  try {
    const { studentId, className, section } = req.query;
    const filter = { campusId: req.campusId };
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
    const { studentId, studentName, documentType } = req.body;
    if (!studentId || !studentName || !documentType) {
      return res.status(400).json({ success: false, message: "Student, student name and document type are required" });
    }
    const doc = await StudentDocument.create({
      campusId: req.campusId,
      uploadDate: new Date().toISOString().split("T")[0],
      ...req.body,
    });
    res.status(201).json({ success: true, data: doc, message: "Document uploaded successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to upload document" });
  }
});

router.delete("/student-documents/:id", async (req, res) => {
  try {
    const deleted = await StudentDocument.findOneAndDelete({ _id: req.params.id, campusId: req.campusId });
    if (!deleted) return res.status(404).json({ success: false, message: "Document not found" });
    res.json({ success: true, message: "Document deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete document" });
  }
});

/* ══════════════════════════════════════════════════════════════
   ROLL NUMBER UPDATE — bulk update roll numbers for a class
══════════════════════════════════════════════════════════════ */
router.get("/roll-numbers", async (req, res) => {
  try {
    const Student = mongoose.models.Student || require("../models/Student");
    const { className, section } = req.query;
    if (!className) return res.status(400).json({ success: false, message: "Class is required" });
    const filter = { campusId: req.campusId, class: className, status: { $ne: "Inactive" } };
    if (section) filter.section = section;
    const students = await Student.find(filter)
      .select("_id fullName admissionNo rollNumber class section")
      .sort({ rollNumber: 1, fullName: 1 })
      .lean();
    res.json({ success: true, data: students });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch students" });
  }
});

router.patch("/roll-numbers/bulk-update", async (req, res) => {
  try {
    const Student = mongoose.models.Student || require("../models/Student");
    const { updates } = req.body; // [{ studentId, rollNumber }]
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ success: false, message: "No updates provided" });
    }
    const bulkOps = updates.map(({ studentId, rollNumber }) => ({
      updateOne: {
        filter: { _id: studentId, campusId: req.campusId },
        update: { $set: { rollNumber } },
      },
    }));
    await Student.bulkWrite(bulkOps);
    res.json({ success: true, message: `${updates.length} roll number(s) updated successfully` });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update roll numbers" });
  }
});

/* ══════════════════════════════════════════════════════════════
   SECTION TRANSFER — move students between sections
══════════════════════════════════════════════════════════════ */
router.get("/section-transfer/students", async (req, res) => {
  try {
    const Student = mongoose.models.Student || require("../models/Student");
    const { className, section } = req.query;
    if (!className) return res.status(400).json({ success: false, message: "Class is required" });
    const filter = { campusId: req.campusId, class: className, status: { $ne: "Inactive" } };
    if (section) filter.section = section;
    const students = await Student.find(filter)
      .select("_id fullName admissionNo rollNumber class section")
      .sort({ section: 1, rollNumber: 1 })
      .lean();
    res.json({ success: true, data: students });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch students" });
  }
});

router.patch("/section-transfer/bulk", async (req, res) => {
  try {
    const Student = mongoose.models.Student || require("../models/Student");
    const { studentIds, toSection } = req.body;
    if (!studentIds?.length || !toSection) {
      return res.status(400).json({ success: false, message: "Student IDs and target section are required" });
    }
    await Student.updateMany(
      { _id: { $in: studentIds }, campusId: req.campusId },
      { $set: { section: toSection } }
    );
    res.json({ success: true, message: `${studentIds.length} student(s) transferred to section ${toSection}` });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to transfer students" });
  }
});

/* ══════════════════════════════════════════════════════════════
   PROMOTION MANAGEMENT — promote students to next class
══════════════════════════════════════════════════════════════ */
router.get("/promotions", async (req, res) => {
  try {
    const promotions = await Promotion.find({ campusId: req.campusId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json({ success: true, data: promotions });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch promotions" });
  }
});

router.get("/promotion/students", async (req, res) => {
  try {
    const Student = mongoose.models.Student || require("../models/Student");
    const { className, section } = req.query;
    if (!className) return res.status(400).json({ success: false, message: "Class is required" });
    const filter = { campusId: req.campusId, class: className, status: { $ne: "Inactive" } };
    if (section) filter.section = section;
    const students = await Student.find(filter)
      .select("_id fullName admissionNo rollNumber class section medium fatherName")
      .sort({ rollNumber: 1 })
      .lean();
    res.json({ success: true, data: students });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch students for promotion" });
  }
});

router.post("/promotions", async (req, res) => {
  try {
    const Student = mongoose.models.Student || require("../models/Student");
    const { fromClass, toClass, section, fromSession, toSession, studentIds } = req.body;
    if (!fromClass || !toClass || !fromSession || !toSession || !studentIds?.length) {
      return res.status(400).json({ success: false, message: "From class, to class, sessions and student IDs are required" });
    }
    // Update students
    await Student.updateMany(
      { _id: { $in: studentIds }, campusId: req.campusId },
      { $set: { class: toClass, session: toSession } }
    );
    // Log promotion
    const promotion = await Promotion.create({
      campusId: req.campusId,
      fromSession, toSession, fromClass, toClass,
      section: section || "",
      promotedCount: studentIds.length,
    });
    res.status(201).json({
      success: true,
      data: promotion,
      message: `${studentIds.length} student(s) promoted from ${fromClass} to ${toClass}`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to promote students" });
  }
});

/* ══════════════════════════════════════════════════════════════
   ALUMNI MANAGEMENT — graduated/passed-out students
══════════════════════════════════════════════════════════════ */
router.get("/alumni", async (req, res) => {
  try {
    const Student = mongoose.models.Student || require("../models/Student");
    const { passYear, search } = req.query;
    const filter = { campusId: req.campusId, status: "Alumni" };
    if (passYear) filter.passYear = passYear;
    if (search) {
      const rx = new RegExp(search, "i");
      filter.$or = [{ fullName: rx }, { admissionNo: rx }, { mobile: rx }];
    }
    const alumni = await Student.find(filter)
      .select("_id fullName admissionNo class section fatherName mobile passYear")
      .sort({ passYear: -1, fullName: 1 })
      .lean();
    res.json({ success: true, data: alumni });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch alumni" });
  }
});

router.patch("/alumni/:id/mark", async (req, res) => {
  try {
    const Student = mongoose.models.Student || require("../models/Student");
    const { passYear } = req.body;
    const student = await Student.findOneAndUpdate(
      { _id: req.params.id, campusId: req.campusId },
      { $set: { status: "Alumni", passYear: passYear || new Date().getFullYear().toString() } },
      { new: true }
    );
    if (!student) return res.status(404).json({ success: false, message: "Student not found" });
    res.json({ success: true, data: student, message: "Student marked as alumni" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to mark student as alumni" });
  }
});

/* ══════════════════════════════════════════════════════════════
   STUDENT HUB ANALYTICS & REPORTS
══════════════════════════════════════════════════════════════ */
router.get("/reports", async (req, res) => {
  try {
    const Student = mongoose.models.Student || require("../models/Student");
    const cid = req.campusId;

    const [total, active, inactive, alumni, houses, sections] = await Promise.all([
      Student.countDocuments({ campusId: cid }),
      Student.countDocuments({ campusId: cid, status: "Active" }),
      Student.countDocuments({ campusId: cid, status: "Inactive" }),
      Student.countDocuments({ campusId: cid, status: "Alumni" }),
      House.countDocuments({ campusId: cid }),
      Section.countDocuments({ campusId: cid }),
    ]);

    // Class-wise breakdown
    const classBreakdown = await Student.aggregate([
      { $match: { campusId: cid, status: "Active" } },
      { $group: { _id: "$class", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        students: { total, active, inactive, alumni },
        classBreakdown,
        infrastructure: { houses, sections },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load student hub reports" });
  }
});

module.exports = router;
