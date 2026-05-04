const express = require("express");
const router = express.Router();
const Student = require("../models/Student");
const auth = require("../middleware/auth");

// Add Student
router.post("/add", auth, async (req, res) => {
  try {
    const student = new Student({
      ...req.body,
      schoolId: req.user.schoolId
    });

    await student.save();

    res.json({
      msg: "Student added successfully",
      student
    });

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Get Students - only logged-in school's students
router.get("/", auth, async (req, res) => {
  try {
    const students = await Student.find({
      schoolId: req.user.schoolId
    });

    res.json(students);

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;