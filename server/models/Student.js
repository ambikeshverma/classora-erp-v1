const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  class: {
    type: String
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