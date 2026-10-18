const express = require("express");
const router = express.Router();
const Student = require("../models/Student");
const auth = require("../middleware/auth");

// Add Student
router.post("/add", auth, async (req, res) => {
  try {
    const schoolId = req.schoolId || req.user?.schoolId;
    if (!schoolId) {
      return res.status(400).json({ success: false, msg: "School ID could not be identified from token" });
    }

    const student = new Student({
      ...req.body,
      schoolId,
    });

    await student.save();

    res.json({
      success: true,
      msg: "Student added successfully",
      student,
    });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
});

// Get Students - only logged-in school's students
router.get("/", auth, async (req, res) => {
  try {
    const schoolId = req.schoolId || req.user?.schoolId;
    if (!schoolId) {
      return res.status(400).json({ success: false, msg: "School ID could not be identified from token" });
    }

    const students = await Student.find({ schoolId }).sort({ createdAt: -1 });

    res.json(students);
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
});

module.exports = router;