const mongoose = require("mongoose");

const userSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    // Unique key per user (e.g., "schoolAdmin:6ad4ae..." or "superAdmin:12345...")
    // Ensures a user NEVER creates multiple rows; same document is modified on every login
    userKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    role: {
      type: String,
      required: true,
      default: "user",
      index: true,
    },
    name: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
      index: true,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SchoolAdmin",
      default: null,
      index: true,
    },
    campusId: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },
    schoolName: {
      type: String,
      default: "",
      trim: true,
    },
    // Unique session ID embedded in the JWT access & refresh tokens
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    ipAddress: {
      type: String,
      default: "Unknown",
      trim: true,
    },
    userAgent: {
      type: String,
      default: "",
      trim: true,
    },
    device: {
      type: String,
      default: "Browser",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    forceLoggedOut: {
      type: Boolean,
      default: false,
      index: true,
    },
    forceLoggedOutAt: {
      type: Date,
      default: null,
    },
    forceLoggedOutBy: {
      type: String,
      default: null,
    },
    loginAt: {
      type: Date,
      default: Date.now,
    },
    lastActivityAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const UserSession = mongoose.models.UserSession || mongoose.model("UserSession", userSessionSchema);

module.exports = UserSession;

