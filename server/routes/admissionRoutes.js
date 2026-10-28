const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Admission = require("../models/Admission");
const AdmissionEnquiry = require("../models/AdmissionEnquiry");
const Student = require("../models/Student");
const Class = require("../models/Class");
const FeePlan = require("../models/FeePlan");
const Concession = require("../models/Concession");
const SiblingGroup = require("../models/SiblingGroup");
const Medium = require("../models/Medium");
const Subject = require("../models/Subject");
const House = require("../models/House");
const ClassSubjectMapping = require("../models/ClassSubjectMapping");

// Role guard: Only schoolAdmin can manage Admissions
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

router.use(schoolAdminOnly);

// Helper to get school scope covering both ObjectId schoolId and String campusId
const getSchoolScope = (req) => {
  const schoolId = req.schoolId || req.user?.schoolId;
  const actualCampusId = req.school?.campusId || req.user?.campusCode || req.user?.campusId;
  return {
    $or: [
      { schoolId },
      ...(actualCampusId ? [{ campusId: actualCampusId }] : []),
      ...(req.campusId ? [{ campusId: req.campusId }] : []),
    ],
  };
};

/* ==========================================================
   OPTIMIZED META ENDPOINT
   Batches Classes, Fee Plans, Concessions, Sibling Groups,
   Mediums, Subjects, Houses, ClassSubjectMappings, and counts.
========================================================== */
router.get("/meta", async (req, res) => {
  try {
    const campusId = req.campusId || req.schoolId;

    const [
      classes,
      feePlans,
      concessions,
      siblingGroups,
      mediums,
      subjects,
      houses,
      classSubjectMappings,
      totalAdmissions,
      totalEnquiries,
    ] = await Promise.all([
      Class.find({ campusId }).select("className classCode sections").sort({ className: 1 }).lean(),
      FeePlan.find({ campusId }).select("className feePlanName feeScheme newTotal oldTotal").sort({ className: 1 }).lean(),
      Concession.find({ campusId, isActive: true }).select("concessionName type value applicableFeeHeads").sort({ concessionName: 1 }).lean(),
      SiblingGroup.find({ campusId }).select("groupName students").sort({ groupName: 1 }).lean(),
      Medium.find({ campusId }).select("mediumName mediumCode").sort({ mediumName: 1 }).lean(),
      Subject.find({ campusId }).select("subjectName subjectCode").sort({ subjectName: 1 }).lean(),
      House.find({ campusId, isActive: true }).select("houseName houseCode color").sort({ houseName: 1 }).lean().catch(() => []),
      ClassSubjectMapping.find({ campusId }).select("className scholasticSubjects coScholasticSubjects").lean().catch(() => []),
      Admission.countDocuments({ campusId }),
      AdmissionEnquiry.countDocuments({ campusId }),
    ]);

    const housesList = Array.isArray(houses) ? houses : [];

    res.status(200).json({
      success: true,
      data: {
        classes: classes || [],
        feePlans: feePlans || [],
        concessions: concessions || [],
        siblingGroups: siblingGroups || [],
        mediums: mediums || [],
        subjects: subjects || [],
        houses: housesList,
        classSubjectMappings: classSubjectMappings || [],
        enquirySources: ["Walk-in", "WhatsApp", "Facebook", "Instagram", "Reference", "Website", "Phone Call"],
        stats: {
          totalAdmissions: totalAdmissions || 0,
          totalEnquiries: totalEnquiries || 0,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ==========================================================
   ADMISSIONS CRUD
========================================================== */

// 1. Add new admission
router.post("/add", async (req, res) => {
  try {
    const schoolId = req.schoolId || req.user?.schoolId; // Mongoose ObjectId
    const actualCampusId = req.school?.campusId || req.user?.campusCode || req.user?.campusId; // String campus code e.g. "SCH001"
    if (!schoolId) {
      return res.status(400).json({ success: false, msg: "School ID could not be identified from token" });
    }

    const schoolScope = getSchoolScope(req);
    let { srNo, mobile, aadhar, schoolAdmissionNo, studentName, className } = req.body;

    // Clean optional fields: empty string should be set to undefined to avoid unique index collision
    const cleanSchoolAdmissionNo = schoolAdmissionNo && String(schoolAdmissionNo).trim()
      ? String(schoolAdmissionNo).trim()
      : undefined;

    const cleanAadhar = aadhar && String(aadhar).trim()
      ? String(aadhar).trim()
      : undefined;

    // Generate srNo if not provided
    if (!srNo || !String(srNo).trim()) {
      const count = await Admission.countDocuments(schoolScope);
      srNo = `SR-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
    } else {
      srNo = String(srNo).trim();
    }

    // 1. Aadhar MUST be unique if provided
    if (cleanAadhar) {
      const aadharDuplicate = await Admission.findOne({
        ...schoolScope,
        aadhar: cleanAadhar,
      });
      if (aadharDuplicate) {
        return res.status(400).json({
          success: false,
          msg: `A student is already registered with Aadhar number: ${cleanAadhar}`,
        });
      }
    }

    // 2. SR No MUST be unique
    const srDuplicate = await Admission.findOne({
      ...schoolScope,
      srNo,
    });
    if (srDuplicate) {
      return res.status(400).json({
        success: false,
        msg: `An admission already exists with SR No: ${srNo}`,
      });
    }

    // 3. School Admission No MUST be unique if provided
    if (cleanSchoolAdmissionNo) {
      const admNoDuplicate = await Admission.findOne({
        ...schoolScope,
        schoolAdmissionNo: cleanSchoolAdmissionNo,
      });
      if (admNoDuplicate) {
        return res.status(400).json({
          success: false,
          msg: `An admission already exists with School Admission No: ${cleanSchoolAdmissionNo}`,
        });
      }
    }

    // NOTE: Mobile number is intentionally NOT checked for duplicate:
    // Parents enrolling multiple children (siblings) can share the same mobile number.

    const admissionData = {
      ...req.body,
      srNo,
      schoolId,
      campusId: actualCampusId || String(schoolId),
      status: req.body.status || "Active",
    };

    if (cleanSchoolAdmissionNo) {
      admissionData.schoolAdmissionNo = cleanSchoolAdmissionNo;
    } else {
      delete admissionData.schoolAdmissionNo;
    }

    if (cleanAadhar) {
      admissionData.aadhar = cleanAadhar;
    } else {
      delete admissionData.aadhar;
    }

    const admission = new Admission(admissionData);
    await admission.save();

    // Create or update Student record for consistency
    try {
      await Student.create({
        name: studentName,
        class: className,
        className: className,
        section: req.body.section || "",
        rollNo: req.body.rollNo || "",
        fatherName: req.body.fatherName || "",
        mobile: mobile || "",
        admissionNo: cleanSchoolAdmissionNo || srNo,
        srNo,
        schoolId,
        campusId: actualCampusId || String(schoolId),
        status: "Active",
      });
    } catch (sErr) {
      console.warn("Could not sync Student entry:", sErr.message);
    }

    res.status(201).json({
      success: true,
      msg: "Admission saved successfully",
      admission,
    });
  } catch (err) {
    if (err.code === 11000) {
      const keyPattern = Object.keys(err.keyPattern || {}).join(", ");
      return res.status(400).json({
        success: false,
        msg: `Duplicate entry detected for (${keyPattern}). Please ensure SR No, Aadhar, and School Admission No are unique.`,
      });
    }
    res.status(500).json({ success: false, msg: err.message });
  }
});

// 2. Get all admissions for logged-in school/campus
router.get("/", async (req, res) => {
  try {
    const schoolScope = getSchoolScope(req);
    const { className, section, search, status } = req.query;

    const query = {
      $and: [schoolScope],
    };

    if (className) query.$and.push({ className });
    if (section) query.$and.push({ section });
    if (status) query.$and.push({ status });
    if (search) {
      const reg = new RegExp(search.trim(), "i");
      query.$and.push({
        $or: [
          { studentName: reg },
          { fatherName: reg },
          { srNo: reg },
          { mobile: reg },
          { schoolAdmissionNo: reg },
        ],
      });
    }

    const admissions = await Admission.find(query).sort({ createdAt: -1 }).lean();

    res.status(200).json(admissions);
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
});

/* ==========================================================
   ADMISSION ENQUIRIES CRUD
========================================================== */

// Enquiries - Get all enquiries
router.get("/enquiries", async (req, res) => {
  try {
    const schoolScope = getSchoolScope(req);
    const { status, classInterested, search } = req.query;

    const filter = { ...schoolScope };
    if (status) filter.status = status;
    if (classInterested) filter.classInterested = classInterested;
    if (search) {
      const reg = new RegExp(search.trim(), "i");
      filter.$or = [
        { studentName: reg },
        { parentName: reg },
        { mobile: reg },
        { enquiryNumber: reg },
      ];
    }

    const enquiries = await AdmissionEnquiry.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({ success: true, data: enquiries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Enquiries - Create new enquiry
router.post("/enquiries", async (req, res) => {
  try {
    const schoolId = req.schoolId || req.user?.schoolId;
    const actualCampusId = req.school?.campusId || req.user?.campusCode || req.user?.campusId;
    const { studentName, parentName, mobile, classInterested, source } = req.body;

    if (!studentName || !mobile || !classInterested) {
      return res.status(400).json({
        success: false,
        message: "Student name, mobile number, and class interested are required",
      });
    }

    const count = await AdmissionEnquiry.countDocuments(getSchoolScope(req));
    const enquiryNumber = `ENQ-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const enquiry = new AdmissionEnquiry({
      ...req.body,
      enquiryNumber,
      schoolId,
      campusId: actualCampusId || String(schoolId),
      studentName: studentName.trim(),
      parentName: parentName ? parentName.trim() : "",
      mobile: mobile.trim(),
      classInterested,
      source: source || "Walk-in",
      status: req.body.status || "New",
      enquiryDate: req.body.enquiryDate || new Date().toISOString().split("T")[0],
    });

    await enquiry.save();

    res.status(201).json({
      success: true,
      message: "Enquiry created successfully",
      data: enquiry,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Enquiries - Update enquiry
router.put("/enquiries/:id", async (req, res) => {
  try {
    const schoolScope = getSchoolScope(req);
    const updated = await AdmissionEnquiry.findOneAndUpdate(
      { _id: req.params.id, ...schoolScope },
      { $set: req.body },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Enquiry not found" });
    }

    res.status(200).json({
      success: true,
      message: "Enquiry updated successfully",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Enquiries - Update enquiry status
router.patch("/enquiries/:id/status", async (req, res) => {
  try {
    const schoolScope = getSchoolScope(req);
    const { status } = req.body;

    const updated = await AdmissionEnquiry.findOneAndUpdate(
      { _id: req.params.id, ...schoolScope },
      { $set: { status } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Enquiry not found" });
    }

    res.status(200).json({
      success: true,
      message: "Enquiry status updated successfully",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Enquiries - Delete enquiry
router.delete("/enquiries/:id", async (req, res) => {
  try {
    const schoolScope = getSchoolScope(req);
    const deleted = await AdmissionEnquiry.findOneAndDelete({
      _id: req.params.id,
      ...schoolScope,
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Enquiry not found" });
    }

    res.status(200).json({
      success: true,
      message: "Enquiry deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ==========================================================
   ANALYTICS & REPORTS
========================================================== */
router.get("/reports", async (req, res) => {
  try {
    const schoolScope = getSchoolScope(req);

    const [admissionsByClass, admissionsByMonth, enquiriesByStatus, concessionsSummary] =
      await Promise.all([
        Admission.aggregate([
          { $match: schoolScope },
          { $group: { _id: "$className", count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),
        Admission.aggregate([
          { $match: schoolScope },
          {
            $group: {
              _id: { $substr: ["$admissionDate", 0, 7] },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: -1 } },
          { $limit: 12 },
        ]),
        AdmissionEnquiry.aggregate([
          { $match: schoolScope },
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),
        Admission.aggregate([
          { $match: { ...schoolScope, concessionPlan: { $ne: "No Concession Plan" } } },
          { $group: { _id: "$concessionPlan", count: { $sum: 1 } } },
        ]),
      ]);

    res.status(200).json({
      success: true,
      data: {
        admissionsByClass,
        admissionsByMonth,
        enquiriesByStatus,
        concessionsSummary,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Get single admission by ID
router.get("/:id", async (req, res) => {
  try {
    const schoolScope = getSchoolScope(req);
    const admission = await Admission.findOne({
      _id: req.params.id,
      ...schoolScope,
    }).lean();

    if (!admission) {
      return res.status(404).json({ success: false, message: "Admission record not found" });
    }

    res.status(200).json({ success: true, data: admission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Update admission by ID
router.put("/:id", async (req, res) => {
  try {
    const schoolScope = getSchoolScope(req);

    const updated = await Admission.findOneAndUpdate(
      { _id: req.params.id, ...schoolScope },
      { $set: req.body },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Admission record not found" });
    }

    res.status(200).json({
      success: true,
      message: "Admission updated successfully",
      admission: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. Delete admission by ID
router.delete("/:id", async (req, res) => {
  try {
    const schoolScope = getSchoolScope(req);

    const admission = await Admission.findOneAndDelete({
      _id: req.params.id,
      ...schoolScope,
    });

    if (!admission) {
      return res.status(404).json({ success: false, message: "Admission record not found" });
    }

    // Also remove matching student record
    try {
      await Student.findOneAndDelete({
        name: admission.studentName,
        class: admission.className,
        ...schoolScope,
      });
    } catch (_) {}

    res.status(200).json({
      success: true,
      message: "Admission deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. Bulk Import Admissions
router.post("/bulk-import", async (req, res) => {
  try {
    const schoolId = req.schoolId || req.user?.schoolId;
    const actualCampusId = req.school?.campusId || req.user?.campusCode || req.user?.campusId;
    const { rows, session } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: "No student records provided for import" });
    }

    const schoolScope = getSchoolScope(req);
    let insertedCount = 0;
    let skippedCount = 0;
    const errors = [];

    const existingCount = await Admission.countDocuments(schoolScope);
    const currentYear = new Date().getFullYear();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const studentName = row.studentName ? String(row.studentName).trim() : "";
      const className = row.className ? String(row.className).trim() : "";
      const aadhar = row.aadhar && String(row.aadhar).trim() ? String(row.aadhar).trim() : undefined;
      const srNo = row.srNo && String(row.srNo).trim() ? String(row.srNo).trim() : undefined;
      const schoolAdmissionNo = row.schoolAdmissionNo && String(row.schoolAdmissionNo).trim()
        ? String(row.schoolAdmissionNo).trim()
        : undefined;

      if (!studentName || !className) {
        skippedCount++;
        errors.push({ row: i + 1, message: "Missing required fields: Student Name or Class" });
        continue;
      }

      // Check duplicate: Aadhar, SR No, School Admission No (NOT mobile!)
      if (aadhar) {
        const duplicateAadhar = await Admission.findOne({ ...schoolScope, aadhar });
        if (duplicateAadhar) {
          skippedCount++;
          errors.push({ row: i + 1, message: `Duplicate Aadhar (${aadhar}) for student: ${studentName}` });
          continue;
        }
      }

      if (srNo) {
        const duplicateSr = await Admission.findOne({ ...schoolScope, srNo });
        if (duplicateSr) {
          skippedCount++;
          errors.push({ row: i + 1, message: `Duplicate SR No (${srNo}) for student: ${studentName}` });
          continue;
        }
      }

      if (schoolAdmissionNo) {
        const duplicateAdm = await Admission.findOne({ ...schoolScope, schoolAdmissionNo });
        if (duplicateAdm) {
          skippedCount++;
          errors.push({ row: i + 1, message: `Duplicate School Admission No (${schoolAdmissionNo}) for student: ${studentName}` });
          continue;
        }
      }

      const generatedSrNo = srNo || `SR-${currentYear}-${String(existingCount + insertedCount + 1).padStart(4, "0")}`;

      const newAdmissionData = {
        ...row,
        studentName,
        className,
        srNo: generatedSrNo,
        schoolId,
        campusId: actualCampusId || String(schoolId),
        session: session || row.session || `${currentYear}-${currentYear + 1}`,
        status: row.status || "Active",
      };

      if (schoolAdmissionNo) newAdmissionData.schoolAdmissionNo = schoolAdmissionNo;
      else delete newAdmissionData.schoolAdmissionNo;

      if (aadhar) newAdmissionData.aadhar = aadhar;
      else delete newAdmissionData.aadhar;

      const newAdmission = new Admission(newAdmissionData);
      await newAdmission.save();

      try {
        await Student.create({
          name: studentName,
          class: className,
          className: className,
          section: row.section || "",
          srNo: generatedSrNo,
          admissionNo: schoolAdmissionNo || generatedSrNo,
          schoolId,
          campusId: actualCampusId || String(schoolId),
          status: "Active",
        });
      } catch (_) {}

      insertedCount++;
    }

    res.status(200).json({
      success: true,
      message: `Bulk import completed: ${insertedCount} imported, ${skippedCount} skipped.`,
      insertedCount,
      skippedCount,
      errors,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
