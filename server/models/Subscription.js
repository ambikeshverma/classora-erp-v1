const mongoose = require("mongoose");

// One subscription record per school. Status (Active / Grace / Expired) is derived from expiryDate.
const subscriptionSchema = new mongoose.Schema(
  {
    schoolId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
    plan: { type: String, enum: ["Monthly", "Quarterly", "Half-Yearly", "Annual", "Custom"], default: "Monthly" },
    startDate: { type: Date },
    // Last day covered by the paid subscription (inclusive)
    expiryDate: { type: Date, index: true },
    // 0 = unlimited. Informational: shown against live student counts.
    studentLimit: { type: Number, default: 0, min: 0 },
    notes: { type: String, default: "", trim: true },
    // Set when the school was suspended by the expiry rule, so a verified payment can reactivate it
    suspendedByExpiry: { type: Boolean, default: false }, // legacy flag, no longer set
    // Super Admin switch: when true, new students beyond studentLimit are refused by the backend
    restrictStudentAdditions: { type: Boolean, default: false },
    inflightStudents: { type: Number, default: 0, min: 0 },
    inflightUpdatedAt: { type: Date },
    // Reminder bookkeeping so each school/interval is surfaced once per expiry cycle
    reminderAckExpiry: { type: Date },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Subscription || mongoose.model("Subscription", subscriptionSchema);
