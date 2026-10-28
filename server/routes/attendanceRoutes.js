const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const schoolAuth = require("../middleware/schoolAuth");

// Ensure all routes are protected with schoolAuth
router.use(schoolAuth);

// Models
const StudentAttendance = require("../models/StudentAttendance");
const StaffAttendance = require("../models/StaffAttendance");
const AttendanceSettings = require("../models/AttendanceSettings");
const StaffLeave = require("../models/StaffLeave");
const Staff = require("../models/Staff");
const Admission = require("../models/Admission");
const Student = require("../models/Student");
const Class = require("../models/Class");
const Department = require("../models/Department");
const Position = require("../models/Position");

// Helper to get school scope
const getSchoolScope = (req) => {
  const cid = req.campusId || req.schoolId;
  const sid = req.schoolId || req.campusId;
  return {
    $or: [{ campusId: cid }, { schoolId: sid }],
  };
};

/* ══════════════════════════════════════════════════════════════
   1. META ENDPOINT - Classes, Sections, Departments, Positions, Holidays
   Optimized with parallel queries & lean execution
══════════════════════════════════════════════════════════════ */
router.get("/meta", async (req, res) => {
  try {
    const campusId = req.campusId || req.schoolId;
    const schoolId = req.schoolId || req.campusId;

    const [classes, departments, positions, settings] = await Promise.all([
      Class.find({ campusId })
        .select("_id className classCode sections")
        .sort({ className: 1 })
        .lean(),
      Department.find({ campusId })
        .select("_id departmentName departmentCode")
        .sort({ departmentName: 1 })
        .lean(),
      Position.find({ campusId })
        .select("_id positionName departmentId")
        .sort({ positionName: 1 })
        .lean(),
      AttendanceSettings.findOne({ campusId })
        .select("geoSettings closedDates")
        .lean(),
    ]);

    // Format classes & sections for quick dropdown selection
    const formattedClasses = classes.map((c) => ({
      _id: c._id,
      className: c.className,
      classCode: c.classCode,
      sections: (c.sections || []).map((s) => ({
        sectionName: s.sectionName,
        sectionCode: s.sectionCode,
      })),
    }));

    return res.status(200).json({
      success: true,
      data: {
        classes: formattedClasses,
        departments,
        positions,
        geoSettings: settings?.geoSettings || {
          latitude: null,
          longitude: null,
          radius: 200,
          isLocked: false,
        },
        closedDates: settings?.closedDates || [],
      },
    });
  } catch (error) {
    console.error("Attendance meta error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/* ══════════════════════════════════════════════════════════════
   2. STUDENT ATTENDANCE - GET by Class, Section, and Date
══════════════════════════════════════════════════════════════ */
router.get("/students", async (req, res) => {
  try {
    const campusId = req.campusId || req.schoolId;
    const schoolId = req.schoolId || req.campusId;
    const { className, section, date } = req.query;

    if (!className || !section) {
      return res.status(400).json({
        success: false,
        message: "Class name and section are required",
      });
    }

    const attendanceDate = date || new Date().toISOString().split("T")[0];

    // 1. Check if date is marked as closed/holiday
    const settings = await AttendanceSettings.findOne({ campusId })
      .select("closedDates")
      .lean();
    const closedDate = (settings?.closedDates || []).find(
      (c) => c.date === attendanceDate
    );

    // 2. Fetch active students in this class and section
    const scope = getSchoolScope(req);
    let students = await Admission.find({
      ...scope,
      className,
      section,
      status: "Active",
    })
      .select(
        "_id studentName fatherName mobile rollNo rollNumber studentImage className section"
      )
      .sort({ rollNo: 1, rollNumber: 1, studentName: 1 })
      .lean();

    // Fallback to Student collection if Admission collection has no matching active records
    if (!students || students.length === 0) {
      const studentRecords = await Student.find({
        ...scope,
        $or: [{ className }, { class: className }],
        section,
        status: "Active",
      })
        .select("_id name fullName fatherName mobile rollNo rollNumber className section")
        .sort({ rollNo: 1, rollNumber: 1, name: 1 })
        .lean();

      students = studentRecords.map((s) => ({
        _id: s._id,
        studentName: s.name || s.fullName || "Student",
        fatherName: s.fatherName || "",
        mobile: s.mobile || "",
        rollNo: s.rollNo || s.rollNumber || "",
        studentImage: "",
        className: s.className || className,
        section: s.section || section,
      }));
    }

    // 3. Check for existing attendance record
    const existingRecord = await StudentAttendance.findOne({
      campusId,
      date: attendanceDate,
      className,
      section,
    }).lean();

    // 4. Merge students with existing attendance status
    const recordMap = new Map();
    if (existingRecord && Array.isArray(existingRecord.records)) {
      existingRecord.records.forEach((r) => {
        recordMap.set(String(r.studentId), r);
      });
    }

    const mergedStudents = students.map((s) => {
      const existing = recordMap.get(String(s._id));
      return {
        id: s._id,
        studentId: s._id,
        rollNo: s.rollNo || s.rollNumber || "--",
        name: s.studentName,
        fatherName: s.fatherName || "--",
        mobile: s.mobile || "--",
        photo: s.studentImage || "",
        status: existing ? existing.status : "NA",
        remarks: existing ? existing.remarks || "" : "",
      };
    });

    // 5. Calculate summary
    const total = mergedStudents.length;
    const present = mergedStudents.filter((s) => s.status === "P").length;
    const absent = mergedStudents.filter((s) => s.status === "A").length;
    const leave = mergedStudents.filter((s) => s.status === "L").length;
    const na = mergedStudents.filter((s) => s.status === "NA").length;
    const percent = total > 0 ? Math.round((present / total) * 100) : 0;

    return res.status(200).json({
      success: true,
      data: {
        date: attendanceDate,
        className,
        section,
        isExistingRecord: !!existingRecord,
        isClosed: !!closedDate,
        closedReason: closedDate ? closedDate.reason : "",
        students: mergedStudents,
        summary: {
          total,
          present,
          absent,
          leave,
          na,
          percent,
        },
      },
    });
  } catch (error) {
    console.error("Get student attendance error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/* ══════════════════════════════════════════════════════════════
   3. STUDENT ATTENDANCE - SAVE / UPDATE
══════════════════════════════════════════════════════════════ */
router.post("/students", async (req, res) => {
  try {
    const campusId = req.campusId || req.schoolId;
    const schoolId = req.schoolId || req.campusId;
    const { date, className, section, records, summary, markedBy } = req.body;

    if (!date || !className || !section || !Array.isArray(records)) {
      return res.status(400).json({
        success: false,
        message: "Date, class, section, and attendance records are required",
      });
    }

    // Verify date is not in future
    const today = new Date().toISOString().split("T")[0];
    if (date > today) {
      return res.status(400).json({
        success: false,
        message: "Attendance cannot be marked for future dates",
      });
    }

    // Verify if date is closed/holiday
    const settings = await AttendanceSettings.findOne({ campusId })
      .select("closedDates")
      .lean();
    const isClosed = (settings?.closedDates || []).some((c) => c.date === date);
    if (isClosed) {
      return res.status(400).json({
        success: false,
        message: "Selected date is marked as school closed/holiday. Attendance cannot be recorded.",
      });
    }

    // Compute verified summary
    const total = records.length;
    const present = records.filter((r) => r.status === "P").length;
    const absent = records.filter((r) => r.status === "A").length;
    const leave = records.filter((r) => r.status === "L").length;
    const na = records.filter((r) => r.status === "NA").length;
    const percent = total > 0 ? Math.round((present / total) * 100) : 0;

    const formattedRecords = records.map((r) => ({
      studentId: r.studentId || r.id,
      studentName: r.name || r.studentName || "Student",
      rollNo: r.rollNo || "",
      fatherName: r.fatherName || "",
      mobile: r.mobile || "",
      photo: r.photo || "",
      status: r.status || "NA",
      remarks: r.remarks || "",
    }));

    // Atomic Upsert
    const saved = await StudentAttendance.findOneAndUpdate(
      { campusId, date, className, section },
      {
        $set: {
          schoolId,
          campusId,
          date,
          className,
          section,
          records: formattedRecords,
          summary: {
            total,
            present,
            absent,
            leave,
            na,
            percent,
          },
          markedBy: markedBy || req.user?.name || "School Admin",
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Attendance saved successfully",
      data: saved,
    });
  } catch (error) {
    console.error("Save student attendance error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/* ══════════════════════════════════════════════════════════════
   4. STAFF ATTENDANCE - GET by Date, Status, Search
   Cross-wired with HR Staff and Leave Management
══════════════════════════════════════════════════════════════ */
router.get("/staff", async (req, res) => {
  try {
    const campusId = req.campusId || req.schoolId;
    const schoolId = req.schoolId || req.campusId;
    const { date, status, search } = req.query;

    const attendanceDate = date || new Date().toISOString().split("T")[0];

    // 1. Fetch active staff members
    const [staffMembers, approvedLeaves, attendanceRecords] = await Promise.all([
      Staff.find({ campusId, isActive: true })
        .populate("departmentId", "departmentName")
        .populate("positionId", "positionName")
        .sort({ employeeName: 1 })
        .lean(),
      StaffLeave.find({
        campusId,
        status: "Approved",
        fromDate: { $lte: attendanceDate },
        toDate: { $gte: attendanceDate },
      }).lean(),
      StaffAttendance.find({ campusId, date: attendanceDate }).lean(),
    ]);

    // Map approved leaves by staffId
    const leaveMap = new Map();
    approvedLeaves.forEach((leave) => {
      leaveMap.set(String(leave.staffId), leave);
    });

    // Map attendance records by staffId
    const attendanceMap = new Map();
    attendanceRecords.forEach((att) => {
      attendanceMap.set(String(att.staffId), att);
    });

    // Merge staff rows
    let rows = staffMembers.map((staff, index) => {
      const sId = String(staff._id);
      const leave = leaveMap.get(sId);
      const att = attendanceMap.get(sId);

      if (leave) {
        return {
          id: staff._id,
          staffId: staff._id,
          employeeCode: staff.employeeCode || `EMP-${index + 1}`,
          employeeName: staff.employeeName,
          mobile: staff.mobile || "",
          department: staff.departmentId?.departmentName || staff.departmentId || "",
          position: staff.positionId?.positionName || staff.positionId || "",
          attendance: `Leave - ${leave.leaveType} 🔒`,
          checkInTime: "--",
          checkOutTime: "--",
          method: "",
          markedFrom: "Leave Management",
          isLeaveLocked: true,
          leaveType: leave.leaveType,
        };
      }

      if (att) {
        return {
          id: staff._id,
          staffId: staff._id,
          employeeCode: staff.employeeCode || att.employeeCode || `EMP-${index + 1}`,
          employeeName: staff.employeeName || att.employeeName,
          mobile: staff.mobile || "",
          department: staff.departmentId?.departmentName || staff.departmentId || "",
          position: staff.positionId?.positionName || staff.positionId || "",
          attendance: att.attendance || "Present",
          checkInTime: att.checkInTime || "--",
          checkOutTime: att.checkOutTime || "--",
          method: att.method || "Manual",
          markedFrom: att.markedFrom || "School Portal",
          isLeaveLocked: false,
          leaveType: "",
        };
      }

      return {
        id: staff._id,
        staffId: staff._id,
        employeeCode: staff.employeeCode || `EMP-${index + 1}`,
        employeeName: staff.employeeName,
        mobile: staff.mobile || "",
        department: staff.departmentId?.departmentName || staff.departmentId || "",
        position: staff.positionId?.positionName || staff.positionId || "",
        attendance: "Not Marked",
        checkInTime: "--",
        checkOutTime: "--",
        method: "",
        markedFrom: "",
        isLeaveLocked: false,
        leaveType: "",
      };
    });

    // Calculate Summary across ALL active staff before filter
    const total = rows.length;
    const present = rows.filter((r) => r.attendance === "Present").length;
    const absent = rows.filter((r) => r.attendance === "Absent").length;
    const leave = rows.filter((r) => r.attendance.startsWith("Leave")).length;
    const notMarked = rows.filter((r) => r.attendance === "Not Marked").length;
    const percent = total > 0 ? Math.round((present / total) * 100) : 0;

    // Apply Filters
    if (status) {
      rows = rows.filter((r) =>
        r.attendance.toLowerCase().includes(status.toLowerCase())
      );
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (r) =>
          r.employeeName.toLowerCase().includes(q) ||
          r.employeeCode.toLowerCase().includes(q) ||
          (r.mobile && r.mobile.includes(q))
      );
    }

    return res.status(200).json({
      success: true,
      data: {
        date: attendanceDate,
        rows,
        summary: {
          total,
          present,
          absent,
          leave,
          notMarked,
          percent,
        },
      },
    });
  } catch (error) {
    console.error("Get staff attendance error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/* ══════════════════════════════════════════════════════════════
   5. STAFF ATTENDANCE - MARK / SAVE
══════════════════════════════════════════════════════════════ */
router.post("/staff", async (req, res) => {
  try {
    const campusId = req.campusId || req.schoolId;
    const schoolId = req.schoolId || req.campusId;
    const { date, records } = req.body;

    if (!date || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Date and staff attendance records are required",
      });
    }

    // Check approved leaves to prevent overriding locked records
    const approvedLeaves = await StaffLeave.find({
      campusId,
      status: "Approved",
      fromDate: { $lte: date },
      toDate: { $gte: date },
    }).lean();

    const lockedStaffIds = new Set(approvedLeaves.map((l) => String(l.staffId)));

    // Bulk upsert operations
    const bulkOps = records
      .filter((r) => !lockedStaffIds.has(String(r.staffId || r.id)))
      .map((r) => ({
        updateOne: {
          filter: {
            campusId,
            date,
            staffId: r.staffId || r.id,
          },
          update: {
            $set: {
              schoolId,
              campusId,
              date,
              staffId: r.staffId || r.id,
              employeeCode: r.employeeCode || "",
              employeeName: r.employeeName || "",
              departmentId: r.departmentId || null,
              positionId: r.positionId || null,
              attendance: r.attendance || "Present",
              checkInTime: r.checkInTime || "--",
              checkOutTime: r.checkOutTime || "--",
              method: r.method || "Manual",
              markedFrom: r.markedFrom || "School Portal",
              isLeaveLocked: false,
              location: r.location || { latitude: null, longitude: null },
            },
          },
          upsert: true,
        },
      }));

    if (bulkOps.length > 0) {
      await StaffAttendance.bulkWrite(bulkOps);
    }

    return res.status(200).json({
      success: true,
      message: "Staff attendance updated successfully",
      count: bulkOps.length,
    });
  } catch (error) {
    console.error("Save staff attendance error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/* ══════════════════════════════════════════════════════════════
   6. GEO SETTINGS & SCHOOL LOCATION SETUP
══════════════════════════════════════════════════════════════ */
router.get("/geo-settings", async (req, res) => {
  try {
    const campusId = req.campusId || req.schoolId;

    const settings = await AttendanceSettings.findOne({ campusId })
      .select("geoSettings")
      .lean();

    return res.status(200).json({
      success: true,
      data: settings?.geoSettings || {
        latitude: null,
        longitude: null,
        radius: 200,
        isLocked: false,
      },
    });
  } catch (error) {
    console.error("Get geo settings error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/geo-settings", async (req, res) => {
  try {
    const campusId = req.campusId || req.schoolId;
    const schoolId = req.schoolId || req.campusId;
    const { latitude, longitude, radius, address } = req.body;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude are required",
      });
    }

    const updated = await AttendanceSettings.findOneAndUpdate(
      { campusId },
      {
        $set: {
          schoolId,
          campusId,
          "geoSettings.latitude": latitude,
          "geoSettings.longitude": longitude,
          "geoSettings.radius": radius || 200,
          "geoSettings.isLocked": true,
          "geoSettings.lockedAt": new Date(),
          "geoSettings.address": address || "",
        },
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      message: "School geo location saved and locked successfully",
      data: updated.geoSettings,
    });
  } catch (error) {
    console.error("Save geo settings error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

/* ══════════════════════════════════════════════════════════════
   7. CALENDAR / HOLIDAYS ENDPOINTS
══════════════════════════════════════════════════════════════ */
router.get("/holidays", async (req, res) => {
  try {
    const campusId = req.campusId || req.schoolId;
    const settings = await AttendanceSettings.findOne({ campusId })
      .select("closedDates")
      .lean();

    return res.status(200).json({
      success: true,
      data: settings?.closedDates || [],
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/holidays", async (req, res) => {
  try {
    const campusId = req.campusId || req.schoolId;
    const schoolId = req.schoolId || req.campusId;
    const { fromDate, toDate, reason } = req.body;

    if (!fromDate || !toDate || !reason) {
      return res.status(400).json({
        success: false,
        message: "From date, to date, and reason are required",
      });
    }

    const from = new Date(fromDate);
    const to = new Date(toDate);
    if (from > to) {
      return res.status(400).json({
        success: false,
        message: "To date cannot be before from date",
      });
    }

    const formatDateKey = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const newDates = [];
    const current = new Date(from);
    while (current <= to) {
      newDates.push({
        date: formatDateKey(current),
        fromDate,
        toDate,
        reason: reason.trim(),
      });
      current.setDate(current.getDate() + 1);
    }

    const settings = await AttendanceSettings.findOne({ campusId });
    const existing = settings?.closedDates || [];

    // Filter out duplicates
    const combined = [
      ...existing.filter((e) => !newDates.some((n) => n.date === e.date)),
      ...newDates,
    ];

    await AttendanceSettings.findOneAndUpdate(
      { campusId },
      {
        $set: {
          schoolId,
          campusId,
          closedDates: combined,
        },
      },
      { upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: "Holidays saved successfully",
      data: combined,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.delete("/holidays", async (req, res) => {
  try {
    const campusId = req.campusId || req.schoolId;
    const { fromDate, toDate } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).json({
        success: false,
        message: "From date and to date are required",
      });
    }

    const settings = await AttendanceSettings.findOne({ campusId });
    if (!settings) {
      return res.status(404).json({ success: false, message: "Settings not found" });
    }

    settings.closedDates = settings.closedDates.filter(
      (item) => !(item.fromDate === fromDate && item.toDate === toDate)
    );

    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Holiday removed successfully",
      data: settings.closedDates,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/* ══════════════════════════════════════════════════════════════
   8. REPORTS DATA ENDPOINT - For Master Reports & Analytics
   Optimized aggregations & lean fetches
══════════════════════════════════════════════════════════════ */
router.get("/reports-data", async (req, res) => {
  try {
    const campusId = req.campusId || req.schoolId;
    const schoolId = req.schoolId || req.campusId;
    const scope = getSchoolScope(req);

    // Parallel fetch real data
    const [
      classes,
      departments,
      positions,
      students,
      staffMembers,
      studentAttendance,
      staffAttendance,
      settings,
    ] = await Promise.all([
      Class.find({ campusId }).select("_id className classCode sections").lean(),
      Department.find({ campusId }).select("_id departmentName").lean(),
      Position.find({ campusId }).select("_id positionName departmentId").lean(),
      Admission.find({ ...scope, status: "Active" })
        .select("_id studentName className section rollNo rollNumber fatherName mobile")
        .sort({ className: 1, section: 1, studentName: 1 })
        .lean(),
      Staff.find({ campusId, isActive: true })
        .select("_id employeeCode employeeName departmentId positionId mobile")
        .sort({ employeeName: 1 })
        .lean(),
      StudentAttendance.find({ campusId })
        .select("date className section records summary")
        .lean(),
      StaffAttendance.find({ campusId })
        .select("date staffId employeeCode employeeName departmentId positionId attendance checkInTime checkOutTime method")
        .lean(),
      AttendanceSettings.findOne({ campusId }).select("closedDates").lean(),
    ]);

    // Format classes and sections
    const formattedClasses = classes.map((c) => ({
      classId: String(c._id),
      className: c.className,
    }));

    const formattedSections = [];
    classes.forEach((c) => {
      (c.sections || []).forEach((s, idx) => {
        formattedSections.push({
          sectionId: `${String(c._id)}-${s.sectionName}`,
          classId: String(c._id),
          className: c.className,
          sectionName: s.sectionName,
        });
      });
    });

    const formattedDepartments = departments.map((d) => ({
      departmentId: String(d._id),
      departmentName: d.departmentName,
    }));

    const formattedPositions = positions.map((p) => ({
      positionId: String(p._id),
      departmentId: String(p.departmentId),
      positionName: p.positionName,
    }));

    const formattedStudents = students.map((s) => {
      // Find classId
      const matchedClass = classes.find((c) => c.className === s.className);
      const classId = matchedClass ? String(matchedClass._id) : "";
      const sectionId = matchedClass ? `${classId}-${s.section}` : "";

      return {
        id: s._id,
        studentId: s._id,
        schoolId: String(schoolId),
        classId,
        className: s.className,
        sectionId,
        sectionName: s.section,
        rollNo: s.rollNo || s.rollNumber || "--",
        studentName: s.studentName,
        fatherName: s.fatherName || "--",
        mobile: s.mobile || "--",
      };
    });

    const formattedStaffList = staffMembers.map((sm) => ({
      id: sm._id,
      staffId: sm._id,
      schoolId: String(schoolId),
      employeeCode: sm.employeeCode,
      employeeName: sm.employeeName,
      departmentId: String(sm.departmentId || ""),
      positionId: String(sm.positionId || ""),
      mobile: sm.mobile || "--",
      isActive: true,
    }));

    // Flatten student attendance records
    const flattenedStudentAttendance = [];
    studentAttendance.forEach((att) => {
      (att.records || []).forEach((r) => {
        flattenedStudentAttendance.push({
          schoolId: String(schoolId),
          studentId: String(r.studentId),
          className: att.className,
          section: att.section,
          date: att.date,
          status: r.status,
          remarks: r.remarks || "",
        });
      });
    });

    // Format staff attendance records
    const formattedStaffAttendance = staffAttendance.map((sa) => ({
      schoolId: String(schoolId),
      staffId: String(sa.staffId),
      employeeCode: sa.employeeCode,
      employeeName: sa.employeeName,
      departmentId: String(sa.departmentId || ""),
      positionId: String(sa.positionId || ""),
      date: sa.date,
      status: sa.attendance,
      checkInTime: sa.checkInTime,
      method: sa.method,
    }));

    return res.status(200).json({
      success: true,
      data: {
        classes: formattedClasses,
        sections: formattedSections,
        departments: formattedDepartments,
        positions: formattedPositions,
        students: formattedStudents,
        staffList: formattedStaffList,
        holidays: settings?.closedDates || [],
        studentAttendance: flattenedStudentAttendance,
        staffAttendance: formattedStaffAttendance,
      },
    });
  } catch (error) {
    console.error("Get attendance reports data error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

