import React, { useMemo, useState } from "react";
import "./staffAttendance.css";
import AppButton from "../components/AppButton";

function StaffAttendance() {
  const schoolId = localStorage.getItem("schoolId") || "SCH001";
  const today = new Date().toISOString().split("T")[0];

  const [geoLocked, setGeoLocked] = useState(false);
  const [schoolLocation, setSchoolLocation] = useState(null);

  // Future: Super Admin permission se true hoga
  const superAdminAllowLocationReset = false;

  const [filterData, setFilterData] = useState({
    attendanceDate: today,
    attendanceStatus: "",
    employeeSearch: "",
  });

  const [appliedFilters, setAppliedFilters] = useState({
    attendanceDate: today,
    attendanceStatus: "",
    employeeSearch: "",
  });

  const staffList = [
    {
      id: 1,
      schoolId: "SCH001",
      employeeCode: "SCH001-EMP-0001",
      employeeName: "Amit Kumar",
      mobile: "9876543210",
      isActive: true,
      lastWorkingDate: "",
    },
    {
      id: 2,
      schoolId: "SCH001",
      employeeCode: "SCH001-EMP-0002",
      employeeName: "Rahul Verma",
      mobile: "9876543211",
      isActive: true,
      lastWorkingDate: "",
    },
    {
      id: 3,
      schoolId: "SCH001",
      employeeCode: "SCH001-EMP-0003",
      employeeName: "Mohit Singh",
      mobile: "9876543212",
      isActive: true,
      lastWorkingDate: "",
    },
  ];

  const approvedLeaves = [
    {
      id: 1,
      schoolId: "SCH001",
      employeeId: 1,
      leaveType: "Sick Leave",
      fromDate: today,
      toDate: today,
    },
  ];

  // Future: Teacher dashboard se attendance yahin save hogi
  const [attendanceRecords] = useState([
    {
      id: 1,
      schoolId: "SCH001",
      employeeId: 2,
      attendanceDate: today,
      attendance: "Present",
      checkInTime: "08:07 AM",
      method: "Geo",
      markedFrom: "Teacher Dashboard",
      isLeaveLocked: false,
      leaveType: "",
    },
    {
      id: 2,
      schoolId: "SCH001",
      employeeId: 3,
      attendanceDate: today,
      attendance: "Not Marked",
      checkInTime: "--",
      method: "",
      markedFrom: "",
      isLeaveLocked: false,
      leaveType: "",
    },
  ]);

  const activeStaff = staffList.filter(
    (item) =>
      item.schoolId === schoolId &&
      item.isActive &&
      !item.lastWorkingDate
  );

  const isDateInRange = (date, fromDate, toDate) => {
    return date >= fromDate && date <= toDate;
  };

  const getApprovedLeave = (employeeId, date) => {
    return approvedLeaves.find(
      (leave) =>
        leave.schoolId === schoolId &&
        leave.employeeId === employeeId &&
        isDateInRange(date, leave.fromDate, leave.toDate)
    );
  };

  const getAttendanceForStaff = (staff) => {
    const leave = getApprovedLeave(staff.id, appliedFilters.attendanceDate);

    if (leave) {
      return {
        attendance: `Leave - ${leave.leaveType} 🔒`,
        checkInTime: "--",
        method: "",
        markedFrom: "Leave Management",
        isLeaveLocked: true,
      };
    }

    const record = attendanceRecords.find(
      (item) =>
        item.schoolId === schoolId &&
        item.employeeId === staff.id &&
        item.attendanceDate === appliedFilters.attendanceDate
    );

    if (record) return record;

    return {
      attendance: "Not Marked",
      checkInTime: "--",
      method: "",
      markedFrom: "",
      isLeaveLocked: false,
    };
  };

  const staffAttendanceRows = activeStaff.map((staff) => ({
    ...staff,
    ...getAttendanceForStaff(staff),
  }));

  const filteredRows = staffAttendanceRows.filter((item) => {
    const search = appliedFilters.employeeSearch.toLowerCase().trim();

    const statusMatch =
      !appliedFilters.attendanceStatus ||
      item.attendance
        .toLowerCase()
        .includes(appliedFilters.attendanceStatus.toLowerCase());

    const employeeMatch =
      !search ||
      item.employeeName.toLowerCase().includes(search) ||
      item.employeeCode.toLowerCase().includes(search) ||
      item.mobile.includes(search);

    return statusMatch && employeeMatch;
  });

  const summary = useMemo(() => {
    const total = staffAttendanceRows.length;

    const present = staffAttendanceRows.filter(
      (item) => item.attendance === "Present"
    ).length;

    const absent = staffAttendanceRows.filter(
      (item) => item.attendance === "Absent"
    ).length;

    const leave = staffAttendanceRows.filter((item) =>
      item.attendance.startsWith("Leave")
    ).length;

    const notMarked = staffAttendanceRows.filter(
      (item) => item.attendance === "Not Marked"
    ).length;

    const percent = total ? Math.round((present / total) * 100) : 0;

    return {
      total,
      present,
      absent,
      leave,
      notMarked,
      percent,
    };
  }, [staffAttendanceRows]);

  const handleFetchSchoolLocation = () => {
    if (geoLocked && !superAdminAllowLocationReset) {
      alert(
        "School location is already locked. Contact Super Admin to allow reset."
      );
      return;
    }

    if (!navigator.geolocation) {
      alert("Location is not supported in this device");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setSchoolLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });

        setGeoLocked(true);

        alert("School location saved and locked successfully");
      },
      () => {
        alert("Please turn on location");
      }
    );
  };

  const handleSearch = () => {
    setAppliedFilters(filterData);
  };

  const displayDate = new Date(appliedFilters.attendanceDate).toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );

  return (
    <div className="staff-attendance-page">
      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => {
            window.location.href = "/attendance-system";
          }}
        >
          ←
        </AppButton>

        <div>
          <h1>Staff Attendance</h1>
          <p>View staff attendance marked from teacher dashboard</p>
        </div>
      </div>

      <div className="common-card">
        <h2>Geo Attendance Setup</h2>

        <div className="geo-status-box">
          <span>School Location Status :</span>

          <strong className={geoLocked ? "locked" : "unlocked"}>
            {geoLocked ? "🔒 Locked" : "🔓 Unlocked"}
          </strong>
        </div>

        {schoolLocation && (
          <div className="note-card">
            School geo location is saved. Teachers can mark attendance only
            from the school radius.
          </div>
        )}

        <div className="form-actions">
          <AppButton
            type="primary"
            onClick={handleFetchSchoolLocation}
            disabled={geoLocked && !superAdminAllowLocationReset}
          >
            {geoLocked ? "Location Locked" : "Fetch School Location"}
          </AppButton>
        </div>

        <div className="note-card">
          Teacher attendance marking will happen from teacher dashboard only. If
          phone location is off, attendance will not be marked.
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <span>Total Staff</span>
          <strong>{summary.total}</strong>
        </div>

        <div className="summary-card present">
          <span>Present</span>
          <strong>{summary.present}</strong>
        </div>

        <div className="summary-card absent">
          <span>Absent</span>
          <strong>{summary.absent}</strong>
        </div>

        <div className="summary-card leave">
          <span>Leave</span>
          <strong>{summary.leave}</strong>
        </div>

        <div className="summary-card na">
          <span>Not Marked</span>
          <strong>{summary.notMarked}</strong>
        </div>

        <div className="summary-card percent">
          <span>Attendance %</span>
          <strong>{summary.percent}%</strong>
        </div>
      </div>

      <div className="common-card">
        <h2>Staff Attendance Filters</h2>

        <div className="attendance-date-strip">
          Attendance Date : <strong>{displayDate}</strong>
        </div>

        <div className="staff-filter-grid">
          <div className="form-group">
            <label>Attendance Date *</label>

            <input
              type="date"
              value={filterData.attendanceDate}
              onChange={(e) =>
                setFilterData({
                  ...filterData,
                  attendanceDate: e.target.value,
                })
              }
            />
          </div>

          <div className="form-group">
            <label>Attendance Status</label>

            <select
              value={filterData.attendanceStatus}
              onChange={(e) =>
                setFilterData({
                  ...filterData,
                  attendanceStatus: e.target.value,
                })
              }
            >
              <option value="">All</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Leave">Leave</option>
              <option value="Not Marked">Not Marked</option>
            </select>
          </div>

          <div className="form-group">
            <label>Employee Name</label>

            <input
              type="text"
              placeholder="Type name / code / mobile"
              value={filterData.employeeSearch}
              onChange={(e) =>
                setFilterData({
                  ...filterData,
                  employeeSearch: e.target.value,
                })
              }
            />
          </div>
        </div>

        <div className="form-actions">
          <AppButton type="primary" onClick={handleSearch}>
            Search
          </AppButton>
        </div>
      </div>

      <div className="common-card">
        <div className="list-header">
          <h2>Staff Attendance List</h2>
        </div>

        <div className="table-wrap desktop-attendance-table">
          <table>
            <thead>
              <tr>
                <th className="sno-col">S.No</th>
                <th>Employee Code</th>
                <th>Employee Name</th>
                <th>Attendance</th>
                <th>Check In Time</th>
                <th>Method</th>
                <th>Marked From</th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-row">
                    No attendance record found
                  </td>
                </tr>
              ) : (
                filteredRows.map((item, index) => (
                  <tr key={item.id}>
                    <td className="sno-col">{index + 1}</td>
                    <td>{item.employeeCode}</td>
                    <td>{item.employeeName}</td>
                    <td>
                      <span
                        className={`attendance-badge ${
                          item.attendance.startsWith("Leave")
                            ? "leave"
                            : item.attendance
                                .toLowerCase()
                                .replaceAll(" ", "-")
                        }`}
                      >
                        {item.attendance}
                      </span>
                    </td>
                    <td>{item.checkInTime}</td>
                    <td>{item.method || "-"}</td>
                    <td>{item.markedFrom || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default StaffAttendance;