const mongoose = require("mongoose");

const classSubjectMappingSchema = new mongoose.Schema(
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
    className: {
      type: String,
      required: true,
      trim: true,
    },
    classId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
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

// Unique compound index: One mapping document per class per campus
classSubjectMappingSchema.index({ campusId: 1, className: 1 }, { unique: true });

module.exports = mongoose.model("ClassSubjectMapping", classSubjectMappingSchema);
