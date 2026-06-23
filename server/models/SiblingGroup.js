const mongoose = require("mongoose");

const siblingGroupSchema = new mongoose.Schema(
  {
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SchoolAdmin",
      required: true,
      index: true,
    },

    guardianName: {
      type: String,
      required: true,
      trim: true,
    },

    guardianMobileNo: {
      type: String,
      required: true,
      trim: true,
    },

    students: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Student",
          required: true,
        },

        studentName: {
          type: String,
          required: true,
          trim: true,
        },

        admissionNo: {
          type: String,
          trim: true,
        },
      },
    ],
  },
  { timestamps: true }
);

siblingGroupSchema.index(
  { campusId: 1, guardianMobileNo: 1 },
  { unique: true }
);

module.exports = mongoose.model("SiblingGroup", siblingGroupSchema);