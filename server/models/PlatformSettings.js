const mongoose = require("mongoose");

// Single document (key: "default") holding platform-wide billing and contact settings.
// Defaults reproduce the rules the School Admin billing page used before it became dynamic.
const platformSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "default", unique: true },
    ratePerStudent: { type: Number, default: 4, min: 0 },
    gstPercent: { type: Number, default: 18, min: 0, max: 100 },
    includeInactiveStudents: { type: Boolean, default: true },
    discounts: {
      Monthly: { type: Number, default: 0, min: 0, max: 100 },
      Quarterly: { type: Number, default: 5, min: 0, max: 100 },
      "Half-Yearly": { type: Number, default: 10, min: 0, max: 100 },
      Annual: { type: Number, default: 15, min: 0, max: 100 },
    },
    gracePeriodDays: { type: Number, default: 0, min: 0, max: 90 },
    expiryWarningDays: { type: Number, default: 30, min: 1, max: 180 },
    // Days before expiry at which a dashboard reminder escalates (reminders only, never changes access)
    reminderDays: { type: [Number], default: [30, 7, 1] },
    // Manual QR payments: QR image lives in protected file storage, only its reference is kept here
    paymentQrPath: { type: String, default: "" },
    paymentQrMime: { type: String, default: "" },
    paymentInstructions: { type: String, default: "", trim: true },
    accountDetails: { type: String, default: "", trim: true },
    proofRequired: { type: Boolean, default: true },
    merchantName: { type: String, default: "Classora ERP", trim: true },
    upiId: { type: String, default: "", trim: true },
    supportPhone: { type: String, default: "", trim: true },
    supportEmail: { type: String, default: "", trim: true },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.PlatformSettings || mongoose.model("PlatformSettings", platformSettingsSchema);
