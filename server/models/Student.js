const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  fullName: {
    type: String
  },
  admissionNo: {
    type: String
  },
  srNo: {
    type: String
  },
  class: {
    type: String
  },
  className: {
    type: String
  },
  section: {
    type: String
  },
  rollNumber: {
    type: String,
    default: ""
  },
  rollNo: {
    type: String,
    default: ""
  },
  fatherName: {
    type: String
  },
  mobile: {
    type: String
  },
  medium: {
    type: String
  },
  house: {
    type: String
  },
  houseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "House"
  },
  inactiveReason: {
    type: String,
    default: ""
  },
  passYear: {
    type: String,
    default: ""
  },

  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
    required: true,
    index: true,
  },
  campusId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "School",
    index: true,
  },
  status: {
    type: String,
    default: "Active",
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Student", studentSchema);