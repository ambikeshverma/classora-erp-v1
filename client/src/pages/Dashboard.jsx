import React, { useEffect, useState } from "react";
import "./dashboard.css";

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
  const [userName, setUserName] = useState("");

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchType, setSearchType] = useState("studentName");
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    const name = localStorage.getItem("userName");
    if (name) setUserName(name);
  }, []);

  const handleSearch = () => {
    if (!searchValue.trim()) {
      alert("Please enter search value");
      return;
    }
    alert(`Searching by ${searchType}: ${searchValue}`);
  };

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
    { title: "Bulk Message", value: 0, color: "#0ea5e9" }
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
    { name: "Reception Desk", icon: "🏢", path: "/reception-desk" },
    { name: "Admissions", icon: "📝", path: "/admission" },
    { name: "Student Hub", icon: "🎓", path: "/student-hub" },
    { name: "Academic Zone", icon: "📚", path: "/academic-zone" },
    { name: "Attendance System", icon: "✅", path: "/attendance-system" },
    { name: "Fee Manager", icon: "💳", path: "/fee-manager" },
    { name: "Transport System", icon: "🚌", path: "/transport-system" },
    { name: "Finance Manager", icon: "📊", path: "/finance-manager" },
    { name: "Student App Access", icon: "📱", path: "/student-app-access" },
    { name: "HR & Staff Management", icon: "👨‍🏫", path: "/staff-control" },
    { name: "Exam Tools", icon: "🧾", path: "/exam-tools" },
    { name: "Report Card Management", icon: "📄", path: "/report-card-management" },
  ];

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  const holidays = [
    { day: 26, month: 0, name: "Republic Day" },
    { day: 15, month: 7, name: "Independence Day" },
    { day: 2, month: 9, name: "Gandhi Jayanti" },
    { day: 25, month: 11, name: "Christmas" }
  ];

  const getHolidayName = (day) => {
    const holiday = holidays.find((h) => h.day === day && h.month === month);
    return holiday ? holiday.name : "";
  };

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let day = 1; day <= daysInMonth; day++) calendarDays.push(day);

  const prevMonth = () => setCalendarDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCalendarDate(new Date(year, month + 1, 1));

  const isToday = (day) =>
    day === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

  const handleModuleClick = (module) => {
    if (module.path) {
      window.location.href = module.path;
    }
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

      <aside className={`sidebar ${autoHide ? "collapsed" : ""} ${mobileSidebar ? "mobile-open" : ""}`}>
        <div className="brand">
          <h2>{autoHide ? "C" : "Classora"}</h2>
          {!autoHide && <p>School ERP</p>}
        </div>

        <nav>
          <div className="side-item active">
            {autoHide ? "🏠" : "Dashboard"}
          </div>

          {modules.map((module, index) => (
            <div
              className="side-item"
              key={index}
              title={module.name}
              onClick={() => handleModuleClick(module)}
            >
              {autoHide ? module.icon : module.name}
            </div>
          ))}
        </nav>

        <div className="auto-hide">
          <input
            type="checkbox"
            checked={autoHide}
            onChange={(e) => setAutoHide(e.target.checked)}
          />
          {!autoHide && <span>Auto Hide Sidebar</span>}
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="top-left">
            <h1>Dashboard</h1>
            <p>Welcome {userName || "User"} to The Classora ERP</p>
          </div>

          <div className="top-right">
            <select
              className="account-select"
              onChange={(e) => {
                if (e.target.value === "Logout") {
                  localStorage.clear();
                  window.location.href = "/";
                }
              }}
            >
              <option>Account</option>
              <option>Recharge</option>
              <option>Change Password</option>
              <option>Logout</option>
            </select>

            <select
              className="session-select"
              value={session}
              onChange={(e) => setSession(e.target.value)}
            >
              {sessions.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>

            <select
              className="search-type-select"
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
            >
              <option value="studentName">Student Name</option>
              <option value="mobileNumber">Mobile Number</option>
              <option value="admissionNo">Admission No.</option>
              <option value="srNumber">SR Number</option>
            </select>

            <div className="search-slot">
              {!searchOpen ? (
                <button
                  className="lens-btn"
                  onClick={() => setSearchOpen(true)}
                >
                  🔎
                </button>
              ) : (
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="Search student..."
                    value={searchValue}
                    autoFocus
                    onChange={(e) => setSearchValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSearch();
                    }}
                  />

                  <button className="search-btn" onClick={handleSearch}>
                    Search
                  </button>

                  <button
                    className="close-search"
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchValue("");
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
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
      <h2>{monthNames[month]} {year}</h2>
      <button onClick={nextMonth}>›</button>
    </div>

    <div className="month-calendar">
      {weekDays.map((day) => (
        <div className="weekday" key={day}>{day}</div>
      ))}

      {calendarDays.map((day, index) => (
        <div
          className={`calendar-day ${day ? "" : "empty"} ${
            day && isToday(day) ? "today" : ""
          }`}
          key={index}
        >
          <strong>{day}</strong>
          {day && getHolidayName(day) && <small>{getHolidayName(day)}</small>}
        </div>
      ))}
    </div>
  </section>

  <div className="dashboard-info-stack">
    <section className="info-mini-box">
      <h2>Important Information</h2>
      <p>Please update student records, attendance, and fee details regularly.</p>
      <p>All users must keep login details secure and must not share passwords.</p>
      <p>Use of this ERP is subject to school policy. Data entered by school staff must be accurate and verified before final submission.</p>
      <p>Unauthorized access or misuse of data is strictly prohibited.</p>
      <p>For technical support or any query, contact : +9188 4024 8644</p>
    </section>


    <section className="dynamic-notice-box">
      <h2>Notice</h2>
      <p>Welcome to Classora ERP. Important updates from Super Admin will appear here.</p>
    </section>
  </div>
</div>

      </main>
    </div>
  );
}

export default Dashboard;