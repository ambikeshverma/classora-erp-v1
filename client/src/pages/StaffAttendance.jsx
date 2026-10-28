import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./staffAttendance.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { attendanceService } from "../services/api";

function StaffAttendance() {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const [geoLocked, setGeoLocked] = useState(false);
  const [schoolLocation, setSchoolLocation] = useState(null);
  const [locating, setLocating] = useState(false);

  // Filters
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

  // Staff rows & Loading state
  const [staffRows, setStaffRows] = useState([]);
  const [summaryData, setSummaryData] = useState({
    total: 0,
    present: 0,
    absent: 0,
    leave: 0,
    notMarked: 0,
    percent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // 1. Fetch Geo Settings
  useEffect(() => {
    let isMounted = true;
    attendanceService
      .getGeoSettings()
      .then((res) => {
        if (!isMounted) return;
        if (res.data?.success && res.data.data) {
          const geo = res.data.data;
          if (geo.isLocked && geo.latitude && geo.longitude) {
            setGeoLocked(true);
            setSchoolLocation({
              latitude: geo.latitude,
              longitude: geo.longitude,
            });
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load geo settings:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch Staff Attendance Rows
  const fetchStaffAttendance = useCallback(async (filters) => {
    setLoading(true);
    setToast(null);

    try {
      const res = await attendanceService.getStaffAttendance({
        date: filters.attendanceDate,
        status: filters.attendanceStatus,
        search: filters.employeeSearch,
      });

      if (res.data?.success) {
        setStaffRows(res.data.data.rows || []);
        if (res.data.data.summary) {
          setSummaryData(res.data.data.summary);
        }
      } else {
        setStaffRows([]);
      }
    } catch (err) {
      console.error("Failed to fetch staff attendance:", err);
      setToast({
        type: "error",
        message: err.response?.data?.message || "Failed to load staff attendance",
      });
      setStaffRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaffAttendance(appliedFilters);
  }, [appliedFilters, fetchStaffAttendance]);

  const handleSearch = () => {
    setAppliedFilters({ ...filterData });
  };

  const handleFetchSchoolLocation = () => {
    if (geoLocked) {
      alert("School location is already locked.");
      return;
    }

    if (!navigator.geolocation) {
      alert("Location is not supported in this browser/device.");
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          radius: 200,
        };

        try {
          const res = await attendanceService.saveGeoSettings(coords);
          if (res.data?.success) {
            setSchoolLocation(coords);
            setGeoLocked(true);
            setToast({
              type: "success",
              message: "School geo location saved and locked successfully!",
            });
            setTimeout(() => setToast(null), 4000);
          }
        } catch (err) {
          console.error("Failed to save geo location:", err);
          alert(err.response?.data?.message || "Failed to save geo location");
        } finally {
          setLocating(false);
        }
      },
      (geoErr) => {
        setLocating(false);
        alert(
          geoErr.message ||
            "Please turn on device location services and allow location permission."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
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
            navigate("/attendance-system");
          }}
        >
          ←
        </AppButton>

        <div>
          <h1>Staff Attendance</h1>
          <p>View staff attendance marked from teacher dashboard and school portal</p>
        </div>
      </div>

      {toast && (
        <div className={`attendance-toast-msg ${toast.type}`}>
          {toast.message}
        </div>
      )}

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
            School geo location is saved ({schoolLocation.latitude?.toFixed(4)},{" "}
            {schoolLocation.longitude?.toFixed(4)}). Teachers can mark attendance only
            within the designated campus boundary.
          </div>
        )}

        <div className="form-actions">
          <AppButton
            type="primary"
            onClick={handleFetchSchoolLocation}
            disabled={geoLocked || locating}
          >
            {locating
              ? "Detecting Coordinates..."
              : geoLocked
              ? "Location Locked"
              : "Fetch School Location"}
          </AppButton>
        </div>

        <div className="note-card">
          Teacher attendance marking will happen from teacher dashboard. If
          device location is off, attendance will not be permitted.
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <span>Total Staff</span>
          <strong>{summaryData.total}</strong>
        </div>

        <div className="summary-card present">
          <span>Present</span>
          <strong>{summaryData.present}</strong>
        </div>

        <div className="summary-card absent">
          <span>Absent</span>
          <strong>{summaryData.absent}</strong>
        </div>

        <div className="summary-card leave">
          <span>Leave</span>
          <strong>{summaryData.leave}</strong>
        </div>

        <div className="summary-card na">
          <span>Not Marked</span>
          <strong>{summaryData.notMarked}</strong>
        </div>

        <div className="summary-card percent">
          <span>Attendance %</span>
          <strong>{summaryData.percent}%</strong>
        </div>
      </div>

      {/* Filters */}
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
            <label>Employee Search</label>

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
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />
          </div>
        </div>

        <div className="form-actions">
          <AppButton type="primary" onClick={handleSearch} disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </AppButton>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="common-card">
        <div className="list-header">
          <h2>Staff Attendance List</h2>
        </div>

        {loading ? (
          <div style={{ padding: "10px 0" }}>
            <SkeletonTable rows={6} columns={7} />
          </div>
        ) : (
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
                {staffRows.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-row">
                      {appliedFilters.employeeSearch || appliedFilters.attendanceStatus
                        ? "No staff records match the selected filters."
                        : "No active staff found in Staff Management."}
                    </td>
                  </tr>
                ) : (
                  staffRows.map((item, index) => (
                    <tr key={item.id || item.staffId || index}>
                      <td className="sno-col">{index + 1}</td>
                      <td>{item.employeeCode || "--"}</td>
                      <td>
                        <strong>{item.employeeName}</strong>
                        {item.department && (
                          <span
                            style={{
                              display: "block",
                              fontSize: "12px",
                              color: "#6b7280",
                            }}
                          >
                            {item.department} {item.position ? `• ${item.position}` : ""}
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`attendance-badge ${
                            item.attendance.startsWith("Leave")
                              ? "leave"
                              : item.attendance.toLowerCase().replaceAll(" ", "-")
                          }`}
                        >
                          {item.attendance}
                        </span>
                      </td>
                      <td>{item.checkInTime || "--"}</td>
                      <td>{item.method || "-"}</td>
                      <td>{item.markedFrom || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default StaffAttendance;
