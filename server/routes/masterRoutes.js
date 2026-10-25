const express = require("express");
const router = express.Router();

const schoolAuth = require("../middleware/schoolAuth");

const ClassModel = require("../models/Class");
const Medium = require("../models/Medium");
const SiblingGroup = require("../models/SiblingGroup");
const Subject = require("../models/Subject");

/* =========================
   CLASS ROUTES
========================= */

router.post("/class/create", schoolAuth, async (req, res) => {
  try {
    const { className, classCode, sections } = req.body;

    if (!className || !classCode) {
      return res.status(400).json({
        success: false,
        message: "Class name and class code are required",
      });
    }

    const newClass = await ClassModel.create({
      campusId: req.campusId,
      className,
      classCode,
      sections: sections || [],
    });

    res.status(201).json({
      success: true,
      message: "Class created successfully",
      data: newClass,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/class/fetch", schoolAuth, async (req, res) => {
  try {
    const classes = await ClassModel.find({
      campusId: req.campusId,
    }).sort({ className: 1 });

    res.status(200).json({
      success: true,
      data: classes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/* =========================
   MEDIUM ROUTES
========================= */

router.post("/medium/create", schoolAuth, async (req, res) => {
  try {
    const { mediumName, mediumCode } = req.body;

    if (!mediumName || !mediumCode) {
      return res.status(400).json({
        success: false,
        message: "Medium name and medium code are required",
      });
    }

    const medium = await Medium.create({
      campusId: req.campusId,
      mediumName,
      mediumCode,
    });

    res.status(201).json({
      success: true,
      message: "Medium created successfully",
      data: medium,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/medium/fetch", schoolAuth, async (req, res) => {
  try {
    const mediums = await Medium.find({
      campusId: req.campusId,
    }).sort({ mediumName: 1 });

    res.status(200).json({
      success: true,
      data: mediums,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/* =========================
   SIBLING GROUP ROUTES
========================= */

router.post("/sibling/create", schoolAuth, async (req, res) => {
  try {
    const { guardianName, guardianMobileNo, students } = req.body;

    if (!guardianName || !guardianMobileNo) {
      return res.status(400).json({
        success: false,
        message: "Guardian name and mobile number are required",
      });
    }

    const siblingGroup = await SiblingGroup.create({
      campusId: req.campusId,
      guardianName,
      guardianMobileNo,
      students: students || [],
    });

    res.status(201).json({
      success: true,
      message: "Sibling group created successfully",
      data: siblingGroup,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/sibling/fetch", schoolAuth, async (req, res) => {
  try {
    const siblingGroups = await SiblingGroup.find({
      campusId: req.campusId,
    }).sort({ guardianName: 1 });

    res.status(200).json({
      success: true,
      data: siblingGroups,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/* =========================
   SUBJECT ROUTES
========================= */

router.post("/subject/create", schoolAuth, async (req, res) => {
  try {
    const { subjectName, subjectCode, subjectType } = req.body;

    if (!subjectName || !subjectName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Subject name is required",
      });
    }

    const existing = await Subject.findOne({
      campusId: req.campusId,
      subjectName: { $regex: new RegExp(`^${subjectName.trim()}$`, "i") },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Subject already exists",
      });
    }

    const subject = await Subject.create({
      campusId: req.campusId,
      subjectName: subjectName.trim(),
      subjectCode: (subjectCode || "").trim().toUpperCase(),
      subjectType: subjectType || "Scholastic",
    });

    res.status(201).json({
      success: true,
      message: "Subject created successfully",
      data: subject,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/subject/fetch", schoolAuth, async (req, res) => {
  try {
    const subjects = await Subject.find({
      campusId: req.campusId,
      isActive: true,
    }).sort({ subjectName: 1 }).lean();

    res.status(200).json({
      success: true,
      data: subjects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.put("/subject/:id", schoolAuth, async (req, res) => {
  try {
    const { subjectName, subjectCode, subjectType } = req.body;

    const duplicate = await Subject.findOne({
      campusId: req.campusId,
      _id: { $ne: req.params.id },
      subjectName: { $regex: new RegExp(`^${subjectName.trim()}$`, "i") },
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "Subject name already in use",
      });
    }

    const updated = await Subject.findOneAndUpdate(
      { _id: req.params.id, campusId: req.campusId },
      {
        subjectName: subjectName.trim(),
        subjectCode: (subjectCode || "").trim().toUpperCase(),
        subjectType: subjectType || "Scholastic",
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    res.status(200).json({
      success: true,
      message: "Subject updated successfully",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.delete("/subject/:id", schoolAuth, async (req, res) => {
  try {
    const deleted = await Subject.findOneAndDelete({
      _id: req.params.id,
      campusId: req.campusId,
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Subject not found" });
    }

    res.status(200).json({
      success: true,
      message: "Subject deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;