const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const db_connection = require("./config/db_connection.js");
const schoolAuth = require("./middleware/schoolAuth.js");

const app = express();

// 🔌 Connect Database
db_connection();

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";

// 🌐 CORS with Cookies / Credentials support
const allowedOrigins = [
  CLIENT_URL,
  "http://localhost:3000",
  "http://127.0.0.1:3000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "x-refresh-token"],
  })
);

// 📦 Core Middleware
app.use(cookieParser());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// 🏥 Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    system: "Classora Multi-Tenant ERP API",
    time: new Date().toISOString(),
  });
});

// 🛣️ Route Handlers
const adminRoutes = require("./routes/adminRoutes");
const schoolRoutes = require("./routes/schoolRoutes");
const studentRoutes = require("./routes/StudentRoutes");
const admissionRoutes = require("./routes/admissionRoutes");
const masterRoutes = require("./routes/masterRoutes");
const hrRoutes = require("./routes/hrRoutes");
const userControlRoutes = require("./routes/userControlRoutes");
const adminPanelRoutes = require("./routes/adminPanelRoutes");
const receptionRoutes = require("./routes/receptionRoutes");
const studentHubRoutes = require("./routes/studentHubRoutes");
const academicRoutes = require("./routes/academicRoutes");

app.use("/api/superAdmin", adminRoutes);
app.use("/api/school", schoolRoutes);
app.use("/api/students", schoolAuth, studentRoutes);
app.use("/api/admissions", schoolAuth, admissionRoutes);
app.use("/api/master", schoolAuth, masterRoutes);
app.use("/api/hr", hrRoutes);
app.use("/api/user-control", userControlRoutes);
app.use("/api/admin-panel", adminPanelRoutes);
app.use("/api/reception", receptionRoutes);
app.use("/api/student-hub", studentHubRoutes);
app.use("/api/academic", schoolAuth, academicRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Internal Server Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "An unexpected server error occurred",
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Classora ERP Backend is running on port ${PORT}`);
  console.log(`📡 Client URL: ${CLIENT_URL}`);
  console.log(`👑 Super Admin API: http://localhost:${PORT}/api/superAdmin`);
  console.log(`🏫 School API: http://localhost:${PORT}/api/school`);
});