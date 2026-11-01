const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const schoolAuth = require("../middleware/schoolAuth");

const Department = require("../models/Department");
const Staff = require("../models/Staff");
const Class = require("../models/Class");
const Admission = require("../models/Admission");
const AdmissionEnquiry = require("../models/AdmissionEnquiry");
const FeeCounter = require("../models/FeeCounter");
const IdCardIssue = require("../models/IdCardIssue");

const { escapeRegex } = require("../utils/feeEngine");

// Every reception record is stored against the school/campus resolved from the access token (schoolAuth)
// Module + sub-module entitlement, enforced here and not only in the frontend
router.use(
  schoolAuth,
  schoolAuth.guardRoutes("reception", [
    { re: /^\/(meta|students\/search)/, sub: null },
    { re: /^\/enquiry-sources/, method: "GET", sub: null },
    { re: /^\/enquiry-sources/, sub: "enquiry_sources" },
    { re: /^\/follow-ups/, sub: "follow_up_management" },
    { re: /^\/gate-passes/, sub: "gate_pass_management" },
    { re: /^\/id-cards/, sub: ["student_id_management", "parent_id_management"] },
    { re: /^\/appointments/, sub: ["appointment_scheduling", "visitor_management"] },
    { re: /^\/visitors/, sub: "visitor_management" },
    { re: /^\/complaints/, sub: "support_complaint" },
    { re: /^\/reports/, sub: "reception_reports" },
  ])
);

/* ══════════════════════════════════════════════════════════════
   MODELS (campusId + schoolId come from the token)
══════════════════════════════════════════════════════════════ */
const ref = { type: mongoose.Schema.Types.ObjectId };
const tenant = { campusId: { ...ref, required: true, index: true }, schoolId: { ...ref, index: true } };

const EnquirySource = require("../models/EnquirySource");

const followUpSchema = new mongoose.Schema(
  {
    ...tenant,
    enquiryId: { ...ref, ref: "AdmissionEnquiry", required: true },
    studentName: { type: String, required: true },
    mobileNumber: { type: String, default: "" },
    classInterested: { type: String, default: "" },
    followUpDate: { type: String, required: true },
    followUpType: { type: String, required: true },
    discussionNotes: { type: String, default: "" },
    nextFollowUpDate: { type: String, default: "" },
    followUpStatus: { type: String, required: true },
  },
  { timestamps: true }
);
followUpSchema.index({ campusId: 1, enquiryId: 1 });
const FollowUp = mongoose.models.FollowUp || mongoose.model("FollowUp", followUpSchema);

const gatePassSchema = new mongoose.Schema(
  {
    ...tenant,
    passNumber: { type: String, required: true },
    studentId: { ...ref, ref: "Admission", default: null },
    studentName: { type: String, required: true },
    className: { type: String, default: "" },
    section: { type: String, default: "" },
    rollNumber: { type: String, default: "" },
    guardianName: { type: String, default: "" },
    mobile: { type: String, default: "" },
    reason: { type: String, required: true },
    outTime: { type: String, default: "" },
    inTime: { type: String, default: "" },
    passDate: { type: String, required: true },
    status: { type: String, default: "Issued", enum: ["Issued", "Returned", "Cancelled"] },
    remarks: { type: String, default: "" },
  },
  { timestamps: true }
);
gatePassSchema.index({ campusId: 1, passDate: 1 });
const GatePass = mongoose.models.GatePass || mongoose.model("GatePass", gatePassSchema);

const appointmentSchema = new mongoose.Schema(
  {
    ...tenant,
    appointmentId: { type: String, required: true },
    visitorName: { type: String, required: true },
    mobile: { type: String, required: true },
    departmentId: { type: String, default: "" },
    departmentName: { type: String, default: "" },
    personToMeetId: { type: String, default: "" },
    personToMeet: { type: String, default: "" },
    appointmentDate: { type: String, required: true },
    timeSlot: { type: String, required: true },
    purpose: { type: String, default: "" },
    remarks: { type: String, default: "" },
    status: { type: String, default: "Pending", enum: ["Pending", "Approved", "Rejected", "Completed", "Cancelled"] },
  },
  { timestamps: true }
);
appointmentSchema.index({ campusId: 1, appointmentDate: 1 });
const Appointment = mongoose.models.Appointment || mongoose.model("Appointment", appointmentSchema);

const visitorSchema = new mongoose.Schema(
  {
    ...tenant,
    visitorType: { type: String, default: "Walk-In Visitor" },
    appointmentRef: { ...ref, ref: "Appointment", default: null },
    visitorName: { type: String, required: true },
    mobile: { type: String, required: true },
    address: { type: String, default: "" },
    purpose: { type: String, default: "" },
    whomToMeet: { type: String, default: "" },
    department: { type: String, default: "" },
    idProof: { type: String, default: "" },
    remarks: { type: String, default: "" },
    visitDate: { type: String, required: true },
    inTime: { type: String, default: "" },
    outTime: { type: String, default: "" },
    status: { type: String, default: "Waiting", enum: ["Waiting", "Inside Campus", "Exited", "Cancelled"] },
  },
  { timestamps: true }
);
visitorSchema.index({ campusId: 1, visitDate: 1 });
const Visitor = mongoose.models.Visitor || mongoose.model("Visitor", visitorSchema);

const supportComplaintSchema = new mongoose.Schema(
  {
    ...tenant,
    complaintId: { type: String, required: true },
    guardianName: { type: String, required: true },
    studentName: { type: String, required: true },
    className: { type: String, default: "" },
    mobile: { type: String, required: true },
    category: { type: String, required: true },
    priority: { type: String, default: "Medium" },
    department: { type: String, default: "" },
    assignedUser: { type: String, default: "" },
    complaintDate: { type: String, required: true },
    complaintDetails: { type: String, required: true },
    remarks: { type: String, default: "" },
    resolutionNotes: { type: String, default: "" },
    resolutionDate: { type: String, default: "" },
    status: { type: String, default: "Open", enum: ["Open", "In Progress", "Resolved", "Closed", "Rejected"] },
  },
  { timestamps: true }
);
supportComplaintSchema.index({ campusId: 1, complaintDate: 1 });
const SupportComplaint = mongoose.models.SupportComplaint || mongoose.model("SupportComplaint", supportComplaintSchema);

/* ══════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════ */
const FOLLOW_UP_TYPES = ["Call", "WhatsApp", "Visit", "SMS", "Meeting"];
const FOLLOW_UP_STATUSES = ["Interested", "Call Back Later", "No Response", "Not Interested", "Admission Confirmed"];
const APPOINTMENT_STATUSES = ["Pending", "Approved", "Rejected", "Completed", "Cancelled"];
const VISITOR_STATUSES = ["Waiting", "Inside Campus", "Exited", "Cancelled"];
const VISITOR_TYPES = ["Walk-In Visitor", "Appointment Visitor"];
const COMPLAINT_STATUSES = ["Open", "In Progress", "Resolved", "Closed", "Rejected"];
const COMPLAINT_PRIORITIES = ["Low", "Medium", "High", "Urgent"];
const GATE_PASS_STATUSES = ["Issued", "Returned", "Cancelled"];

// Layout presets for the ID card previews (the cards themselves are built from student data)
const ID_TEMPLATES = {
  STUDENT: [
    { id: "vertical", name: "Vertical Card", orientation: "Vertical" },
    { id: "horizontal", name: "Horizontal Card", orientation: "Horizontal" },
  ],
  PARENT: [
    { id: "landscape", name: "Parent ID Landscape", orientation: "Horizontal" },
    { id: "classic", name: "Parent ID Classic", orientation: "Horizontal" },
  ],
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const fail = (res, status, message) => res.status(status).json({ success: false, message });
const serverError = (res, error) => res.status(500).json({ success: false, message: error.message });
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const owner = (req) => ({ schoolId: req.schoolId, campusId: req.campusId });
const actorName = (req) => req.user?.name || req.school?.schoolName || "";
const exactNameRegex = (name) => new RegExp(`^${escapeRegex(String(name).trim())}$`, "i");
const searchRegex = (text) => new RegExp(escapeRegex(String(text).trim()), "i");
const text = (value) => String(value ?? "").trim();

// Only listed fields are ever copied from a request body (no campusId / number overrides)
const pick = (body, fields) => {
  const out = {};
  fields.forEach((field) => {
    if (body[field] !== undefined) out[field] = typeof body[field] === "string" ? body[field].trim() : body[field];
  });
  return out;
};

const schoolInfoOf = (school) => ({
  schoolName: school?.schoolName || "",
  address: school?.address || "",
  email: school?.email || "",
  phone: school?.contactNo || "",
  website: school?.website || "",
  logo: school?.schoolLogo || "",
});

// Per school + prefix + year running number, e.g. GP-2026-0001
const nextNumber = async (campusId, prefix) => {
  const year = new Date().getFullYear();
  const counter = await FeeCounter.findOneAndUpdate(
    { campusId, session: `reception:${prefix}:${year}` },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return `${prefix}-${year}-${String(counter.seq).padStart(4, "0")}`;
};

const classContext = async (campusId) => {
  const classes = await Class.find({ campusId }).select("className sections").sort({ className: 1 }).lean();
  return classes.map((item) => ({
    className: item.className,
    sections: (item.sections || []).map((section) => section.sectionName),
  }));
};

/* ══════════════════════════════════════════════════════════════
   META — departments, staff, open enquiries and sources for dropdowns
══════════════════════════════════════════════════════════════ */
router.get("/meta", async (req, res) => {
  try {
    const campusId = req.campusId;

    const [departments, staff, activeEnquiries, enquirySources, usedSources] = await Promise.all([
      Department.find({ campusId }).select("departmentName").sort({ departmentName: 1 }).lean(),
      Staff.find({ campusId, isActive: { $ne: false }, lastWorkingDate: { $in: ["", null] } })
        .select("employeeName departmentId mobile")
        .sort({ employeeName: 1 })
        .lean(),
      AdmissionEnquiry.find({ campusId, status: { $in: ["NEW", "FOLLOW-UP"] } })
        .select("studentName mobileNumber classInterested status")
        .sort({ createdAt: -1 })
        .lean(),
      EnquirySource.find({ campusId }).select("sourceName").sort({ sourceName: 1 }).lean(),
      AdmissionEnquiry.distinct("source", { campusId }),
    ]);

    const used = new Set(usedSources.map((name) => String(name).toLowerCase()));

    res.json({
      success: true,
      data: {
        departments,
        // fullName is kept for the existing screens that read it
        staff: staff.map((item) => ({ ...item, fullName: item.employeeName })),
        activeEnquiries,
        enquirySources: enquirySources.map((item) => ({ ...item, isUsed: used.has(item.sourceName.toLowerCase()) })),
      },
    });
  } catch (error) {
    serverError(res, error);
  }
});

/* ══════════════════════════════════════════════════════════════
   ENQUIRY SOURCES (feed the source list of Admission Enquiries)
══════════════════════════════════════════════════════════════ */
const sourceInUse = (campusId, sourceName) =>
  AdmissionEnquiry.exists({ campusId, source: exactNameRegex(sourceName) });

router.get("/enquiry-sources", async (req, res) => {
  try {
    const [sources, usedSources] = await Promise.all([
      EnquirySource.find({ campusId: req.campusId }).sort({ createdAt: 1 }).lean(),
      AdmissionEnquiry.distinct("source", { campusId: req.campusId }),
    ]);

    const used = new Set(usedSources.map((name) => String(name).toLowerCase()));
    res.json({ success: true, data: sources.map((item) => ({ ...item, isUsed: used.has(item.sourceName.toLowerCase()) })) });
  } catch (error) {
    serverError(res, error);
  }
});

router.post("/enquiry-sources", async (req, res) => {
  try {
    const sourceName = text(req.body.sourceName);
    if (!sourceName) return fail(res, 400, "Source name is required");

    if (await EnquirySource.exists({ campusId: req.campusId, sourceName: exactNameRegex(sourceName) })) {
      return fail(res, 400, "Source name already exists");
    }

    const source = await EnquirySource.create({ ...owner(req), sourceName, description: text(req.body.description) });
    res.status(201).json({ success: true, data: source, message: "Enquiry source added successfully" });
  } catch (error) {
    serverError(res, error);
  }
});

router.put("/enquiry-sources/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid source id");

    const sourceName = text(req.body.sourceName);
    if (!sourceName) return fail(res, 400, "Source name is required");

    const source = await EnquirySource.findOne({ _id: req.params.id, campusId: req.campusId });
    if (!source) return fail(res, 404, "Enquiry source not found");
    if (await sourceInUse(req.campusId, source.sourceName)) {
      return fail(res, 400, "Cannot edit a source that is already in use");
    }

    if (await EnquirySource.exists({ campusId: req.campusId, _id: { $ne: source._id }, sourceName: exactNameRegex(sourceName) })) {
      return fail(res, 400, "Source name already exists");
    }

    source.sourceName = sourceName;
    source.description = text(req.body.description);
    await source.save();

    res.json({ success: true, data: source, message: "Enquiry source updated successfully" });
  } catch (error) {
    serverError(res, error);
  }
});

router.delete("/enquiry-sources/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid source id");

    const source = await EnquirySource.findOne({ _id: req.params.id, campusId: req.campusId });
    if (!source) return fail(res, 404, "Enquiry source not found");
    if (await sourceInUse(req.campusId, source.sourceName)) return fail(res, 400, "Cannot delete a source that is in use");

    await source.deleteOne();
    res.json({ success: true, message: "Enquiry source deleted successfully" });
  } catch (error) {
    serverError(res, error);
  }
});

/* ══════════════════════════════════════════════════════════════
   FOLLOW-UPS (keep the admission enquiry status in step)
══════════════════════════════════════════════════════════════ */
const enquiryStatusFor = (followUpStatus) => {
  if (followUpStatus === "Admission Confirmed") return "CONVERTED";
  if (followUpStatus === "Not Interested") return "CLOSED";
  return "FOLLOW-UP";
};

const validateFollowUp = (body) => {
  if (!DATE_PATTERN.test(String(body.followUpDate || ""))) return "Follow-up date is required";
  if (!FOLLOW_UP_TYPES.includes(body.followUpType)) return "Select a valid follow-up type";
  if (!FOLLOW_UP_STATUSES.includes(body.followUpStatus)) return "Select a valid follow-up status";

  if (["Interested", "Call Back Later", "No Response"].includes(body.followUpStatus)) {
    if (!DATE_PATTERN.test(String(body.nextFollowUpDate || ""))) return "Please select next follow-up date";
    if (body.nextFollowUpDate < body.followUpDate) return "Next follow-up date cannot be before the follow-up date";
  }
  return "";
};

router.get("/follow-ups", async (req, res) => {
  try {
    const followUps = await FollowUp.find({ campusId: req.campusId }).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: followUps });
  } catch (error) {
    serverError(res, error);
  }
});

router.post("/follow-ups", async (req, res) => {
  try {
    const { enquiryId } = req.body;
    if (!enquiryId || !isValidId(enquiryId)) return fail(res, 400, "Select an enquiry");

    const input = pick(req.body, ["followUpDate", "followUpType", "discussionNotes", "nextFollowUpDate", "followUpStatus"]);
    const error = validateFollowUp(input);
    if (error) return fail(res, 400, error);

    const enquiry = await AdmissionEnquiry.findOne({ _id: enquiryId, campusId: req.campusId })
      .select("studentName mobileNumber classInterested")
      .lean();
    if (!enquiry) return fail(res, 404, "Enquiry not found");

    // Student details are taken from the enquiry itself, not from the request
    const followUp = await FollowUp.create({
      ...owner(req),
      ...input,
      enquiryId: enquiry._id,
      studentName: enquiry.studentName,
      mobileNumber: enquiry.mobileNumber,
      classInterested: enquiry.classInterested,
    });

    await AdmissionEnquiry.updateOne(
      { _id: enquiry._id, campusId: req.campusId },
      { $set: { status: enquiryStatusFor(input.followUpStatus) } }
    );

    res.status(201).json({ success: true, data: followUp, message: "Follow-up saved successfully" });
  } catch (error) {
    serverError(res, error);
  }
});

router.put("/follow-ups/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid follow-up id");

    const input = pick(req.body, ["followUpDate", "followUpType", "discussionNotes", "nextFollowUpDate", "followUpStatus"]);
    const error = validateFollowUp(input);
    if (error) return fail(res, 400, error);

    const followUp = await FollowUp.findOneAndUpdate({ _id: req.params.id, campusId: req.campusId }, { $set: input }, { new: true });
    if (!followUp) return fail(res, 404, "Follow-up not found");

    await AdmissionEnquiry.updateOne(
      { _id: followUp.enquiryId, campusId: req.campusId },
      { $set: { status: enquiryStatusFor(input.followUpStatus) } }
    );

    res.json({ success: true, data: followUp, message: "Follow-up updated successfully" });
  } catch (error) {
    serverError(res, error);
  }
});

router.delete("/follow-ups/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid follow-up id");

    const deleted = await FollowUp.findOneAndDelete({ _id: req.params.id, campusId: req.campusId });
    if (!deleted) return fail(res, 404, "Follow-up not found");

    res.json({ success: true, message: "Follow-up deleted successfully" });
  } catch (error) {
    serverError(res, error);
  }
});

/* ══════════════════════════════════════════════════════════════
   STUDENT LOOKUP (gate pass)
══════════════════════════════════════════════════════════════ */
router.get("/students/search", async (req, res) => {
  try {
    const q = text(req.query.q);
    if (q.length < 2) return res.json({ success: true, data: [] });

    const rx = searchRegex(q);
    const students = await Admission.find({
      schoolId: req.schoolId,
      status: "Active",
      $or: [{ studentName: rx }, { fatherName: rx }, { mobile: rx }, { srNo: rx }, { schoolAdmissionNo: rx }],
    })
      .select("studentName fatherName mobile srNo schoolAdmissionNo className section rollNumber rollNo")
      .sort({ studentName: 1 })
      .limit(15)
      .lean();

    res.json({
      success: true,
      data: students.map((student) => ({
        _id: student._id,
        studentName: student.studentName,
        fatherName: student.fatherName,
        mobile: student.mobile,
        srNo: student.srNo,
        admissionNo: student.schoolAdmissionNo || "",
        className: student.className,
        section: student.section,
        rollNumber: student.rollNumber || student.rollNo || "",
      })),
    });
  } catch (error) {
    serverError(res, error);
  }
});

/* ══════════════════════════════════════════════════════════════
   GATE PASSES
══════════════════════════════════════════════════════════════ */
router.get("/gate-passes", async (req, res) => {
  try {
    const { passDate, status, search } = req.query;
    const filter = { campusId: req.campusId };
    if (passDate) filter.passDate = passDate;
    if (status) filter.status = status;
    if (search && text(search)) {
      const rx = searchRegex(search);
      filter.$or = [{ studentName: rx }, { guardianName: rx }, { passNumber: rx }];
    }

    const passes = await GatePass.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: passes });
  } catch (error) {
    serverError(res, error);
  }
});

router.post("/gate-passes", async (req, res) => {
  try {
    const { studentId } = req.body;
    const reason = text(req.body.reason);
    const passDate = text(req.body.passDate);
    const outTime = text(req.body.outTime);

    if (!studentId || !isValidId(studentId)) return fail(res, 400, "Select a student");
    if (!reason) return fail(res, 400, "Reason is required");
    if (!DATE_PATTERN.test(passDate)) return fail(res, 400, "Pass date is required");
    if (outTime && !TIME_PATTERN.test(outTime)) return fail(res, 400, "Invalid out time");

    const student = await Admission.findOne({ _id: studentId, schoolId: req.schoolId })
      .select("studentName fatherName mobile className section rollNumber rollNo status")
      .lean();
    if (!student) return fail(res, 404, "Student not found");
    if (student.status !== "Active") return fail(res, 400, "Gate pass can only be issued to active students");

    const pass = await GatePass.create({
      ...owner(req),
      passNumber: await nextNumber(req.campusId, "GP"),
      studentId: student._id,
      studentName: student.studentName,
      className: student.className,
      section: student.section,
      rollNumber: student.rollNumber || student.rollNo || "",
      guardianName: text(req.body.guardianName) || student.fatherName || "",
      mobile: text(req.body.mobile) || student.mobile || "",
      reason,
      outTime,
      passDate,
      remarks: text(req.body.remarks),
    });

    res.status(201).json({ success: true, data: pass, message: "Gate pass issued successfully" });
  } catch (error) {
    serverError(res, error);
  }
});

router.patch("/gate-passes/:id/status", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid gate pass id");

    const { status } = req.body;
    if (!["Returned", "Cancelled"].includes(status)) return fail(res, 400, "Invalid status");

    const update = { status };
    if (status === "Returned") {
      const inTime = text(req.body.inTime);
      if (inTime && !TIME_PATTERN.test(inTime)) return fail(res, 400, "Invalid in time");
      if (inTime) update.inTime = inTime;
    }

    // Only an issued pass can be returned or cancelled
    const pass = await GatePass.findOneAndUpdate({ _id: req.params.id, campusId: req.campusId, status: "Issued" }, { $set: update }, { new: true });
    if (!pass) return fail(res, 400, "Only an issued gate pass can be updated");

    res.json({ success: true, data: pass, message: "Gate pass updated" });
  } catch (error) {
    serverError(res, error);
  }
});

router.delete("/gate-passes/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid gate pass id");

    const deleted = await GatePass.findOneAndDelete({ _id: req.params.id, campusId: req.campusId });
    if (!deleted) return fail(res, 404, "Gate pass not found");

    res.json({ success: true, message: "Gate pass deleted successfully" });
  } catch (error) {
    serverError(res, error);
  }
});

/* ══════════════════════════════════════════════════════════════
   APPOINTMENTS
══════════════════════════════════════════════════════════════ */
router.get("/appointments", async (req, res) => {
  try {
    const { appointmentDate, status, search } = req.query;
    const filter = { campusId: req.campusId };
    if (appointmentDate) filter.appointmentDate = appointmentDate;
    if (status) filter.status = status;
    if (search && text(search)) {
      const rx = searchRegex(search);
      filter.$or = [{ visitorName: rx }, { mobile: rx }, { appointmentId: rx }];
    }

    const appointments = await Appointment.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: appointments });
  } catch (error) {
    serverError(res, error);
  }
});

router.post("/appointments", async (req, res) => {
  try {
    const input = pick(req.body, ["visitorName", "mobile", "appointmentDate", "timeSlot", "purpose", "remarks"]);

    if (!input.visitorName || !input.mobile || !input.timeSlot || !DATE_PATTERN.test(String(input.appointmentDate || ""))) {
      return fail(res, 400, "Required fields missing");
    }

    // Department and person are resolved from HR so the stored names are always real
    let departmentId = "";
    let departmentName = "";
    let personToMeetId = "";
    let personToMeet = "";

    if (req.body.departmentId) {
      if (!isValidId(req.body.departmentId)) return fail(res, 400, "Invalid department");
      const department = await Department.findOne({ _id: req.body.departmentId, campusId: req.campusId }).select("departmentName").lean();
      if (!department) return fail(res, 404, "Department not found");
      departmentId = String(department._id);
      departmentName = department.departmentName;
    }

    if (req.body.personToMeetId) {
      if (!isValidId(req.body.personToMeetId)) return fail(res, 400, "Invalid person to meet");
      const member = await Staff.findOne({ _id: req.body.personToMeetId, campusId: req.campusId }).select("employeeName").lean();
      if (!member) return fail(res, 404, "Staff member not found");
      personToMeetId = String(member._id);
      personToMeet = member.employeeName;
    }

    // One person cannot be booked twice for the same slot
    if (personToMeetId) {
      const taken = await Appointment.exists({
        campusId: req.campusId,
        personToMeetId,
        appointmentDate: input.appointmentDate,
        timeSlot: input.timeSlot,
        status: { $in: ["Pending", "Approved"] },
      });
      if (taken) return fail(res, 400, `${personToMeet} already has an appointment at that time`);
    }

    const appointment = await Appointment.create({
      ...owner(req),
      ...input,
      departmentId,
      departmentName,
      personToMeetId,
      personToMeet,
      appointmentId: await nextNumber(req.campusId, "APT"),
    });

    res.status(201).json({ success: true, data: appointment, message: "Appointment created successfully" });
  } catch (error) {
    serverError(res, error);
  }
});

router.patch("/appointments/:id/status", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid appointment id");

    const { status } = req.body;
    if (!APPOINTMENT_STATUSES.includes(status)) return fail(res, 400, "Invalid status");

    const appointment = await Appointment.findOneAndUpdate({ _id: req.params.id, campusId: req.campusId }, { $set: { status } }, { new: true });
    if (!appointment) return fail(res, 404, "Appointment not found");

    res.json({ success: true, data: appointment, message: `Appointment ${status.toLowerCase()} successfully` });
  } catch (error) {
    serverError(res, error);
  }
});

router.delete("/appointments/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid appointment id");

    if (await Visitor.exists({ campusId: req.campusId, appointmentRef: req.params.id })) {
      return fail(res, 400, "A visitor entry exists for this appointment and it cannot be deleted");
    }

    const deleted = await Appointment.findOneAndDelete({ _id: req.params.id, campusId: req.campusId });
    if (!deleted) return fail(res, 404, "Appointment not found");

    res.json({ success: true, message: "Appointment deleted successfully" });
  } catch (error) {
    serverError(res, error);
  }
});

/* ══════════════════════════════════════════════════════════════
   VISITORS (appointment visitors close their appointment on exit)
══════════════════════════════════════════════════════════════ */
router.get("/visitors", async (req, res) => {
  try {
    const { visitDate, status, visitorType, search } = req.query;
    const filter = { campusId: req.campusId };
    if (visitDate) filter.visitDate = visitDate;
    if (status) filter.status = status;
    if (visitorType) filter.visitorType = visitorType;
    if (search && text(search)) {
      const rx = searchRegex(search);
      filter.$or = [{ visitorName: rx }, { mobile: rx }];
    }

    const visitors = await Visitor.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: visitors });
  } catch (error) {
    serverError(res, error);
  }
});

// Approved appointments that have not been checked in yet
router.get("/visitors/approved-appointments", async (req, res) => {
  try {
    const [appointments, checkedIn] = await Promise.all([
      Appointment.find({ campusId: req.campusId, status: "Approved" })
        .select("appointmentId visitorName mobile purpose personToMeet departmentName")
        .sort({ appointmentDate: 1 })
        .lean(),
      Visitor.distinct("appointmentRef", { campusId: req.campusId, appointmentRef: { $ne: null } }),
    ]);

    const taken = new Set(checkedIn.map(String));

    res.json({
      success: true,
      data: appointments.filter((item) => !taken.has(String(item._id))).map((item) => ({ ...item, department: item.departmentName })),
    });
  } catch (error) {
    serverError(res, error);
  }
});

router.post("/visitors", async (req, res) => {
  try {
    const input = pick(req.body, ["visitorName", "mobile", "address", "purpose", "whomToMeet", "department", "idProof", "remarks", "visitDate"]);

    if (!input.visitorName || !input.mobile || !DATE_PATTERN.test(String(input.visitDate || ""))) {
      return fail(res, 400, "Visitor name, mobile and visit date are required");
    }

    let visitorType = VISITOR_TYPES.includes(req.body.visitorType) ? req.body.visitorType : "Walk-In Visitor";
    let appointmentRef = null;

    if (req.body.appointmentRef) {
      if (!isValidId(req.body.appointmentRef)) return fail(res, 400, "Invalid appointment");

      const appointment = await Appointment.findOne({ _id: req.body.appointmentRef, campusId: req.campusId, status: "Approved" }).select("_id").lean();
      if (!appointment) return fail(res, 400, "Only an approved appointment can be checked in");
      if (await Visitor.exists({ campusId: req.campusId, appointmentRef: appointment._id })) {
        return fail(res, 400, "This appointment is already checked in");
      }

      appointmentRef = appointment._id;
      visitorType = "Appointment Visitor";
    }

    const status = VISITOR_STATUSES.includes(req.body.status) ? req.body.status : "Waiting";
    const inTime = text(req.body.inTime);
    if (inTime && !TIME_PATTERN.test(inTime)) return fail(res, 400, "Invalid in time");

    const visitor = await Visitor.create({ ...owner(req), ...input, visitorType, appointmentRef, status, inTime });
    res.status(201).json({ success: true, data: visitor, message: "Visitor added successfully" });
  } catch (error) {
    serverError(res, error);
  }
});

router.patch("/visitors/:id/status", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid visitor id");

    const { status } = req.body;
    if (!VISITOR_STATUSES.includes(status)) return fail(res, 400, "Invalid status");

    const inTime = text(req.body.inTime);
    const outTime = text(req.body.outTime);
    if ((inTime && !TIME_PATTERN.test(inTime)) || (outTime && !TIME_PATTERN.test(outTime))) return fail(res, 400, "Invalid time");

    const update = { status };
    if (inTime) update.inTime = inTime;
    if (outTime) update.outTime = outTime;

    const visitor = await Visitor.findOneAndUpdate({ _id: req.params.id, campusId: req.campusId }, { $set: update }, { new: true });
    if (!visitor) return fail(res, 404, "Visitor not found");

    // The visit is over, so the appointment it came from is completed
    if (status === "Exited" && visitor.appointmentRef) {
      await Appointment.updateOne({ _id: visitor.appointmentRef, campusId: req.campusId, status: "Approved" }, { $set: { status: "Completed" } });
    }

    res.json({ success: true, data: visitor, message: "Visitor status updated" });
  } catch (error) {
    serverError(res, error);
  }
});

router.delete("/visitors/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid visitor id");

    const deleted = await Visitor.findOneAndDelete({ _id: req.params.id, campusId: req.campusId });
    if (!deleted) return fail(res, 404, "Visitor not found");

    res.json({ success: true, message: "Visitor deleted successfully" });
  } catch (error) {
    serverError(res, error);
  }
});

/* ══════════════════════════════════════════════════════════════
   SUPPORT & COMPLAINTS
══════════════════════════════════════════════════════════════ */
router.get("/complaints", async (req, res) => {
  try {
    const { complaintDate, status, priority, search } = req.query;
    const filter = { campusId: req.campusId };
    if (complaintDate) filter.complaintDate = complaintDate;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search && text(search)) {
      const rx = searchRegex(search);
      filter.$or = [{ guardianName: rx }, { studentName: rx }, { mobile: rx }, { complaintId: rx }];
    }

    const complaints = await SupportComplaint.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: complaints });
  } catch (error) {
    serverError(res, error);
  }
});

router.post("/complaints", async (req, res) => {
  try {
    const input = pick(req.body, [
      "guardianName", "studentName", "className", "mobile", "category", "priority",
      "department", "assignedUser", "complaintDate", "complaintDetails", "remarks",
    ]);

    if (!input.guardianName || !input.studentName || !input.mobile || !input.category || !input.complaintDetails) {
      return fail(res, 400, "Required fields missing");
    }

    input.priority = COMPLAINT_PRIORITIES.includes(input.priority) ? input.priority : "Medium";
    input.complaintDate = DATE_PATTERN.test(String(input.complaintDate || "")) ? input.complaintDate : new Date().toISOString().split("T")[0];

    const complaint = await SupportComplaint.create({
      ...owner(req),
      ...input,
      complaintId: await nextNumber(req.campusId, "CMP"),
    });

    res.status(201).json({ success: true, data: complaint, message: "Complaint created successfully" });
  } catch (error) {
    serverError(res, error);
  }
});

router.patch("/complaints/:id/status", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid complaint id");

    const { status } = req.body;
    if (!COMPLAINT_STATUSES.includes(status)) return fail(res, 400, "Invalid status");

    const update = { status };
    if (status === "Resolved" || status === "Closed") update.resolutionDate = new Date().toISOString().split("T")[0];
    if (req.body.resolutionNotes !== undefined) update.resolutionNotes = text(req.body.resolutionNotes);

    const complaint = await SupportComplaint.findOneAndUpdate({ _id: req.params.id, campusId: req.campusId }, { $set: update }, { new: true });
    if (!complaint) return fail(res, 404, "Complaint not found");

    res.json({ success: true, data: complaint, message: "Complaint status updated" });
  } catch (error) {
    serverError(res, error);
  }
});

router.delete("/complaints/:id", async (req, res) => {
  try {
    if (!isValidId(req.params.id)) return fail(res, 400, "Invalid complaint id");

    const deleted = await SupportComplaint.findOneAndDelete({ _id: req.params.id, campusId: req.campusId });
    if (!deleted) return fail(res, 404, "Complaint not found");

    res.json({ success: true, message: "Complaint deleted successfully" });
  } catch (error) {
    serverError(res, error);
  }
});

/* ══════════════════════════════════════════════════════════════
   STUDENT ID / PARENT ID CARDS
══════════════════════════════════════════════════════════════ */
const CARD_TYPES = ["STUDENT", "PARENT"];

router.get("/id-cards/meta", async (req, res) => {
  try {
    res.json({
      success: true,
      data: { classes: await classContext(req.campusId), templates: ID_TEMPLATES, schoolInfo: schoolInfoOf(req.school) },
    });
  } catch (error) {
    serverError(res, error);
  }
});

// Active students with photo and card status; the photos themselves are only loaded for the preview
router.get("/id-cards/students", async (req, res) => {
  try {
    const { type, className, section, photo, status } = req.query;
    if (!CARD_TYPES.includes(type)) return fail(res, 400, "Select card type");

    const match = { schoolId: req.schoolId, status: "Active" };
    if (className) match.className = className;
    if (section) match.section = section;

    const students = await Admission.aggregate([
      { $match: match },
      {
        $project: {
          studentName: 1,
          fatherName: 1,
          motherName: 1,
          mobile: 1,
          className: 1,
          section: 1,
          rollNumber: 1,
          rollNo: 1,
          srNo: 1,
          schoolAdmissionNo: 1,
          dob: 1,
          hasPhoto: { $gt: [{ $strLenCP: { $ifNull: ["$studentImage", ""] } }, 0] },
        },
      },
      ...(photo === "YES" ? [{ $match: { hasPhoto: true } }] : photo === "NO" ? [{ $match: { hasPhoto: false } }] : []),
      { $sort: { className: 1, section: 1, studentName: 1 } },
      { $limit: 1000 },
    ]);

    const issued = students.length
      ? await IdCardIssue.find({ campusId: req.campusId, type, studentId: { $in: students.map((s) => s._id) } })
          .select("studentId printCount lastIssuedAt")
          .lean()
      : [];
    const issuedMap = new Map(issued.map((item) => [String(item.studentId), item]));

    const rows = students
      .map((student) => ({
        _id: student._id,
        studentName: student.studentName,
        fatherName: student.fatherName,
        motherName: student.motherName,
        mobile: student.mobile,
        className: student.className,
        section: student.section,
        rollNo: student.rollNumber || student.rollNo || "",
        admissionNo: student.schoolAdmissionNo || "",
        srNo: student.srNo,
        photo: student.hasPhoto ? "YES" : "NO",
        idStatus: issuedMap.has(String(student._id)) ? "ISSUED" : "NOT ISSUED",
        printCount: issuedMap.get(String(student._id))?.printCount || 0,
      }))
      .filter((row) => !status || row.idStatus === status);

    res.json({ success: true, data: rows });
  } catch (error) {
    serverError(res, error);
  }
});

// Full card details (with photos) for the selected students only
router.post("/id-cards/preview", async (req, res) => {
  try {
    const ids = Array.isArray(req.body.studentIds) ? req.body.studentIds : [];
    if (ids.length === 0 || ids.length > 100 || !ids.every(isValidId)) return fail(res, 400, "Select between 1 and 100 students");

    const students = await Admission.find({ _id: { $in: ids }, schoolId: req.schoolId })
      .select("studentName fatherName motherName mobile className section rollNumber rollNo srNo schoolAdmissionNo dob studentImage permanentAddress permanentCity permanentState permanentPin localAddress localCity")
      .lean();

    res.json({
      success: true,
      data: {
        schoolInfo: schoolInfoOf(req.school),
        students: students.map((student) => ({
          _id: student._id,
          studentName: student.studentName,
          fatherName: student.fatherName,
          motherName: student.motherName,
          mobile: student.mobile,
          className: student.className,
          section: student.section,
          rollNo: student.rollNumber || student.rollNo || "",
          srNo: student.srNo,
          admissionNo: student.schoolAdmissionNo || "",
          dob: student.dob,
          photoUrl: student.studentImage || "",
          address:
            [student.permanentAddress, student.permanentCity, student.permanentState, student.permanentPin].filter(Boolean).join(", ") ||
            [student.localAddress, student.localCity].filter(Boolean).join(", "),
        })),
      },
    });
  } catch (error) {
    serverError(res, error);
  }
});

// Printing a card marks it as issued (printing again counts as a reprint)
router.post("/id-cards/issue", async (req, res) => {
  try {
    const { type, template } = req.body;
    const ids = Array.isArray(req.body.studentIds) ? req.body.studentIds : [];

    if (!CARD_TYPES.includes(type)) return fail(res, 400, "Select card type");
    if (ids.length === 0 || !ids.every(isValidId)) return fail(res, 400, "Please select students");

    const students = await Admission.find({ _id: { $in: ids }, schoolId: req.schoolId, status: "Active" }).select("_id").lean();
    if (students.length === 0) return fail(res, 404, "No active student found");

    await IdCardIssue.bulkWrite(
      students.map((student) => ({
        updateOne: {
          filter: { campusId: req.campusId, type, studentId: student._id },
          update: {
            $set: { schoolId: req.schoolId, template: text(template), lastIssuedAt: new Date(), issuedByName: actorName(req) },
            $inc: { printCount: 1 },
          },
          upsert: true,
        },
      }))
    );

    res.json({ success: true, message: `${students.length} card(s) marked as issued`, data: { issued: students.length } });
  } catch (error) {
    serverError(res, error);
  }
});

/* ══════════════════════════════════════════════════════════════
   REPORTS — summary figures plus every record set for the report screen
══════════════════════════════════════════════════════════════ */
router.get("/reports", async (req, res) => {
  try {
    const campusId = req.campusId;
    const today = new Date().toISOString().split("T")[0];

    const [followUps, appointments, visitors, gatePasses, complaints, sourceCount] = await Promise.all([
      FollowUp.find({ campusId }).sort({ followUpDate: -1 }).lean(),
      Appointment.find({ campusId }).sort({ appointmentDate: -1 }).lean(),
      Visitor.find({ campusId }).sort({ visitDate: -1 }).lean(),
      GatePass.find({ campusId }).sort({ passDate: -1 }).lean(),
      SupportComplaint.find({ campusId }).sort({ complaintDate: -1 }).lean(),
      EnquirySource.countDocuments({ campusId }),
    ]);

    const count = (list, test) => list.filter(test).length;

    res.json({
      success: true,
      data: {
        visitors: {
          total: visitors.length,
          today: count(visitors, (v) => v.visitDate === today),
          active: count(visitors, (v) => v.status === "Inside Campus"),
        },
        appointments: {
          total: appointments.length,
          today: count(appointments, (a) => a.appointmentDate === today),
          pending: count(appointments, (a) => a.status === "Pending"),
        },
        complaints: {
          open: count(complaints, (c) => ["Open", "In Progress"].includes(c.status)),
          resolved: count(complaints, (c) => c.status === "Resolved"),
        },
        gatePasses: { total: gatePasses.length, active: count(gatePasses, (g) => g.status === "Issued") },
        followUps: { total: followUps.length },
        enquirySources: { total: sourceCount },
        records: { followUps, appointments, visitors, gatePasses, complaints },
        schoolInfo: schoolInfoOf(req.school),
      },
    });
  } catch (error) {
    serverError(res, error);
  }
});

module.exports = router;
