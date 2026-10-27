const express = require("express");
const router = express.Router();
const schoolAuth = require("../middleware/schoolAuth");

const Subject = require("../models/Subject");
const ClassModel = require("../models/Class");
const ClassSubjectMapping = require("../models/ClassSubjectMapping");
const StudentSubjectMapping = require("../models/StudentSubjectMapping");
const Admission = require("../models/Admission");
const Student = require("../models/Student");
const SubjectTeacherAssignment = require("../models/SubjectTeacherAssignment");

// Role guard for school administrative actions
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
   1. OPTIMIZED META ENDPOINT
   Fetches dropdown classes, scholastic subjects,
   co-scholastic subjects, and existing mappings in parallel.
========================================================== */
router.get("/meta", async (req, res) => {
  try {
    const campusId = req.campusId;

    const [classes, scholasticSubjects, coScholasticSubjects, classSubjectMappings] =
      await Promise.all([
        ClassModel.find({ campusId })
          .select("_id className classCode sections")
          .sort({ className: 1 })
          .lean(),
        Subject.find({
          campusId,
          isActive: true,
          subjectType: { $ne: "Co-Scholastic" },
        })
          .select("_id subjectName subjectCode subjectType category")
          .sort({ subjectName: 1 })
          .lean(),
        Subject.find({
          campusId,
          isActive: true,
          subjectType: "Co-Scholastic",
        })
          .select("_id subjectName subjectCode subjectType category")
          .sort({ subjectName: 1 })
          .lean(),
        ClassSubjectMapping.find({ campusId })
          .sort({ className: 1 })
          .lean(),
      ]);

    res.status(200).json({
      success: true,
      data: {
        classes: classes || [],
        scholasticSubjects: scholasticSubjects || [],
        coScholasticSubjects: coScholasticSubjects || [],
        classSubjectMappings: classSubjectMappings || [],
      },
    });
  } catch (error) {
    console.error("Error fetching academic meta:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ==========================================================
   2. CO-SCHOLASTIC SUBJECTS CRUD
========================================================== */
router.get("/co-scholastic-subjects", async (req, res) => {
  try {
    const subjects = await Subject.find({
      campusId: req.campusId,
      subjectType: "Co-Scholastic",
      isActive: true,
    })
      .sort({ subjectName: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: subjects || [],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/co-scholastic-subjects", async (req, res) => {
  try {
    const { subjectName, subjectCode } = req.body;

    if (!subjectName || !subjectName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Subject Name is required",
      });
    }

    const cleanName = subjectName.trim();
    const cleanCode = (subjectCode || "").trim().toUpperCase();

    // Check duplicate
    const existing = await Subject.findOne({
      campusId: req.campusId,
      subjectName: { $regex: new RegExp(`^${cleanName}$`, "i") },
    }).lean();

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Subject '${cleanName}' already exists`,
      });
    }

    const subject = await Subject.create({
      campusId: req.campusId,
      schoolId: req.schoolId || req.campusId,
      subjectName: cleanName,
      subjectCode: cleanCode,
      subjectType: "Co-Scholastic",
      category: "Co-Scholastic",
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "Co-Scholastic Subject added successfully",
      data: subject,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put("/co-scholastic-subjects/:id", async (req, res) => {
  try {
    const { subjectName, subjectCode } = req.body;

    if (!subjectName || !subjectName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Subject Name is required",
      });
    }

    const cleanName = subjectName.trim();
    const cleanCode = (subjectCode || "").trim().toUpperCase();

    const duplicate = await Subject.findOne({
      campusId: req.campusId,
      _id: { $ne: req.params.id },
      subjectName: { $regex: new RegExp(`^${cleanName}$`, "i") },
    }).lean();

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: `Subject '${cleanName}' already exists`,
      });
    }

    const updated = await Subject.findOneAndUpdate(
      { _id: req.params.id, campusId: req.campusId },
      {
        subjectName: cleanName,
        subjectCode: cleanCode,
        subjectType: "Co-Scholastic",
        category: "Co-Scholastic",
        schoolId: req.schoolId || req.campusId,
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    res.status(200).json({
      success: true,
      message: "Co-Scholastic Subject updated successfully",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/co-scholastic-subjects/:id", async (req, res) => {
  try {
    const subject = await Subject.findOne({
      _id: req.params.id,
      campusId: req.campusId,
    });

    if (!subject) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    // Wiring check: Check if mapped in ClassSubjectMapping
    const isMappedInClass = await ClassSubjectMapping.findOne({
      campusId: req.campusId,
      coScholasticSubjects: subject.subjectName,
    }).lean();

    if (isMappedInClass) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete subject '${subject.subjectName}': It is mapped in Class Subject Mapping for '${isMappedInClass.className}'. Please remove it from class mapping first.`,
      });
    }

    await Subject.deleteOne({ _id: subject._id });

    res.status(200).json({
      success: true,
      message: "Co-Scholastic Subject deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ==========================================================
   3. CLASS SUBJECT MAPPING CRUD
========================================================== */
router.get("/class-subjects", async (req, res) => {
  try {
    const mappings = await ClassSubjectMapping.find({ campusId: req.campusId })
      .sort({ className: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: mappings || [],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/class-subjects", async (req, res) => {
  try {
    const { className, classId, scholasticSubjects, coScholasticSubjects } = req.body;

    if (!className || !className.trim()) {
      return res.status(400).json({
        success: false,
        message: "Class name is required",
      });
    }

    const schol = Array.isArray(scholasticSubjects) ? scholasticSubjects : [];
    const coSchol = Array.isArray(coScholasticSubjects) ? coScholasticSubjects : [];

    if (schol.length === 0 && coSchol.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one subject to map to this class",
      });
    }

    const mapping = await ClassSubjectMapping.findOneAndUpdate(
      { campusId: req.campusId, className: className.trim() },
      {
        campusId: req.campusId,
        schoolId: req.schoolId || req.campusId,
        className: className.trim(),
        classId: classId || undefined,
        scholasticSubjects: schol,
        coScholasticSubjects: coSchol,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    res.status(200).json({
      success: true,
      message: "Class Subject Mapping saved successfully",
      data: mapping,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/class-subjects/:id", async (req, res) => {
  try {
    const mapping = await ClassSubjectMapping.findOne({
      _id: req.params.id,
      campusId: req.campusId,
    });

    if (!mapping) {
      return res.status(404).json({ success: false, message: "Mapping not found" });
    }

    // Wiring check: Check if any students have subject mappings for this class
    const studentCount = await StudentSubjectMapping.countDocuments({
      campusId: req.campusId,
      className: mapping.className,
    });

    if (studentCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete mapping for '${mapping.className}': ${studentCount} student(s) currently have subject mappings for this class. Please remove or update student subject mappings first.`,
      });
    }

    await ClassSubjectMapping.deleteOne({ _id: mapping._id });

    res.status(200).json({
      success: true,
      message: "Class Subject Mapping deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ==========================================================
   4. STUDENT SUBJECT MAPPING CRUD & BULK ASSIGN
========================================================== */
router.get("/students-for-mapping", async (req, res) => {
  try {
    const { className, section } = req.query;

    if (!className || !section) {
      return res.status(400).json({
        success: false,
        message: "Both Class Name and Section are required",
      });
    }

    const campusId = req.campusId;

    // Fetch active students for this class and section
    let students = await Admission.find({
      campusId,
      className: className.trim(),
      section: section.trim(),
      status: { $ne: "Inactive" },
    })
      .select("_id studentName className section rollNo rollNumber schoolAdmissionNo srNo")
      .sort({ rollNo: 1, studentName: 1 })
      .lean();

    // Fallback: If no admissions found under this class/section, check Student model
    if (!students || students.length === 0) {
      const studentFallback = await Student.find({
        campusId,
        $or: [{ className: className.trim() }, { class: className.trim() }],
        section: section.trim(),
        status: { $ne: "Inactive" },
      })
        .select("_id name fullName studentName className class section rollNo rollNumber admissionNo srNo")
        .sort({ rollNo: 1, name: 1 })
        .lean();

      if (studentFallback && studentFallback.length > 0) {
        students = studentFallback.map((s) => ({
          _id: s._id,
          studentName: s.studentName || s.fullName || s.name || "",
          className: s.className || s.class || className,
          section: s.section || section,
          rollNo: s.rollNo || s.rollNumber || "",
          schoolAdmissionNo: s.admissionNo || s.srNo || "",
        }));
      }
    }

    // Fetch existing student mappings for this class & section
    const existingMappings = await StudentSubjectMapping.find({
      campusId,
      className: className.trim(),
      section: section.trim(),
    }).lean();

    const mappingMap = new Map();
    existingMappings.forEach((m) => {
      mappingMap.set(m.studentId.toString(), m);
    });

    // Fetch subjects assigned to this class from ClassSubjectMapping
    const classMapping = await ClassSubjectMapping.findOne({
      campusId,
      className: className.trim(),
    }).lean();

    const classSubjects = {
      scholasticSubjects: classMapping?.scholasticSubjects || [],
      coScholasticSubjects: classMapping?.coScholasticSubjects || [],
    };

    // Attach mapping info to each student
    const studentList = students.map((s) => {
      const sId = s._id.toString();
      const mapping = mappingMap.get(sId);
      return {
        _id: s._id,
        studentId: s._id,
        studentName: s.studentName || "",
        admissionNo: s.schoolAdmissionNo || s.admissionNo || s.srNo || "-",
        rollNo: s.rollNo || s.rollNumber || "-",
        className: s.className || className,
        section: s.section || section,
        isMapped: !!mapping,
        mappingId: mapping?._id || null,
        scholasticSubjects: mapping?.scholasticSubjects || classSubjects.scholasticSubjects,
        coScholasticSubjects: mapping?.coScholasticSubjects || classSubjects.coScholasticSubjects,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        students: studentList,
        classSubjects,
        totalStudents: studentList.length,
        mappedCount: existingMappings.length,
      },
    });
  } catch (error) {
    console.error("Error loading students for mapping:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/student-subjects", async (req, res) => {
  try {
    const filter = { campusId: req.campusId };
    if (req.query.className) filter.className = req.query.className.trim();
    if (req.query.section) filter.section = req.query.section.trim();

    const mappings = await StudentSubjectMapping.find(filter)
      .sort({ className: 1, section: 1, rollNo: 1, studentName: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: mappings || [],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/student-subjects/bulk-assign", async (req, res) => {
  try {
    const { students, scholasticSubjects, coScholasticSubjects } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No students provided for assignment",
      });
    }

    const schol = Array.isArray(scholasticSubjects) ? scholasticSubjects : [];
    const coSchol = Array.isArray(coScholasticSubjects) ? coScholasticSubjects : [];

    if (schol.length === 0 && coSchol.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one subject to assign to students",
      });
    }

    const campusId = req.campusId;
    const schoolId = req.schoolId || req.campusId;

    // High performance bulkWrite upsert operation
    const bulkOps = students.map((std) => ({
      updateOne: {
        filter: {
          campusId,
          studentId: std.studentId || std._id,
        },
        update: {
          $set: {
            campusId,
            schoolId,
            studentId: std.studentId || std._id,
            admissionNo: std.admissionNo || "",
            studentName: std.studentName || "",
            className: std.className || "",
            section: std.section || "",
            rollNo: std.rollNo || "",
            scholasticSubjects: schol,
            coScholasticSubjects: coSchol,
          },
        },
        upsert: true,
      },
    }));

    await StudentSubjectMapping.bulkWrite(bulkOps);

    res.status(200).json({
      success: true,
      message: `Subjects assigned successfully to ${students.length} student(s)`,
    });
  } catch (error) {
    console.error("Bulk assign error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/student-subjects/:id", async (req, res) => {
  try {
    const deleted = await StudentSubjectMapping.findOneAndDelete({
      _id: req.params.id,
      campusId: req.campusId,
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Mapping not found" });
    }

    res.status(200).json({
      success: true,
      message: "Student Subject Mapping deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/student-subjects/bulk-delete", async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No mapping IDs provided for deletion",
      });
    }

    const result = await StudentSubjectMapping.deleteMany({
      campusId: req.campusId,
      _id: { $in: ids },
    });

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount || ids.length} mapping(s) successfully`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ==========================================================
   5. ACADEMIC REPORTS & ANALYTICS DATA
========================================================== */
router.get("/reports-data", async (req, res) => {
  try {
    const campusId = req.campusId;

    const [allSubjects, classMappings, studentMappings] = await Promise.all([
      Subject.find({ campusId, isActive: true })
        .select("_id subjectName subjectCode subjectType category createdAt")
        .sort({ subjectName: 1 })
        .lean(),
      ClassSubjectMapping.find({ campusId })
        .sort({ className: 1 })
        .lean(),
      StudentSubjectMapping.find({ campusId })
        .sort({ className: 1, section: 1, rollNo: 1, studentName: 1 })
        .lean(),
    ]);

    const scholasticList = (allSubjects || []).filter(
      (s) => s.subjectType !== "Co-Scholastic"
    );
    const coScholasticList = (allSubjects || []).filter(
      (s) => s.subjectType === "Co-Scholastic"
    );

    res.status(200).json({
      success: true,
      data: {
        scholasticSubjects: scholasticList,
        coScholasticSubjects: coScholasticList,
        classSubjectMappings: classMappings || [],
        studentSubjectMappings: studentMappings || [],
        summary: {
          totalSubjects: allSubjects.length,
          scholasticCount: scholasticList.length,
          coScholasticCount: coScholasticList.length,
          totalClassMappings: classMappings.length,
          totalStudentMappings: studentMappings.length,
        },
      },
    });
  } catch (error) {
    console.error("Academic reports error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
