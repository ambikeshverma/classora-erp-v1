const express = require("express");
const router = express.Router();

const Admission = require("../models/Admission");
const auth = require("../middleware/auth");

// Add new admission
router.post("/add", auth, async (req, res) => {
  try {
    const schoolId = req.user.schoolId;

    const {
      srNo,
      mobile,
      aadhar,
      schoolAdmissionNo
    } = req.body;

    const duplicate = await Admission.findOne({
      schoolId,
      $or: [
        { srNo },
        { mobile },
        ...(aadhar ? [{ aadhar }] : []),
        ...(schoolAdmissionNo ? [{ schoolAdmissionNo }] : [])
      ]
    });

    if (duplicate) {
      return res.status(400).json({
        msg: "Duplicate record found. Admission already exists."
      });
    }

    const admission = new Admission({
      ...req.body,
      schoolId
    });

    await admission.save();

    res.json({
      msg: "Admission saved successfully",
      admission
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Get all admissions for logged-in school
router.get("/", auth, async (req, res) => {
  try {
    const admissions = await Admission.find({
      schoolId: req.user.schoolId
    }).sort({ createdAt: -1 });

    res.json(admissions);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;