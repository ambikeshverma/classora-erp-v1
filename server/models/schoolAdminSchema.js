const mongoose = require("mongoose");

const schoolAdminSchema = new mongoose.Schema(
  {
    campusId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    schoolLogo: {
      type: String,
      default: "",
    },

    principalSignature: {
      type: String,
      default: "",
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    contactNo: {
      type: String,
      required: true,
      trim: true,
    },

    website: {
      type: String,
      default: "",
      trim: true,
    },

    schoolName: {
      type: String,
      required: true,
      trim: true,
    },

    principalName: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String,
      default: "schoolAdmin",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SchoolAdmin", schoolAdminSchema);