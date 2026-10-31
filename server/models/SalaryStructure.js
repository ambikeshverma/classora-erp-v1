const mongoose = require("mongoose");

const salaryStructureSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin", required: true, index: true },
    campusId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin", required: true, index: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },
    monthlySalary: { type: Number, required: true, min: 0 },
    effectiveFrom: { type: String, required: true, trim: true }, // YYYY-MM
  },
  { timestamps: true }
);

// One structure per employee
salaryStructureSchema.index({ campusId: 1, staffId: 1 }, { unique: true });

module.exports = mongoose.models.SalaryStructure || mongoose.model("SalaryStructure", salaryStructureSchema);
