const express = require("express");
const router = express.Router();
const schoolAuth = require("../middleware/schoolAuth");
const FeeScheme = require("../models/FeeScheme");
const FeePlanName = require("../models/FeePlanName");
const FeePlan = require("../models/FeePlan");
const Concession = require("../models/Concession");
const Class = require("../models/Class");
const Student = require("../models/Student");

// Role guard: Only schoolAdmin can manage Admin Panel
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
   Batches Fee Scheme, Fee Plan Names, Classes, and Concessions
   in a single, lean query to eliminate redundant API calls.
========================================================== */
router.get("/meta", async (req, res) => {
  try {
    const [feeScheme, feePlanNames, classes, concessions] = await Promise.all([
      FeeScheme.findOne({ campusId: req.campusId }).lean(),
      FeePlanName.find({ campusId: req.campusId }).sort({ feePlanName: 1 }).lean(),
      Class.find({ campusId: req.campusId }).select("className classCode sections").sort({ className: 1 }).lean(),
      Concession.find({ campusId: req.campusId }).sort({ concessionName: 1 }).lean(),
    ]);

    // Provide default scheme if not created yet
    const resolvedScheme = feeScheme || {
      schemeType: "Monthly",
      installmentCount: 3,
      feeHeads: [],
      isLocked: false,
    };

    res.status(200).json({
      success: true,
      data: {
        feeScheme: resolvedScheme,
        feePlanNames: feePlanNames || [],
        classes: classes || [],
        concessions: concessions || [],
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ==========================================================
   FEE SCHEME CRUD
========================================================== */

// GET fee scheme
router.get("/fee-scheme", async (req, res) => {
  try {
    let scheme = await FeeScheme.findOne({ campusId: req.campusId }).lean();
    if (!scheme) {
      scheme = await FeeScheme.create({
        campusId: req.campusId,
        schemeType: "Monthly",
        installmentCount: 3,
        feeHeads: [],
      });
    }
    res.status(200).json({ success: true, data: scheme });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE scheme type
router.post("/fee-scheme", async (req, res) => {
  try {
    const { schemeType, installmentCount } = req.body;
    const scheme = await FeeScheme.findOneAndUpdate(
      { campusId: req.campusId },
      {
        schemeType: schemeType || "Monthly",
        installmentCount: installmentCount || 3,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: "Fee scheme updated successfully",
      data: scheme,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ADD fee head
router.post("/fee-scheme/heads", async (req, res) => {
  try {
    const { feeHeadName, feeType, months } = req.body;
    if (!feeHeadName || !feeHeadName.trim()) {
      return res.status(400).json({ success: false, message: "Fee head name is required" });
    }

    let scheme = await FeeScheme.findOne({ campusId: req.campusId });
    if (!scheme) {
      scheme = new FeeScheme({ campusId: req.campusId, feeHeads: [] });
    }

    const cleanName = feeHeadName.trim();
    const alreadyExists = scheme.feeHeads.some(
      (h) => h.feeHeadName.toLowerCase() === cleanName.toLowerCase()
    );
    if (alreadyExists) {
      return res.status(400).json({ success: false, message: "Fee head already exists" });
    }

    scheme.feeHeads.push({
      feeHeadName: cleanName,
      feeType: feeType || scheme.schemeType,
      months: months || "",
      isUsedInFeePlan: false,
    });

    await scheme.save();

    res.status(201).json({
      success: true,
      message: "Fee head added successfully",
      data: scheme.feeHeads,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE fee head
router.put("/fee-scheme/heads/:id", async (req, res) => {
  try {
    const { feeHeadName, feeType, months } = req.body;
    const scheme = await FeeScheme.findOne({ campusId: req.campusId });
    if (!scheme) {
      return res.status(404).json({ success: false, message: "Fee scheme not found" });
    }

    const head = scheme.feeHeads.id(req.params.id);
    if (!head) {
      return res.status(404).json({ success: false, message: "Fee head not found" });
    }

    if (feeHeadName) head.feeHeadName = feeHeadName.trim();
    if (feeType) head.feeType = feeType;
    if (months !== undefined) head.months = months;

    await scheme.save();

    res.status(200).json({
      success: true,
      message: "Fee head updated successfully",
      data: scheme.feeHeads,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE fee head
router.delete("/fee-scheme/heads/:id", async (req, res) => {
  try {
    const scheme = await FeeScheme.findOne({ campusId: req.campusId });
    if (!scheme) {
      return res.status(404).json({ success: false, message: "Fee scheme not found" });
    }

    const head = scheme.feeHeads.id(req.params.id);
    if (!head) {
      return res.status(404).json({ success: false, message: "Fee head not found" });
    }

    // Check if used in FeePlan
    const isUsed = await FeePlan.exists({
      campusId: req.campusId,
      $or: [
        { [`newStudentAmounts.${head.feeHeadName}`]: { $exists: true } },
        { [`oldStudentAmounts.${head.feeHeadName}`]: { $exists: true } },
      ],
    });

    if (isUsed) {
      return res.status(400).json({
        success: false,
        message: "This fee head is already used in Fee Plans and cannot be deleted.",
      });
    }

    head.deleteOne();
    await scheme.save();

    res.status(200).json({
      success: true,
      message: "Fee head deleted successfully",
      data: scheme.feeHeads,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ==========================================================
   FEE PLAN NAME SETUP CRUD
========================================================== */

// GET all fee plan names
router.get("/fee-plan-names", async (req, res) => {
  try {
    const list = await FeePlanName.find({ campusId: req.campusId })
      .sort({ feePlanName: 1 })
      .lean();

    res.status(200).json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// CREATE fee plan name
router.post("/fee-plan-names", async (req, res) => {
  try {
    const { feePlanName } = req.body;
    if (!feePlanName || !feePlanName.trim()) {
      return res.status(400).json({ success: false, message: "Fee plan name is required" });
    }

    const cleanName = feePlanName.trim();
    const existing = await FeePlanName.findOne({
      campusId: req.campusId,
      feePlanName: { $regex: new RegExp(`^${cleanName}$`, "i") },
    });

    if (existing) {
      return res.status(400).json({ success: false, message: "Fee plan name already exists" });
    }

    const created = await FeePlanName.create({
      campusId: req.campusId,
      feePlanName: cleanName,
      isUsed: false,
    });

    res.status(201).json({
      success: true,
      message: "Fee plan name created successfully",
      data: created,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE fee plan name
router.put("/fee-plan-names/:id", async (req, res) => {
  try {
    const { feePlanName } = req.body;
    if (!feePlanName || !feePlanName.trim()) {
      return res.status(400).json({ success: false, message: "Fee plan name is required" });
    }

    const cleanName = feePlanName.trim();
    const duplicate = await FeePlanName.findOne({
      campusId: req.campusId,
      _id: { $ne: req.params.id },
      feePlanName: { $regex: new RegExp(`^${cleanName}$`, "i") },
    });

    if (duplicate) {
      return res.status(400).json({ success: false, message: "Fee plan name already in use" });
    }

    const updated = await FeePlanName.findOneAndUpdate(
      { _id: req.params.id, campusId: req.campusId },
      { feePlanName: cleanName },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Fee plan name not found" });
    }

    res.status(200).json({
      success: true,
      message: "Fee plan name updated successfully",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE fee plan name
router.delete("/fee-plan-names/:id", async (req, res) => {
  try {
    const planName = await FeePlanName.findOne({ _id: req.params.id, campusId: req.campusId });
    if (!planName) {
      return res.status(404).json({ success: false, message: "Fee plan name not found" });
    }

    const isUsed = await FeePlan.exists({
      campusId: req.campusId,
      feePlanName: planName.feePlanName,
    });

    if (isUsed || planName.isUsed) {
      return res.status(400).json({
        success: false,
        message: "This fee plan name is used in Fee Plans and cannot be deleted.",
      });
    }

    await FeePlanName.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: "Fee plan name deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ==========================================================
   FEE PLAN MANAGEMENT CRUD
========================================================== */

// GET saved fee plans
router.get("/fee-plans", async (req, res) => {
  try {
    const filter = { campusId: req.campusId };
    if (req.query.className) filter.className = req.query.className;
    if (req.query.feePlanName) filter.feePlanName = req.query.feePlanName;

    const plans = await FeePlan.find(filter)
      .populate("classId", "className classCode")
      .sort({ className: 1, feePlanName: 1 })
      .lean();

    res.status(200).json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// SAVE or UPDATE fee plan (matrix)
router.post("/fee-plans", async (req, res) => {
  try {
    const {
      className,
      feePlanName,
      feeScheme,
      newStudentAmounts,
      oldStudentAmounts,
      createdBy,
    } = req.body;

    if (!className || !feePlanName) {
      return res.status(400).json({
        success: false,
        message: "Class name and fee plan name are required.",
      });
    }

    const plan = await FeePlan.findOneAndUpdate(
      { campusId: req.campusId, className, feePlanName },
      {
        campusId: req.campusId,
        className,
        feePlanName,
        feeScheme: feeScheme || "Monthly",
        newStudentAmounts: newStudentAmounts || {},
        oldStudentAmounts: oldStudentAmounts || {},
        createdBy: createdBy || "School Admin",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Mark plan name as used
    await FeePlanName.updateOne(
      { campusId: req.campusId, feePlanName },
      { isUsed: true }
    );

    res.status(200).json({
      success: true,
      message: "Fee plan saved successfully",
      data: plan,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// COPY fee plan to another class / plan
router.post("/fee-plans/copy", async (req, res) => {
  try {
    const { sourcePlanId, targetClass, targetPlanName } = req.body;
    if (!sourcePlanId || !targetClass || !targetPlanName) {
      return res.status(400).json({
        success: false,
        message: "Source plan, target class, and target plan name are required.",
      });
    }

    const source = await FeePlan.findOne({ _id: sourcePlanId, campusId: req.campusId });
    if (!source) {
      return res.status(404).json({ success: false, message: "Source fee plan not found" });
    }

    const copy = await FeePlan.findOneAndUpdate(
      { campusId: req.campusId, className: targetClass, feePlanName: targetPlanName },
      {
        campusId: req.campusId,
        className: targetClass,
        feePlanName: targetPlanName,
        feeScheme: source.feeScheme,
        newStudentAmounts: source.newStudentAmounts,
        oldStudentAmounts: source.oldStudentAmounts,
        createdBy: "School Admin",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await FeePlanName.updateOne(
      { campusId: req.campusId, feePlanName: targetPlanName },
      { isUsed: true }
    );

    res.status(200).json({
      success: true,
      message: "Fee plan copied successfully",
      data: copy,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE fee plan
router.delete("/fee-plans/:id", async (req, res) => {
  try {
    const deleted = await FeePlan.findOneAndDelete({
      _id: req.params.id,
      campusId: req.campusId,
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Fee plan not found" });
    }

    res.status(200).json({ success: true, message: "Fee plan deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ==========================================================
   CONCESSION MANAGEMENT CRUD
========================================================== */

// GET concessions
router.get("/concessions", async (req, res) => {
  try {
    const list = await Concession.find({ campusId: req.campusId })
      .sort({ concessionName: 1 })
      .lean();

    res.status(200).json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// CREATE concession
router.post("/concessions", async (req, res) => {
  try {
    const {
      concessionName,
      concessionType,
      concessionValue,
      applicableFeeHeads,
      applicableMonths,
      feeScheme,
    } = req.body;

    if (!concessionName || !concessionName.trim()) {
      return res.status(400).json({ success: false, message: "Concession name is required" });
    }

    const cleanName = concessionName.trim();
    const existing = await Concession.findOne({
      campusId: req.campusId,
      concessionName: { $regex: new RegExp(`^${cleanName}$`, "i") },
    });

    if (existing) {
      return res.status(400).json({ success: false, message: "Concession already exists" });
    }

    const concession = await Concession.create({
      campusId: req.campusId,
      concessionName: cleanName,
      concessionType: concessionType || "Percentage",
      concessionValue: Number(concessionValue) || 0,
      applicableFeeHeads: applicableFeeHeads || [],
      applicableMonths: applicableMonths || [],
      feeScheme: feeScheme || "Monthly",
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "Concession created successfully",
      data: concession,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// UPDATE concession
router.put("/concessions/:id", async (req, res) => {
  try {
    const {
      concessionName,
      concessionType,
      concessionValue,
      applicableFeeHeads,
      applicableMonths,
      feeScheme,
      isActive,
    } = req.body;

    const cleanName = concessionName ? concessionName.trim() : undefined;
    if (cleanName) {
      const duplicate = await Concession.findOne({
        campusId: req.campusId,
        _id: { $ne: req.params.id },
        concessionName: { $regex: new RegExp(`^${cleanName}$`, "i") },
      });
      if (duplicate) {
        return res.status(400).json({ success: false, message: "Concession name already in use" });
      }
    }

    const updated = await Concession.findOneAndUpdate(
      { _id: req.params.id, campusId: req.campusId },
      {
        ...(cleanName ? { concessionName: cleanName } : {}),
        concessionType,
        concessionValue: Number(concessionValue),
        applicableFeeHeads,
        applicableMonths,
        feeScheme,
        ...(isActive !== undefined ? { isActive } : {}),
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Concession not found" });
    }

    res.status(200).json({
      success: true,
      message: "Concession updated successfully",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// TOGGLE concession active
router.patch("/concessions/:id/toggle-status", async (req, res) => {
  try {
    const item = await Concession.findOne({ _id: req.params.id, campusId: req.campusId });
    if (!item) {
      return res.status(404).json({ success: false, message: "Concession not found" });
    }

    item.isActive = !item.isActive;
    await item.save();

    res.status(200).json({
      success: true,
      message: `Concession marked as ${item.isActive ? "Active" : "Inactive"}`,
      isActive: item.isActive,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE concession
router.delete("/concessions/:id", async (req, res) => {
  try {
    const deleted = await Concession.findOneAndDelete({
      _id: req.params.id,
      campusId: req.campusId,
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Concession not found" });
    }

    res.status(200).json({ success: true, message: "Concession deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ==========================================================
   SUBSCRIPTION & BILLING
========================================================== */
router.get("/billing", async (req, res) => {
  try {
    const activeStudents = await Student.countDocuments({
      schoolId: req.schoolId,
      status: "Active",
    });

    const inactiveStudents = await Student.countDocuments({
      schoolId: req.schoolId,
      status: "Inactive",
    });

    res.status(200).json({
      success: true,
      data: {
        activeStudents: activeStudents || 0,
        inactiveStudents: inactiveStudents || 0,
        ratePerStudent: 4,
        gstPercent: 18,
        currentDueDate: "2026-06-25",
        isExpired: false,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/* ==========================================================
   REPORTS / ANALYTICS
========================================================== */
router.get("/reports", async (req, res) => {
  try {
    const [plans, concessions, scheme] = await Promise.all([
      FeePlan.find({ campusId: req.campusId }).lean(),
      Concession.find({ campusId: req.campusId }).lean(),
      FeeScheme.findOne({ campusId: req.campusId }).lean(),
    ]);

    res.status(200).json({
      success: true,
      data: {
        feePlans: plans || [],
        concessions: concessions || [],
        feeScheme: scheme || {},
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
