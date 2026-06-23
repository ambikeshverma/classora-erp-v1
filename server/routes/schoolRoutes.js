const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const School = require("../models/schoolAdminSchema");
const jwt = require("jsonwebtoken");
const SECRETKEY = process.env.JWT_SECRET

// School Login
router.post("/login", async (req, res) => {
  try {
    const { campusId, email, password } = req.body;

    const school = await School.findOne({ campusId, email });

    if (!school) {
      return res.status(400).json({ msg: "School not found" });
    }

    if (!school.isActive) {
      return res.status(400).json({ msg: "School is deactivated" });
    }
     const match = await bcrypt.compare(password, school.password);
    if (!match) {
      return res.status(400).json({ msg: "Invalid password" });
    }

    const token = jwt.sign(
      {
        schoolId: school._id,
        campusId: school.campusId
      },
      SECRETKEY,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      name: school.schoolName,
      schoolId: school._id,
      campusId: school.campusId
    });

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;