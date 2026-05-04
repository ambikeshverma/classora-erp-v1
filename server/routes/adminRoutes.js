const express = require("express");
const router = express.Router();
const Admin = require("../models/Admin");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// 👑 Create Super Admin (only once)
router.post("/create-super-admin", async (req, res) => {
  const existingAdmin = await Admin.findOne();

  if (existingAdmin) {
    return res.status(403).send("Super Admin already exists ❌");
  }

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

module.exports = router;