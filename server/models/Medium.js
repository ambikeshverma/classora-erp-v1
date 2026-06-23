const mongoose = require("mongoose");

const mediumSchema = new mongoose.Schema(
  {
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SchoolAdmin",
      required: true,
      index: true,
    },

    mediumName: {
      type: String,
      required: true,
      trim: true,
    },

    mediumCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
  },
  { timestamps: true }
);

mediumSchema.index({ campusId: 1, mediumName: 1 }, { unique: true });
mediumSchema.index({ campusId: 1, mediumCode: 1 }, { unique: true });

module.exports = mongoose.model("Medium", mediumSchema);