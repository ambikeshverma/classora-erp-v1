const mongoose = require("mongoose");

const attendanceSettingsSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SchoolAdmin",
      required: true,
      index: true,
    },
    campusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SchoolAdmin",
      required: true,
      unique: true,
      index: true,
    },
    geoSettings: {
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      radius: { type: Number, default: 200 }, // in meters
      isLocked: { type: Boolean, default: false },
      lockedAt: { type: Date, default: null },
      address: { type: String, default: "" },
    },
    closedDates: [
      {
        date: { type: String, required: true }, // YYYY-MM-DD
        fromDate: { type: String, required: true },
        toDate: { type: String, required: true },
        reason: { type: String, required: true, trim: true },
      },
    ],
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.AttendanceSettings ||
  mongoose.model("AttendanceSettings", attendanceSettingsSchema);

