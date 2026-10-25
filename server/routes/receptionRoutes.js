const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const schoolAuth = require("../middleware/schoolAuth");

// ─── All routes require schoolAuth ─────────────────────────────────────────
router.use(schoolAuth);

/* ══════════════════════════════════════════════════════════════
   INLINE MODELS (multi-tenant, campusId-indexed)
══════════════════════════════════════════════════════════════ */

// 1. Enquiry Source
const enquirySourceSchema = new mongoose.Schema(
  {
    campusId:   { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    sourceName: { type: String, required: true, trim: true },
    description:{ type: String, default: "" },
    isUsed:     { type: Boolean, default: false },
  },
  { timestamps: true }
);
enquirySourceSchema.index({ campusId: 1, sourceName: 1 }, { unique: true });
const EnquirySource = mongoose.models.EnquirySource || mongoose.model("EnquirySource", enquirySourceSchema);

// 2. Follow-Up
const followUpSchema = new mongoose.Schema(
  {
    campusId:       { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    enquiryId:      { type: mongoose.Schema.Types.ObjectId, ref: "AdmissionEnquiry", required: true },
    studentName:    { type: String, required: true },
    mobileNumber:   { type: String, default: "" },
    classInterested:{ type: String, default: "" },
    followUpDate:   { type: String, required: true },
    followUpType:   { type: String, required: true },
    discussionNotes:{ type: String, default: "" },
    nextFollowUpDate:{ type: String, default: "" },
    followUpStatus: { type: String, required: true },
  },
  { timestamps: true }
);
const FollowUp = mongoose.models.FollowUp || mongoose.model("FollowUp", followUpSchema);

// 3. Gate Pass
const gatePassSchema = new mongoose.Schema(
  {
    campusId:    { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    passNumber:  { type: String, required: true },
    studentName: { type: String, required: true },
    className:   { type: String, default: "" },
    section:     { type: String, default: "" },
    rollNumber:  { type: String, default: "" },
    guardianName:{ type: String, default: "" },
    mobile:      { type: String, default: "" },
    reason:      { type: String, required: true },
    outTime:     { type: String, default: "" },
    inTime:      { type: String, default: "" },
    passDate:    { type: String, required: true },
    status:      { type: String, default: "Issued", enum: ["Issued", "Returned", "Cancelled"] },
    remarks:     { type: String, default: "" },
  },
  { timestamps: true }
);
const GatePass = mongoose.models.GatePass || mongoose.model("GatePass", gatePassSchema);

// 4. Appointment
const appointmentSchema = new mongoose.Schema(
  {
    campusId:       { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    appointmentId:  { type: String, required: true },
    visitorName:    { type: String, required: true },
    mobile:         { type: String, required: true },
    departmentId:   { type: String, default: "" },
    departmentName: { type: String, default: "" },
    personToMeetId: { type: String, default: "" },
    personToMeet:   { type: String, default: "" },
    appointmentDate:{ type: String, required: true },
    timeSlot:       { type: String, required: true },
    purpose:        { type: String, default: "" },
    remarks:        { type: String, default: "" },
    status:         { type: String, default: "Pending", enum: ["Pending","Approved","Rejected","Completed","Cancelled"] },
  },
  { timestamps: true }
);
const Appointment = mongoose.models.Appointment || mongoose.model("Appointment", appointmentSchema);

// 5. Visitor
const visitorSchema = new mongoose.Schema(
  {
    campusId:       { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    visitorType:    { type: String, default: "Walk-In Visitor" },
    appointmentRef: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", default: null },
    visitorName:    { type: String, required: true },
    mobile:         { type: String, required: true },
    address:        { type: String, default: "" },
    purpose:        { type: String, default: "" },
    whomToMeet:     { type: String, default: "" },
    department:     { type: String, default: "" },
    idProof:        { type: String, default: "" },
    remarks:        { type: String, default: "" },
    visitDate:      { type: String, required: true },
    inTime:         { type: String, default: "" },
    outTime:        { type: String, default: "" },
    status:         { type: String, default: "Waiting", enum: ["Waiting","Inside Campus","Exited","Cancelled"] },
  },
  { timestamps: true }
);
const Visitor = mongoose.models.Visitor || mongoose.model("Visitor", visitorSchema);

// 6. Support & Complaint
const supportComplaintSchema = new mongoose.Schema(
  {
    campusId:       { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    complaintId:    { type: String, required: true },
    guardianName:   { type: String, required: true },
    studentName:    { type: String, required: true },
    className:      { type: String, default: "" },
    mobile:         { type: String, required: true },
    category:       { type: String, required: true },
    priority:       { type: String, default: "Medium" },
    department:     { type: String, default: "" },
    assignedUser:   { type: String, default: "" },
    complaintDate:  { type: String, required: true },
    complaintDetails:{ type: String, required: true },
    remarks:        { type: String, default: "" },
    resolutionNotes:{ type: String, default: "" },
    resolutionDate: { type: String, default: "" },
    status:         { type: String, default: "Open", enum: ["Open","In Progress","Resolved","Closed","Rejected"] },
  },
  { timestamps: true }
);
const SupportComplaint = mongoose.models.SupportComplaint || mongoose.model("SupportComplaint", supportComplaintSchema);

/* ══════════════════════════════════════════════════════════════
   BATCH META (departments + staff from HR for dropdowns)
══════════════════════════════════════════════════════════════ */

router.get("/meta", async (req, res) => {
  try {
    const campusId = req.campusId;

    const [Department, Staff] = (() => {
      const depModel = mongoose.models.Department || mongoose.model("Department",
        new mongoose.Schema({ campusId: mongoose.Schema.Types.ObjectId, departmentName: String, isActive: Boolean })
      );
      const staffModel = mongoose.models.Staff || mongoose.model("Staff",
        new mongoose.Schema({ campusId: mongoose.Schema.Types.ObjectId, departmentId: mongoose.Schema.Types.ObjectId, fullName: String, isActive: Boolean })
      );
      return [depModel, staffModel];
    })();

    // Import AdmissionEnquiry for follow-up dropdowns
    const AdmissionEnquiry = mongoose.models.AdmissionEnquiry ||
      require("../models/AdmissionEnquiry");

    const [departments, staff, activeEnquiries, enquirySources] = await Promise.all([
      Department.find({ campusId }).select("_id departmentName").lean(),
      Staff.find({ campusId, isActive: true }).select("_id fullName departmentId").lean(),
      AdmissionEnquiry.find({ campusId, status: { $in: ["NEW", "FOLLOW-UP"] } })
        .select("_id studentName mobileNumber classInterested status")
        .lean(),
      EnquirySource.find({ campusId }).select("_id sourceName isUsed").lean(),
    ]);

    res.json({
      success: true,
      data: { departments, staff, activeEnquiries, enquirySources },
    });
  } catch (err) {
    console.error("Reception meta error:", err);
    res.status(500).json({ success: false, message: "Failed to load meta data" });
  }
});

/* ══════════════════════════════════════════════════════════════
   ENQUIRY SOURCES CRUD
══════════════════════════════════════════════════════════════ */

router.get("/enquiry-sources", async (req, res) => {
  try {
    const sources = await EnquirySource.find({ campusId: req.campusId })
      .sort({ createdAt: 1 })
      .lean();
    res.json({ success: true, data: sources });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch enquiry sources" });
  }
});

router.post("/enquiry-sources", async (req, res) => {
  try {
    const { sourceName, description } = req.body;
    if (!sourceName) return res.status(400).json({ success: false, message: "Source name is required" });

    const existing = await EnquirySource.findOne({ campusId: req.campusId, sourceName: sourceName.trim() });
    if (existing) return res.status(400).json({ success: false, message: "Source name already exists" });

    const source = await EnquirySource.create({ campusId: req.campusId, sourceName: sourceName.trim(), description });
    res.status(201).json({ success: true, data: source, message: "Enquiry source added successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to create enquiry source" });
  }
});

router.put("/enquiry-sources/:id", async (req, res) => {
  try {
    const { sourceName, description } = req.body;
    const source = await EnquirySource.findOne({ _id: req.params.id, campusId: req.campusId });
    if (!source) return res.status(404).json({ success: false, message: "Enquiry source not found" });
    if (source.isUsed) return res.status(400).json({ success: false, message: "Cannot edit a source that is already in use" });

    source.sourceName = sourceName?.trim() || source.sourceName;
    source.description = description ?? source.description;
    await source.save();

    res.json({ success: true, data: source, message: "Enquiry source updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update enquiry source" });
  }
});

router.delete("/enquiry-sources/:id", async (req, res) => {
  try {
    const source = await EnquirySource.findOne({ _id: req.params.id, campusId: req.campusId });
    if (!source) return res.status(404).json({ success: false, message: "Enquiry source not found" });
    if (source.isUsed) return res.status(400).json({ success: false, message: "Cannot delete a source that is in use" });
    await source.deleteOne();
    res.json({ success: true, message: "Enquiry source deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete enquiry source" });
  }
});

/* ══════════════════════════════════════════════════════════════
   FOLLOW-UP MANAGEMENT CRUD
══════════════════════════════════════════════════════════════ */

router.get("/follow-ups", async (req, res) => {
  try {
    const followUps = await FollowUp.find({ campusId: req.campusId })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, data: followUps });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch follow-ups" });
  }
});

router.post("/follow-ups", async (req, res) => {
  try {
    const { enquiryId, studentName, mobileNumber, classInterested, followUpDate, followUpType, discussionNotes, nextFollowUpDate, followUpStatus } = req.body;
    if (!enquiryId || !followUpDate || !followUpType || !followUpStatus) {
      return res.status(400).json({ success: false, message: "Required fields missing" });
    }
    const followUp = await FollowUp.create({
      campusId: req.campusId, enquiryId, studentName, mobileNumber, classInterested,
      followUpDate, followUpType, discussionNotes, nextFollowUpDate, followUpStatus,
    });

    // Update enquiry status to reflect follow-up
    const AdmissionEnquiry = mongoose.models.AdmissionEnquiry || require("../models/AdmissionEnquiry");
    await AdmissionEnquiry.findByIdAndUpdate(enquiryId, {
      status: followUpStatus === "Admission Confirmed" ? "CONVERTED" : "FOLLOW-UP",
    });

    res.status(201).json({ success: true, data: followUp, message: "Follow-up saved successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to create follow-up" });
  }
});

router.put("/follow-ups/:id", async (req, res) => {
  try {
    const followUp = await FollowUp.findOneAndUpdate(
      { _id: req.params.id, campusId: req.campusId },
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!followUp) return res.status(404).json({ success: false, message: "Follow-up not found" });
    res.json({ success: true, data: followUp, message: "Follow-up updated successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update follow-up" });
  }
});

router.delete("/follow-ups/:id", async (req, res) => {
  try {
    const deleted = await FollowUp.findOneAndDelete({ _id: req.params.id, campusId: req.campusId });
    if (!deleted) return res.status(404).json({ success: false, message: "Follow-up not found" });
    res.json({ success: true, message: "Follow-up deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete follow-up" });
  }
});

/* ══════════════════════════════════════════════════════════════
   GATE PASS MANAGEMENT CRUD
══════════════════════════════════════════════════════════════ */

router.get("/gate-passes", async (req, res) => {
  try {
    const { passDate, status, search } = req.query;
    const filter = { campusId: req.campusId };
    if (passDate) filter.passDate = passDate;
    if (status) filter.status = status;
    if (search) {
      const rx = new RegExp(search, "i");
      filter.$or = [{ studentName: rx }, { guardianName: rx }, { passNumber: rx }];
    }
    const passes = await GatePass.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: passes });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch gate passes" });
  }
});

router.post("/gate-passes", async (req, res) => {
  try {
    const { studentName, reason, passDate } = req.body;
    if (!studentName || !reason || !passDate) {
      return res.status(400).json({ success: false, message: "Student name, reason, and pass date are required" });
    }
    const count = await GatePass.countDocuments({ campusId: req.campusId });
    const passNumber = `GP${Date.now().toString().slice(-6)}${(count + 1).toString().padStart(3, "0")}`;
    const pass = await GatePass.create({ campusId: req.campusId, passNumber, ...req.body });
    res.status(201).json({ success: true, data: pass, message: "Gate pass issued successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to issue gate pass" });
  }
});

router.patch("/gate-passes/:id/status", async (req, res) => {
  try {
    const { status, inTime, outTime } = req.body;
    const update = { status };
    if (inTime) update.inTime = inTime;
    if (outTime) update.outTime = outTime;
    const pass = await GatePass.findOneAndUpdate(
      { _id: req.params.id, campusId: req.campusId },
      { $set: update },
      { new: true }
    );
    if (!pass) return res.status(404).json({ success: false, message: "Gate pass not found" });
    res.json({ success: true, data: pass, message: "Gate pass updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update gate pass" });
  }
});

router.delete("/gate-passes/:id", async (req, res) => {
  try {
    const deleted = await GatePass.findOneAndDelete({ _id: req.params.id, campusId: req.campusId });
    if (!deleted) return res.status(404).json({ success: false, message: "Gate pass not found" });
    res.json({ success: true, message: "Gate pass deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete gate pass" });
  }
});

/* ══════════════════════════════════════════════════════════════
   APPOINTMENT SCHEDULING CRUD
══════════════════════════════════════════════════════════════ */

router.get("/appointments", async (req, res) => {
  try {
    const { appointmentDate, status, search } = req.query;
    const filter = { campusId: req.campusId };
    if (appointmentDate) filter.appointmentDate = appointmentDate;
    if (status) filter.status = status;
    if (search) {
      const rx = new RegExp(search, "i");
      filter.$or = [{ visitorName: rx }, { mobile: rx }];
    }
    const appointments = await Appointment.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch appointments" });
  }
});

router.post("/appointments", async (req, res) => {
  try {
    const { visitorName, mobile, appointmentDate, timeSlot } = req.body;
    if (!visitorName || !mobile || !appointmentDate || !timeSlot) {
      return res.status(400).json({ success: false, message: "Required fields missing" });
    }
    const count = await Appointment.countDocuments({ campusId: req.campusId });
    const appointmentId = `APT${Date.now().toString().slice(-6)}${(count + 1).toString().padStart(3, "0")}`;
    const appointment = await Appointment.create({ campusId: req.campusId, appointmentId, ...req.body });
    res.status(201).json({ success: true, data: appointment, message: "Appointment created successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to create appointment" });
  }
});

router.patch("/appointments/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const apt = await Appointment.findOneAndUpdate(
      { _id: req.params.id, campusId: req.campusId },
      { $set: { status } },
      { new: true }
    );
    if (!apt) return res.status(404).json({ success: false, message: "Appointment not found" });
    res.json({ success: true, data: apt, message: `Appointment ${status.toLowerCase()} successfully` });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update appointment status" });
  }
});

router.delete("/appointments/:id", async (req, res) => {
  try {
    const deleted = await Appointment.findOneAndDelete({ _id: req.params.id, campusId: req.campusId });
    if (!deleted) return res.status(404).json({ success: false, message: "Appointment not found" });
    res.json({ success: true, message: "Appointment deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete appointment" });
  }
});

/* ══════════════════════════════════════════════════════════════
   VISITOR MANAGEMENT CRUD
══════════════════════════════════════════════════════════════ */

router.get("/visitors", async (req, res) => {
  try {
    const { visitDate, status, visitorType, search } = req.query;
    const filter = { campusId: req.campusId };
    if (visitDate) filter.visitDate = visitDate;
    if (status) filter.status = status;
    if (visitorType) filter.visitorType = visitorType;
    if (search) {
      const rx = new RegExp(search, "i");
      filter.$or = [{ visitorName: rx }, { mobile: rx }];
    }
    const visitors = await Visitor.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: visitors });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch visitors" });
  }
});

// Get approved appointments for visitor check-in form
router.get("/visitors/approved-appointments", async (req, res) => {
  try {
    const appointments = await Appointment.find({ campusId: req.campusId, status: "Approved" })
      .select("_id appointmentId visitorName mobile purpose personToMeet department")
      .lean();
    res.json({ success: true, data: appointments });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch approved appointments" });
  }
});

router.post("/visitors", async (req, res) => {
  try {
    const { visitorName, mobile, visitDate } = req.body;
    if (!visitorName || !mobile || !visitDate) {
      return res.status(400).json({ success: false, message: "Visitor name, mobile and visit date are required" });
    }
    const visitor = await Visitor.create({ campusId: req.campusId, ...req.body });
    res.status(201).json({ success: true, data: visitor, message: "Visitor added successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to add visitor" });
  }
});

router.patch("/visitors/:id/status", async (req, res) => {
  try {
    const { status, inTime, outTime } = req.body;
    const update = { status };
    if (inTime) update.inTime = inTime;
    if (outTime) update.outTime = outTime;
    const visitor = await Visitor.findOneAndUpdate(
      { _id: req.params.id, campusId: req.campusId },
      { $set: update },
      { new: true }
    );
    if (!visitor) return res.status(404).json({ success: false, message: "Visitor not found" });
    res.json({ success: true, data: visitor, message: "Visitor status updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update visitor status" });
  }
});

router.delete("/visitors/:id", async (req, res) => {
  try {
    const deleted = await Visitor.findOneAndDelete({ _id: req.params.id, campusId: req.campusId });
    if (!deleted) return res.status(404).json({ success: false, message: "Visitor not found" });
    res.json({ success: true, message: "Visitor deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete visitor" });
  }
});

/* ══════════════════════════════════════════════════════════════
   SUPPORT & COMPLAINTS CRUD
══════════════════════════════════════════════════════════════ */

router.get("/complaints", async (req, res) => {
  try {
    const { complaintDate, status, priority, search } = req.query;
    const filter = { campusId: req.campusId };
    if (complaintDate) filter.complaintDate = complaintDate;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (search) {
      const rx = new RegExp(search, "i");
      filter.$or = [{ guardianName: rx }, { studentName: rx }, { mobile: rx }, { complaintId: rx }];
    }
    const complaints = await SupportComplaint.find(filter).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: complaints });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch complaints" });
  }
});

router.post("/complaints", async (req, res) => {
  try {
    const { guardianName, studentName, mobile, category, complaintDetails, complaintDate } = req.body;
    if (!guardianName || !studentName || !mobile || !category || !complaintDetails) {
      return res.status(400).json({ success: false, message: "Required fields missing" });
    }
    const count = await SupportComplaint.countDocuments({ campusId: req.campusId });
    const complaintId = `CMP${Date.now().toString().slice(-6)}${(count + 1).toString().padStart(3, "0")}`;
    const complaint = await SupportComplaint.create({
      campusId: req.campusId, complaintId,
      complaintDate: complaintDate || new Date().toISOString().split("T")[0],
      ...req.body,
    });
    res.status(201).json({ success: true, data: complaint, message: "Complaint created successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to create complaint" });
  }
});

router.patch("/complaints/:id/status", async (req, res) => {
  try {
    const { status, resolutionNotes } = req.body;
    const update = { status };
    if (status === "Resolved") update.resolutionDate = new Date().toISOString().split("T")[0];
    if (resolutionNotes) update.resolutionNotes = resolutionNotes;
    const complaint = await SupportComplaint.findOneAndUpdate(
      { _id: req.params.id, campusId: req.campusId },
      { $set: update },
      { new: true }
    );
    if (!complaint) return res.status(404).json({ success: false, message: "Complaint not found" });
    res.json({ success: true, data: complaint, message: "Complaint status updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update complaint status" });
  }
});

router.delete("/complaints/:id", async (req, res) => {
  try {
    const deleted = await SupportComplaint.findOneAndDelete({ _id: req.params.id, campusId: req.campusId });
    if (!deleted) return res.status(404).json({ success: false, message: "Complaint not found" });
    res.json({ success: true, message: "Complaint deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete complaint" });
  }
});

/* ══════════════════════════════════════════════════════════════
   RECEPTION ANALYTICS & REPORTS
══════════════════════════════════════════════════════════════ */

router.get("/reports", async (req, res) => {
  try {
    const cid = req.campusId;
    const today = new Date().toISOString().split("T")[0];

    const [
      totalVisitors, todayVisitors, activeVisitors,
      totalAppointments, todayAppointments, pendingAppointments,
      openComplaints, resolvedComplaints,
      totalGatePasses, activePasses,
      totalFollowUps, totalSources,
    ] = await Promise.all([
      Visitor.countDocuments({ campusId: cid }),
      Visitor.countDocuments({ campusId: cid, visitDate: today }),
      Visitor.countDocuments({ campusId: cid, status: "Inside Campus" }),
      Appointment.countDocuments({ campusId: cid }),
      Appointment.countDocuments({ campusId: cid, appointmentDate: today }),
      Appointment.countDocuments({ campusId: cid, status: "Pending" }),
      SupportComplaint.countDocuments({ campusId: cid, status: { $in: ["Open", "In Progress"] } }),
      SupportComplaint.countDocuments({ campusId: cid, status: "Resolved" }),
      GatePass.countDocuments({ campusId: cid }),
      GatePass.countDocuments({ campusId: cid, status: "Issued" }),
      FollowUp.countDocuments({ campusId: cid }),
      EnquirySource.countDocuments({ campusId: cid }),
    ]);

    res.json({
      success: true,
      data: {
        visitors: { total: totalVisitors, today: todayVisitors, active: activeVisitors },
        appointments: { total: totalAppointments, today: todayAppointments, pending: pendingAppointments },
        complaints: { open: openComplaints, resolved: resolvedComplaints },
        gatePasses: { total: totalGatePasses, active: activePasses },
        followUps: { total: totalFollowUps },
        enquirySources: { total: totalSources },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to load reception reports" });
  }
});

module.exports = router;
