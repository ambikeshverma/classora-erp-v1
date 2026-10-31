const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 0 },
  paymentDate: { type: String, required: true },
  paymentMode: { type: String, required: true },
  remarks: { type: String, default: "" },
  bankName: { type: String, default: "" },
  transactionNumber: { type: String, default: "" },
  transactionDate: { type: String, default: "" },
  upiAppName: { type: String, default: "" },
  transactionId: { type: String, default: "" },
  chequeNumber: { type: String, default: "" },
  issueDate: { type: String, default: "" },
  paidByName: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

const salaryRecordSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin", required: true, index: true },
    campusId: { type: mongoose.Schema.Types.ObjectId, ref: "SchoolAdmin", required: true, index: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },

    // Snapshot so a salary slip stays correct if the staff profile changes later
    employeeCode: { type: String, default: "" },
    employeeName: { type: String, default: "" },
    departmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Department", default: null },
    positionId: { type: mongoose.Schema.Types.ObjectId, ref: "Position", default: null },
    department: { type: String, default: "" },
    position: { type: String, default: "" },

    month: { type: String, required: true }, // January ... December
    year: { type: String, required: true },
    session: { type: String, default: "" },

    grossSalary: { type: Number, default: 0 },
    totalLeave: { type: Number, default: 0 },
    paidLeave: { type: Number, default: 0 },
    deductibleLeave: { type: Number, default: 0 },
    leaveDeduction: { type: Number, default: 0 },
    otherDeduction: { type: Number, default: 0 },
    netSalary: { type: Number, default: 0 },

    paidAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ["Unpaid", "Partially Paid", "Paid"], default: "Unpaid", index: true },
    payments: { type: [paymentSchema], default: [] },

    generatedByName: { type: String, default: "" },
  },
  { timestamps: true }
);

salaryRecordSchema.index({ campusId: 1, staffId: 1, month: 1, year: 1 }, { unique: true });
salaryRecordSchema.index({ campusId: 1, year: 1, month: 1 });

module.exports = mongoose.models.SalaryRecord || mongoose.model("SalaryRecord", salaryRecordSchema);
