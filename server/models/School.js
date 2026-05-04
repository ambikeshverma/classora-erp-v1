const mongoose = require("mongoose");

const schoolSchema = new mongoose.Schema({
  schoolName: { type: String, required: true },
  campusId: { type: String, required: true, unique: true },
  email: { type: String, required: true },
  password: { type: String, required: true },

  address: String,
  phone: String,

  isActive: {
    type: Boolean,
    default: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("School", schoolSchema);