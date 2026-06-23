const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");
const SchoolAdmin = require("../models/schoolAdminSchema");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// 👑 Create Super Admin (only once)
router.post("/create-super-admin", async (req, res) => {
  // const existingAdmin = await Admin.findOne();

  // if (existingAdmin) {
  //   return res.status(403).send("Super Admin already exists ❌");
  // }

  const { email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = new Admin({
    email,
    password: hashedPassword
  });

  await admin.save();

  res.send("Super Admin Created ✅");
});

// 🔐 Login with JWT
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({ email });

  if (!admin) {
    return res.status(400).send("Invalid Email ❌");
  }

  const isMatch = await bcrypt.compare(password, admin.password);

  if (!isMatch) {
    return res.status(400).send("Invalid Password ❌");
  }

  // 🔑 Token generate
  const token = jwt.sign(
    { id: admin._id },
    "secretkey123",
    { expiresIn: "1d" }
  );

  res.json({
    message: "Login Successful ✅",
    token: token
  });
});

router.post("/create-school-admin", async (req, res) => {
  try {
    const {
      campusId,
      email,
      password,
      schoolLogo,
      principalSignature,
      address,
      contactNo,
      website,
      schoolName,
      principalName,
    } = req.body;

    if (
      !campusId ||
      !email ||
      !password ||
      !address ||
      !contactNo ||
      !schoolName ||
      !principalName
    ) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    const existingAdmin = await SchoolAdmin.findOne({
      $or: [{ campusId }, { email }],
    });

    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: "Campus ID or Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const schoolAdmin = await SchoolAdmin.create({
      campusId,
      email,
      password: hashedPassword,
      schoolLogo,
      principalSignature,
      address,
      contactNo,
      website,
      schoolName,
      principalName,
      role: "schoolAdmin",
    });

    res.status(201).json({
      success: true,
      message: "School Admin created successfully",
      data: {
        id: schoolAdmin._id,
        campusId: schoolAdmin.campusId,
        email: schoolAdmin.email,
        schoolName: schoolAdmin.schoolName,
        principalName: schoolAdmin.principalName,
        role: schoolAdmin.role,
        isActive: schoolAdmin.isActive,
      },
    });
  } catch (error) {
    console.error("Create School Admin Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

module.exports = router;