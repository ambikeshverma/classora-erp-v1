const mongoose = require("mongoose");

const studentSubjectMappingSchema = new mongoose.Schema(
  {
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SchoolAdmin",
      required: true,
      index: true,
    },
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SchoolAdmin",
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admission",
      required: true,
      index: true,
    },
    admissionNo: {
      type: String,
      required: true,
      trim: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    className: {
      type: String,
      required: true,
      trim: true,
    },
    section: {
      type: String,
      required: true,
      trim: true,
    },
    rollNo: {
      type: String,
      default: "",
      trim: true,
    },
    scholasticSubjects: [
      {
        type: String,
        trim: true,
      },
    ],
    coScholasticSubjects: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { timestamps: true }
);

// One mapping per student per campus
studentSubjectMappingSchema.index({ campusId: 1, studentId: 1 }, { unique: true });
// Compound index for querying students in a class & section quickly
studentSubjectMappingSchema.index({ campusId: 1, className: 1, section: 1 });

module.exports = mongoose.model("StudentSubjectMapping", studentSubjectMappingSchema);
