const mongoose = require("mongoose");

const admissionSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SchoolAdmin",
      required: true,
      index: true,
    },
    // Actual campus ID used by schools & present in login token (e.g. "SCH001" or "CAMPUS001")
    campusId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    session: { type: String, trim: true },

    className: { type: String, required: true, trim: true },
    feePlan: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true },
    admissionDate: { type: String, required: true, trim: true },
    gender: { type: String, required: true, trim: true },

    studentName: { type: String, required: true, trim: true },
    fatherName: { type: String, required: true, trim: true },
    motherName: { type: String, required: true, trim: true },
    dob: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    srNo: { type: String, required: true, trim: true },
    medium: { type: String, required: true, trim: true },

    altMobile: { type: String, trim: true, default: "" },
    aadhar: {
      type: String,
      trim: true,
      default: undefined,
    },
    email: { type: String, trim: true, default: "" },
    studentImage: { type: String, default: "" },

    siblingGroup: { type: String, default: "No Siblings" },
    concessionPlan: { type: String, default: "No Concession Plan" },
    routeName: { type: String, default: "Not Assigned" },
    vehicleName: { type: String, default: "Not Assigned" },
    udisePenNo: { type: String, trim: true, default: "" },
    apaarId: { type: String, trim: true, default: "" },
    schoolAdmissionNo: {
      type: String,
      trim: true,
      default: undefined,
    },
    hostelRoomNo: { type: String, trim: true, default: "" },
    house: { type: String, default: "Not Assigned" },

    studentNameRL: { type: String, trim: true, default: "" },
    fatherNameRL: { type: String, trim: true, default: "" },
    motherNameRL: { type: String, trim: true, default: "" },

    permanentAddress: { type: String, default: "" },
    permanentAddress1: { type: String, default: "" },
    permanentCity: { type: String, default: "" },
    permanentState: { type: String, default: "" },
    permanentPin: { type: String, default: "" },

    localAddress: { type: String, default: "" },
    localAddress1: { type: String, default: "" },
    localCity: { type: String, default: "" },
    localState: { type: String, default: "" },
    localPin: { type: String, default: "" },

    fatherOccupation: { type: String, default: "" },
    fatherEducation: { type: String, default: "" },
    fatherAadhar: { type: String, default: "" },
    familyIncome: { type: String, default: "" },
    motherOccupation: { type: String, default: "" },
    motherEducation: { type: String, default: "" },
    motherAadhar: { type: String, default: "" },

    lastSchool: { type: String, default: "" },
    lastClass: { type: String, default: "" },
    height: { type: String, default: "" },
    weight: { type: String, default: "" },
    bloodGroup: { type: String, default: "" },
    religion: { type: String, default: "" },
    community: { type: String, default: "" },
    caste: { type: String, default: "" },

    subjects: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      default: "Active",
      index: true,
    },

    rollNumber: {
      type: String,
      default: "",
    },
    rollNo: {
      type: String,
      default: "",
    },
    houseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "House",
      default: null,
    },
    inactiveReason: {
      type: String,
      default: "",
    },
    passYear: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Indexes
admissionSchema.index({ schoolId: 1, srNo: 1 }, { unique: true });
// Speeds up Fee Manager student lookups and session-wide dues reports
admissionSchema.index({ schoolId: 1, status: 1, session: 1 });

// Aadhar is unique per school ONLY when provided and non-empty
admissionSchema.index(
  { schoolId: 1, aadhar: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { aadhar: { $type: "string", $gt: "" } },
  }
);

// School Admission No is unique per school ONLY when provided and non-empty
// Using partialFilterExpression ensures empty string "" or missing values NEVER collide
admissionSchema.index(
  { schoolId: 1, schoolAdmissionNo: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: {
      schoolAdmissionNo: { $type: "string", $gt: "" },
    },
  }
);

// Auto-cleanup legacy conflicting non-partial index on connection
const dropLegacyIndexes = async () => {
  try {
    const col = mongoose.connection.collection("admissions");
    const indexes = await col.indexes();
    for (const idx of indexes) {
      if (
        idx.name === "schoolId_1_schoolAdmissionNo_1" &&
        !idx.partialFilterExpression
      ) {
        await col.dropIndex("schoolId_1_schoolAdmissionNo_1");
        console.log("⚡ Dropped legacy non-partial index schoolId_1_schoolAdmissionNo_1");
      }
      if (
        idx.name === "schoolId_1_aadhar_1" &&
        !idx.partialFilterExpression
      ) {
        await col.dropIndex("schoolId_1_aadhar_1");
        console.log("⚡ Dropped legacy non-partial index schoolId_1_aadhar_1");
      }
    }
  } catch (err) {
    // Ignore if collection not created yet
  }
};

mongoose.connection.on("connected", dropLegacyIndexes);
if (mongoose.connection.readyState === 1) {
  dropLegacyIndexes();
}

module.exports =
  mongoose.models.Admission || mongoose.model("Admission", admissionSchema);
