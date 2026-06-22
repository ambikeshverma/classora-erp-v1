import React, { useState } from "react";
import "./dashboard.css";
import AppButton from "../components/AppButton";
function Dashboard() {
  const today = new Date();

  const getCurrentSession = () => {
    const y = today.getFullYear();
    const m = today.getMonth() + 1;
    return m >= 4 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
  };

  const [autoHide, setAutoHide] = useState(true);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [session, setSession] = useState(getCurrentSession());
  const [searchValue, setSearchValue] = useState("");

  const [closedDates, setClosedDates] = useState([]);
  const [showClosedPopup, setShowClosedPopup] = useState(false);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);
  const [closedReason, setClosedReason] = useState("");
  const [closedFromDate, setClosedFromDate] = useState("");
  const [closedToDate, setClosedToDate] = useState("");

  const demoStudents = [
    {
      id: 1,
      studentName: "Rahul Kumar",
      fatherName: "Sunil Kumar",
      mobile: "9876543210",
      srNo: "SR001",
    },
    {
      id: 2,
      studentName: "Priya Singh",
      fatherName: "Dinesh Singh",
      mobile: "9876543211",
      srNo: "SR002",
    },
    {
      id: 3,
      studentName: "Aman Verma",
      fatherName: "Rakesh Verma",
      mobile: "9876543212",
      srNo: "SR003",
    },
  ];

  const matchedStudents = searchValue.trim()
    ? demoStudents.filter((student) => {
        const value = searchValue.toLowerCase();

        return (
          student.studentName.toLowerCase().includes(value) ||
          student.fatherName.toLowerCase().includes(value) ||
          student.mobile.includes(searchValue) ||
          student.srNo.toLowerCase().includes(value)
        );
      })
    : [];

  const quickCards = [
    { title: "Students", value: 439, inactive: 32, color: "#16a085" },
    { title: "Admission", value: 25, color: "#f39c12" },
    { title: "Collection Today", value: "₹30,006", color: "#27ae60" },
    { title: "Income Account", value: "₹7,000", color: "#3498db" },
    { title: "Expense Account", value: "₹2,300", color: "#e74c3c" },
    { title: "Concession Today", value: "₹12,500", color: "#d35400" },
    { title: "Transport Students", value: 6, color: "#8e44ad" },
    { title: "Student Birthday", value: 5, color: "#c0392b" },
    { title: "Student Attendance", value: "92%", color: "#1abc9c" },
    { title: "Staff Attendance", value: "96%", color: "#9b59b6" },
    { title: "Bulk Message", value: 0, color: "#0ea5e9" },
  ];

  const sessions = [
    "2026-2027",
    "2025-2026",
    "2024-2025",
    "2023-2024",
    "2022-2023",
  ];

  const modules = [
    { name: "User Control", icon: "🔐", path: "/user-control" },
    { name: "Admin Panel", icon: "⚙️", path: "/admin-panel" },
    { name: "Admissions", icon: "📝", path: "/admissions" },
    { name: "Reception Desk", icon: "🏢", path: "/reception-desk" },
    { name: "Student Hub", icon: "🎓", path: "/student-hub" },
    { name: "Academic Zone", icon: "📚", path: "/academic-zone" },
    { name: "Attendance System", icon: "✅", path: "/attendance-system" },
    { name: "Fee Manager", icon: "💳", path: "/fee-manager" },
    { name: "Transport System", icon: "🚌", path: "/transport-system" },
    { name: "Finance Manager", icon: "📊", path: "/finance-manager" },
    { name: "Student App Access", icon: "📱", path: "/student-app-access" },
    { name: "HR & Staff Management", icon: "👨‍🏫", path: "/staff-control" },
    { name: "Exam Tools", icon: "🧾", path: "/exam-tools" },
    {
      name: "Report Card Management",
      icon: "📄",
      path: "/report-card-management",
    },
  ];

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let day = 1; day <= daysInMonth; day++) calendarDays.push(day);

  const prevMonth = () => setCalendarDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCalendarDate(new Date(year, month + 1, 1));

  const formatDateKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const openClosedDatePopup = (day) => {
  if (!day) return;

  const clickedDate = new Date(year, month, day);
  const dateKey = formatDateKey(clickedDate);

  const savedHoliday = closedDates.find((item) => item.date === dateKey);

  setSelectedCalendarDay(day);
  setClosedFromDate(savedHoliday ? savedHoliday.fromDate : dateKey);
  setClosedToDate(savedHoliday ? savedHoliday.toDate : dateKey);
  setClosedReason(savedHoliday ? savedHoliday.reason : "");
  setShowClosedPopup(true);
};

  const isClosedDate = (day) => {
    if (!day) return false;

    const dateKey = formatDateKey(new Date(year, month, day));

    return closedDates.some((item) => item.date === dateKey);
  };

  const getClosedReason = (day) => {
    if (!day) return "";

    const dateKey = formatDateKey(new Date(year, month, day));
    const found = closedDates.find((item) => item.date === dateKey);

    return found ? found.reason : "";
  };

  const saveClosedDates = () => {
    if (!closedFromDate || !closedToDate) {
      alert("Please select date range");
      return;
    }

    if (!closedReason.trim()) {
      alert("Please enter holiday/closed reason");
      return;
    }

    const from = new Date(closedFromDate);
    const to = new Date(closedToDate);

    if (from > to) {
      alert("To date cannot be before from date");
      return;
    }

    const newDates = [];
    const current = new Date(from);

    while (current <= to) {
      newDates.push({
  date: formatDateKey(current),
  fromDate: closedFromDate,
  toDate: closedToDate,
  reason: closedReason.trim(),
});

      current.setDate(current.getDate() + 1);
    }

    setClosedDates((prev) => {
      const filtered = prev.filter(
        (oldItem) =>
          !newDates.some((newItem) => newItem.date === oldItem.date)
      );

      return [...filtered, ...newDates];
    });

    setShowClosedPopup(false);
    setClosedReason("");
  };
  const deleteHoliday = () => {
  if (!closedFromDate || !closedToDate) return;

  const todayKey = formatDateKey(new Date());

  const relatedDates = closedDates.filter(
    (item) => item.fromDate === closedFromDate && item.toDate === closedToDate
  );

  const hasPastDate = relatedDates.some((item) => item.date < todayKey);

  if (hasPastDate) {
    alert(
      "Holiday already started or past date exists. You cannot delete it. You can change future holiday dates only."
    );
    return;
  }

  const ok = window.confirm("Delete this holiday?");
  if (!ok) return;

  setClosedDates((prev) =>
    prev.filter(
      (item) =>
        !(item.fromDate === closedFromDate && item.toDate === closedToDate)
    )
  );

  setShowClosedPopup(false);
};

  const isToday = (day) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  const handleModuleClick = (module) => {
    if (module.path) {
      window.location.href = module.path;
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <div className="layout">
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileSidebar(true)}
      >
        ☰
      </button>

      {mobileSidebar && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileSidebar(false)}
        />
      )}

      <aside
        className={`sidebar ${autoHide && !mobileSidebar ? "collapsed" : ""} ${
          mobileSidebar ? "mobile-open" : ""
        }`}
      >
        <div className="brand">
          <h2>{autoHide && !mobileSidebar ? "C" : "Classora"}</h2>
          {(!autoHide || mobileSidebar) && <p>School ERP</p>}
        </div>

        <nav>
          <div className="side-item active">
            {autoHide && !mobileSidebar ? "🏠" : "Dashboard"}
          </div>

          {modules.map((module, index) => (
            <div
              className="side-item"
              key={index}
              title={module.name}
              onClick={() => handleModuleClick(module)}
            >
              {autoHide && !mobileSidebar ? module.icon : module.name}
            </div>
          ))}
        </nav>

        <div className="auto-hide">
          <input
            type="checkbox"
            checked={autoHide}
            onChange={(e) => setAutoHide(e.target.checked)}
          />
          {(!autoHide || mobileSidebar) && <span>Auto Hide Sidebar</span>}
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="top-left">
            <h1>Dashboard</h1>
          </div>

          <div className="top-right">
            <div className="dashboard-search-area">
              <input
                type="text"
                placeholder="Search by student, father, mobile, SR no..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
              />

              <span className="search-icon">🔎</span>

              {matchedStudents.length > 0 && (
                <div className="search-suggestion-box">
                  {matchedStudents.map((student) => (
                    <div className="search-suggestion-item" key={student.id}>
                      <strong>{student.studentName}</strong>
                      <span>
                        Father: {student.fatherName} | Mobile: {student.mobile}{" "}
                        | SR: {student.srNo}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <select
              className="session-select"
              value={session}
              onChange={(e) => setSession(e.target.value)}
            >
              {sessions.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>

            <button
              className="logout-icon-btn"
              onClick={handleLogout}
              title="Logout"
            >
              ⎋
            </button>
          </div>
        </header>

        <section className="quick-grid">
          {quickCards.map((card, index) => (
            <div
              className="quick-card"
              key={index}
              style={{ borderTopColor: card.color }}
            >
              <div className="card-top-line">
                <h3 style={{ color: card.color }}>{card.value}</h3>

                {card.inactive !== undefined && (
                  <div className="inactive-badge">
                    <span>🚫</span>
                    <b>{card.inactive}</b>
                  </div>
                )}
              </div>

              <p>{card.title}</p>
            </div>
          ))}
        </section>

        <section className="section-box">
          <h2>System Modules</h2>

          <div className="module-grid">
            {modules.map((module, index) => (
              <div
                className="module-card"
                key={index}
                onClick={() => handleModuleClick(module)}
              >
                <div className="module-icon">{module.icon}</div>
                <p>{module.name}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="dashboard-bottom-row">
          <section className="section-box calendar-box">
            <div className="calendar-header">
              <button onClick={prevMonth}>‹</button>
              <h2>
                {monthNames[month]} {year}
              </h2>
              <button onClick={nextMonth}>›</button>
            </div>

            <div className="month-calendar">
              {weekDays.map((day) => (
                <div className="weekday" key={day}>
                  {day}
                </div>
              ))}

              {calendarDays.map((day, index) => (
                <div
                  className={`calendar-day ${day ? "" : "empty"} ${
                    day && isToday(day) ? "today" : ""
                  } ${day && isClosedDate(day) ? "closed-day" : ""}`}
                  key={index}
                  onClick={() => openClosedDatePopup(day)}
                >
                  <strong>{day}</strong>
                </div>
              ))}
            </div>
          </section>

          <div className="dashboard-info-stack">
            <section className="info-mini-box">
              <h2>Important Information</h2>
              <p>
                Please update student records, attendance, and fee details
                regularly.
              </p>
              <p>
                All users must keep login details secure and must not share
                passwords.
              </p>
              <p>
                Use of this ERP is subject to school policy. Data entered by
                school staff must be accurate and verified before final
                submission.
              </p>
              <p>Unauthorized access or misuse of data is strictly prohibited.</p>
              <p>For technical support or any query, contact : +9188 4024 8644</p>
            </section>

            <section className="dynamic-notice-box">
              <h2>Notice</h2>
              <p>
                Welcome to Classora ERP. Important updates from Super Admin will
                appear here.
              </p>
            </section>
          </div>
        </div>

        {showClosedPopup && (
          <div className="calendar-popup-overlay">
            <div className="calendar-popup">
              <div className="calendar-popup-head">
                <h2>Mark School Closed</h2>

                <button
                  type="button"
                  onClick={() => setShowClosedPopup(false)}
                >
                  ×
                </button>
              </div>

              <p className="calendar-popup-subtitle">
                Selected Date:{" "}
                <strong>
                  {selectedCalendarDay} {monthNames[month]} {year}
                </strong>
              </p>

              <div className="calendar-popup-grid">
                <div className="popup-form-group">
                  <label>From Date</label>
                  <input
                    type="date"
                    value={closedFromDate}
                    onChange={(e) => setClosedFromDate(e.target.value)}
                  />
                </div>

                <div className="popup-form-group">
                  <label>To Date</label>
                  <input
                    type="date"
                    value={closedToDate}
                    onChange={(e) => setClosedToDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="popup-form-group">
                <label>Holiday / Closed Reason</label>
                <input
                  type="text"
                  placeholder="Example: Holi, Rain, Election, Emergency"
                  value={closedReason}
                  onChange={(e) => setClosedReason(e.target.value)}
                />
              </div>

              <div className="calendar-popup-note">
                These dates will be treated as school closed days and will be
                excluded from working day calculation.
              </div>
              <div className="popup-actions">

  <AppButton
    type="primary"
    onClick={saveClosedDates}
  >
    Save Holiday
  </AppButton>

  <AppButton
    type="delete"
    onClick={deleteHoliday}
  >
    Delete Holiday
  </AppButton>

</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;