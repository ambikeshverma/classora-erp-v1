const mongoose = require("mongoose");

const admissionSchema = new mongoose.Schema(
  {
    schoolId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true
    },

    session: String,

    className: { type: String, required: true },
    feePlan: { type: String, required: true },
    section: { type: String, required: true },
    admissionDate: { type: String, required: true },
    gender: { type: String, required: true },

    studentName: { type: String, required: true },
    fatherName: { type: String, required: true },
    motherName: { type: String, required: true },
    dob: { type: String, required: true },
    mobile: { type: String, required: true },
    srNo: { type: String, required: true },
    medium: { type: String, required: true },

    altMobile: String,
    aadhar: String,
    email: String,
    studentImage: String,

    siblingGroup: String,
    concessionPlan: String,
    routeName: String,
    vehicleName: String,
    udisePenNo: String,
    apaarId: String,
    schoolAdmissionNo: String,
    hostelRoomNo: String,
    house: String,

    studentNameRL: String,
    fatherNameRL: String,
    motherNameRL: String,

    permanentAddress: String,
    permanentAddress1: String,
    permanentCity: String,
    permanentState: String,
    permanentPin: String,

    localAddress: String,
    localAddress1: String,
    localCity: String,
    localState: String,
    localPin: String,

    fatherOccupation: String,
    fatherEducation: String,
    fatherAadhar: String,
    familyIncome: String,
    motherOccupation: String,
    motherEducation: String,
    motherAadhar: String,

    lastSchool: String,
    lastClass: String,
    height: String,
    weight: String,
    bloodGroup: String,
    religion: String,
    community: String,
    caste: String,

    subjects: {
      type: [String],
      default: []
    },

    status: {
      type: String,
      default: "Active"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admission", admissionSchema);