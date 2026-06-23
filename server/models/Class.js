const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    campusId: {
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

    classCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    sections: [
      {
        sectionName: {
          type: String,
          required: true,
          trim: true,
        },

        sectionCode: {
          type: String,
          required: true,
          trim: true,
          uppercase: true,
        },
      },
    ],
  },
  { timestamps: true }
);

classSchema.index({ campusId: 1, className: 1 }, { unique: true });
classSchema.index({ campusId: 1, classCode: 1 }, { unique: true });

module.exports = mongoose.model("Class", classSchema);