const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const schoolRoutes = require("./routes/schoolRoutes");
const studentRoutes = require("./routes/studentRoutes");
const admissionRoutes = require("./routes/admissionRoutes");
app.use("/api/school", schoolRoutes);
app.use("/api/students", studentRoutes);
app.use("api/admissions", admissionRoutes);
mongoose
  .connect("mongodb://127.0.0.1:27017/classora")
  .then(() => {
    console.log("MongoDB Connected");

    app.listen(5000, () => {
      console.log("Server running on http://localhost:5000");
    });
  })
  .catch((err) => {
    console.log("MongoDB Connection Error:", err.message);
  });