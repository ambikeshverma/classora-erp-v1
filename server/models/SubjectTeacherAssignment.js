const mongoose = require("mongoose");

const subjectTeacherAssignmentSchema = new mongoose.Schema(
  {
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SchoolAdmin",
      required: true,
      index: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },
    sectionId: {
      type: String,
      required: true,
      trim: true,
    },
    sectionName: {
      type: String,
      default: "",
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
      index: true,
    },
    teacherStaffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

subjectTeacherAssignmentSchema.index(
  { campusId: 1, classId: 1, sectionId: 1, subjectId: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "SubjectTeacherAssignment",
  subjectTeacherAssignmentSchema
);
