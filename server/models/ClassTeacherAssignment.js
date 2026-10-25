const mongoose = require("mongoose");

const classTeacherAssignmentSchema = new mongoose.Schema(
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
    classTeacher1Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      default: null,
    },
    classTeacher2Id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      default: null,
    },
  },
  { timestamps: true }
);

classTeacherAssignmentSchema.index(
  { campusId: 1, classId: 1, sectionId: 1 },
  { unique: true }
);

module.exports = mongoose.model(
  "ClassTeacherAssignment",
  classTeacherAssignmentSchema
);
