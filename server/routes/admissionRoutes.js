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

/* ==========================================================
   OPTIMIZED META ENDPOINT
   Batches Classes, Fee Plans, Concessions, Sibling Groups,
   Mediums, Subjects, Houses, and counts in one trip.
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

// 1. Add new admission (Preserves existing contract for /add)
router.post("/add", async (req, res) => {
  try {
    const schoolId = req.schoolId || req.user?.schoolId;
    const campusId = req.campusId || schoolId;
    if (!schoolId) {
      return res.status(400).json({ success: false, msg: "School ID could not be identified from token" });
    }

    let { srNo, mobile, aadhar, schoolAdmissionNo, studentName, className } = req.body;

    // Generate srNo if not provided
    if (!srNo || !String(srNo).trim()) {
      const count = await Admission.countDocuments({ campusId });
      srNo = `SR-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
    }

    // Check duplicate
    const duplicate = await Admission.findOne({
      campusId,
      $or: [
        { srNo },
        ...(mobile ? [{ mobile }] : []),
        ...(aadhar ? [{ aadhar }] : []),
        ...(schoolAdmissionNo ? [{ schoolAdmissionNo }] : []),
      ],
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        msg: "Duplicate record found. Admission already exists with this SR No, Mobile, or Aadhar.",
      });
    }

    const admission = new Admission({
      ...req.body,
      srNo,
      schoolId,
      campusId,
      status: req.body.status || "Active",
    });

    await admission.save();

    // Create or update Student record for consistency
    try {
      await Student.create({
        name: studentName,
        class: className,
        schoolId,
        campusId,
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
    res.status(500).json({ success: false, msg: err.message });
  }
});

// 2. Get all admissions for logged-in school/campus
router.get("/", async (req, res) => {
  try {
    const schoolId = req.schoolId || req.user?.schoolId;
    const campusId = req.campusId || schoolId;
    if (!schoolId) {
      return res.status(400).json({ success: false, msg: "School ID could not be identified from token" });
    }

    const { className, section, search, status } = req.query;

    // Always scope to this school/campus first
    const query = {
      $and: [
        { $or: [{ campusId }, { schoolId }] },
      ],
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
   NOTE: These routes MUST be defined before /:id wildcard
   so Express does not treat "enquiries" as a Mongo ObjectId.
========================================================== */

// Enquiries - Get all enquiries
router.get("/enquiries", async (req, res) => {
  try {
    const campusId = req.campusId || req.schoolId;
    const { status, search } = req.query;

    const query = { campusId };
    if (status) query.status = status;
    if (search) {
      const reg = new RegExp(search.trim(), "i");
      query.$or = [
        { studentName: reg },
        { mobileNumber: reg },
        { fatherName: reg },
        { enquiryNo: reg },
      ];
    }

    const enquiries = await AdmissionEnquiry.find(query).sort({ createdAt: -1 }).lean();

    res.status(200).json({
      success: true,
      data: enquiries || [],
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Enquiries - Create new enquiry
router.post("/enquiries", async (req, res) => {
  try {
    const schoolId = req.schoolId || req.user?.schoolId;
    const campusId = req.campusId || schoolId;
    const { studentName, mobileNumber, classInterested, source, enquiryDate } = req.body;

    if (!studentName || !mobileNumber || !classInterested) {
      return res.status(400).json({
        success: false,
        message: "Student Name, Mobile Number, and Class Interested are required.",
      });
    }

    const count = await AdmissionEnquiry.countDocuments({ campusId });
    const currentYear = new Date().getFullYear();
    const enquiryNo = `ENQ-${currentYear}-${String(count + 1).padStart(4, "0")}`;

    const newEnquiry = await AdmissionEnquiry.create({
      ...req.body,
      schoolId,
      campusId,
      enquiryNo,
      source: source || "Walk-in",
      status: req.body.status || "NEW",
      enquiryDate: enquiryDate || new Date().toISOString().split("T")[0],
    });

    res.status(201).json({
      success: true,
      message: "Enquiry added successfully",
      data: newEnquiry,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Enquiries - Update enquiry
router.put("/enquiries/:id", async (req, res) => {
  try {
    const campusId = req.campusId || req.schoolId;

    const updated = await AdmissionEnquiry.findOneAndUpdate(
      { _id: req.params.id, campusId },
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
    const campusId = req.campusId || req.schoolId;
    const { status } = req.body;

    const updated = await AdmissionEnquiry.findOneAndUpdate(
      { _id: req.params.id, campusId },
      { $set: { status } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Enquiry not found" });
    }

    res.status(200).json({
      success: true,
      message: `Enquiry status changed to ${status}`,
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Enquiries - Delete enquiry
router.delete("/enquiries/:id", async (req, res) => {
  try {
    const campusId = req.campusId || req.schoolId;

    const deleted = await AdmissionEnquiry.findOneAndDelete({
      _id: req.params.id,
      campusId,
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
   NOTE: Must also be before /:id wildcard.
========================================================== */
router.get("/reports", async (req, res) => {
  try {
    const campusId = req.campusId || req.schoolId;

    const [admissions, enquiries] = await Promise.all([
      Admission.find({ campusId }).sort({ admissionDate: -1, createdAt: -1 }).lean(),
      AdmissionEnquiry.find({ campusId }).sort({ enquiryDate: -1, createdAt: -1 }).lean(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        admissions: admissions || [],
        enquiries: enquiries || [],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Get single admission by ID
router.get("/:id", async (req, res) => {
  try {
    const campusId = req.campusId || req.schoolId;
    const admission = await Admission.findOne({
      _id: req.params.id,
      $or: [{ campusId }, { schoolId: req.schoolId }],
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
    const campusId = req.campusId || req.schoolId;

    const updated = await Admission.findOneAndUpdate(
      { _id: req.params.id, $or: [{ campusId }, { schoolId: req.schoolId }] },
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
    const campusId = req.campusId || req.schoolId;

    const admission = await Admission.findOneAndDelete({
      _id: req.params.id,
      $or: [{ campusId }, { schoolId: req.schoolId }],
    });

    if (!admission) {
      return res.status(404).json({ success: false, message: "Admission record not found" });
    }

    // Also remove matching student record
    try {
      await Student.findOneAndDelete({
        name: admission.studentName,
        class: admission.className,
        campusId,
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
    const campusId = req.campusId || schoolId;
    const { rows, session } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: "No student records provided for import" });
    }

    let insertedCount = 0;
    let skippedCount = 0;
    const errors = [];

    const existingCount = await Admission.countDocuments({ campusId });
    const currentYear = new Date().getFullYear();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const studentName = row.studentName ? String(row.studentName).trim() : "";
      const className = row.className ? String(row.className).trim() : "";
      const mobile = row.mobile ? String(row.mobile).trim() : "";

      if (!studentName || !className) {
        skippedCount++;
        errors.push({ row: i + 1, message: "Missing required fields: Student Name or Class" });
        continue;
      }

      // Check duplicate
      const duplicate = await Admission.findOne({
        campusId,
        $or: [
          ...(row.srNo ? [{ srNo: row.srNo }] : []),
          ...(mobile ? [{ mobile }] : []),
          ...(row.aadhar ? [{ aadhar: row.aadhar }] : []),
        ],
      });

      if (duplicate) {
        skippedCount++;
        errors.push({ row: i + 1, message: `Duplicate record (SR/Mobile/Aadhar already exists for: ${studentName})` });
        continue;
      }

      const generatedSrNo = row.srNo || `SR-${currentYear}-${String(existingCount + insertedCount + 1).padStart(4, "0")}`;

      const newAdmission = new Admission({
        ...row,
        studentName,
        className,
        srNo: generatedSrNo,
        schoolId,
        campusId,
        session: session || row.session || `${currentYear}-${currentYear + 1}`,
        status: row.status || "Active",
      });

      await newAdmission.save();

      try {
        await Student.create({
          name: studentName,
          class: className,
          schoolId,
          campusId,
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