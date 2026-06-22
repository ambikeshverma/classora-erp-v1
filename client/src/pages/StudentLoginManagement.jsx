import React, { useMemo, useState } from "react";
import "./studentLoginManagement.css";
import AppButton from "../components/AppButton";

function StudentLoginManagement() {
  const loginMethodFromSuperAdmin = "Both";

  const classOptions = [
    "All",
    "Class 1",
    "Class 2",
    "Class 3",
    "Class 4",
    "Class 5",
    "Class 6",
  ];

  const sectionOptions = ["All", "A", "B", "C", "D"];

  const statusOptions = [
    "All",
    "Account Created",
    "Not Registered",
    "Logged In",
    "Never Logged In",
    "Disabled",
  ];

  const [students, setStudents] = useState([
    {
      id: 1,
      className: "Class 6",
      sectionName: "A",
      srNo: "SR001",
      studentName: "Rahul Kumar",
      fatherName: "Sunil Kumar",
      primaryMobile: "9876543210",
      username: "rahul001",
      password: "Rahul@123",
      accountCreated: true,
      hasLoggedIn: true,
      isEnabled: true,
    },
    {
      id: 2,
      className: "Class 6",
      sectionName: "B",
      srNo: "SR002",
      studentName: "Priya Singh",
      fatherName: "Dinesh Singh",
      primaryMobile: "9876543211",
      username: "priya002",
      password: "Priya@123",
      accountCreated: true,
      hasLoggedIn: false,
      isEnabled: true,
    },
    {
      id: 3,
      className: "Class 5",
      sectionName: "A",
      srNo: "SR003",
      studentName: "Aman Verma",
      fatherName: "Rakesh Verma",
      primaryMobile: "9876543212",
      username: "",
      password: "",
      accountCreated: false,
      hasLoggedIn: false,
      isEnabled: true,
    },
    {
      id: 4,
      className: "Class 4",
      sectionName: "C",
      srNo: "SR004",
      studentName: "Shagun Maurya",
      fatherName: "Rajesh Maurya",
      primaryMobile: "9876543213",
      username: "shagun004",
      password: "Shagun@123",
      accountCreated: true,
      hasLoggedIn: false,
      isEnabled: false,
    },
  ]);

  const [searchText, setSearchText] = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [sectionFilter, setSectionFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [appliedFilters, setAppliedFilters] = useState({
    searchText: "",
    classFilter: "All",
    sectionFilter: "All",
    statusFilter: "All",
  });

  const [selectedIds, setSelectedIds] = useState([]);

  const [showGeneratePopup, setShowGeneratePopup] = useState(false);
  const [showResetPopup, setShowResetPopup] = useState(false);

  const [credentialForm, setCredentialForm] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });

  const getStudentStatus = (student) => {
    if (!student.isEnabled) return "Disabled";
    if (!student.accountCreated) return "Not Registered";
    if (student.accountCreated && student.hasLoggedIn) return "Logged In";
    if (student.accountCreated && !student.hasLoggedIn) return "Never Logged In";
    return "Not Registered";
  };

  const filteredStudents = students.filter((student) => {
    const searchMatch = appliedFilters.searchText
      ? student.studentName
          .toLowerCase()
          .includes(appliedFilters.searchText.toLowerCase()) ||
        student.fatherName
          .toLowerCase()
          .includes(appliedFilters.searchText.toLowerCase()) ||
        student.srNo
          .toLowerCase()
          .includes(appliedFilters.searchText.toLowerCase()) ||
        student.primaryMobile.includes(appliedFilters.searchText)
      : true;

    const classMatch =
      appliedFilters.classFilter === "All"
        ? true
        : student.className === appliedFilters.classFilter;

    const sectionMatch =
      appliedFilters.sectionFilter === "All"
        ? true
        : student.sectionName === appliedFilters.sectionFilter;

    const statusMatch =
      appliedFilters.statusFilter === "All"
        ? true
        : appliedFilters.statusFilter === "Account Created"
        ? student.accountCreated
        : getStudentStatus(student) === appliedFilters.statusFilter;

    return searchMatch && classMatch && sectionMatch && statusMatch;
  });

  const selectedStudents = students.filter((item) =>
    selectedIds.includes(item.id)
  );

  const summary = useMemo(() => {
    return {
      totalStudents: students.length,
      accountCreated: students.filter((s) => s.accountCreated).length,
      notRegistered: students.filter((s) => !s.accountCreated).length,
      loggedIn: students.filter((s) => s.accountCreated && s.hasLoggedIn).length,
      neverLoggedIn: students.filter((s) => s.accountCreated && !s.hasLoggedIn)
        .length,
    };
  }, [students]);

  const canUseSchoolManaged =
    loginMethodFromSuperAdmin === "School Managed Login" ||
    loginMethodFromSuperAdmin === "Both";

  const handleSearch = () => {
    setAppliedFilters({
      searchText,
      classFilter,
      sectionFilter,
      statusFilter,
    });
    setSelectedIds([]);
  };

  const applySummaryFilter = (filter) => {
    setStatusFilter(filter);
    setAppliedFilters({
      searchText: "",
      classFilter: "All",
      sectionFilter: "All",
      statusFilter: filter,
    });
    setSearchText("");
    setClassFilter("All");
    setSectionFilter("All");
    setSelectedIds([]);
  };

  const generatePassword = () => {
    const random = Math.floor(1000 + Math.random() * 9000);
    return `Classora@${random}`;
  };

  const openGeneratePopup = () => {
    if (!canUseSchoolManaged) {
      alert("School managed login is not allowed for this school");
      return;
    }

    if (selectedIds.length === 0) {
      alert("Select student");
      return;
    }

    const alreadyCreated = selectedStudents.some((s) => s.accountCreated);

    if (alreadyCreated) {
      alert("Selected student already has account");
      return;
    }

    if (selectedIds.length === 1) {
      const student = selectedStudents[0];
      setCredentialForm({
        username: student.srNo.toLowerCase(),
        password: generatePassword(),
        confirmPassword: "",
      });
    } else {
      setCredentialForm({
        username: "Auto generated for selected students",
        password: generatePassword(),
        confirmPassword: "",
      });
    }

    setShowGeneratePopup(true);
  };
  const handleGenerateLogin = () => {
    if (
      !credentialForm.password ||
      !credentialForm.confirmPassword
    ) {
      alert("Fill all fields");
      return;
    }

    if (
      credentialForm.password !==
      credentialForm.confirmPassword
    ) {
      alert("Passwords do not match");
      return;
    }

    setStudents((prev) =>
      prev.map((student) => {
        if (!selectedIds.includes(student.id))
          return student;

        return {
          ...student,
          username:
            selectedIds.length === 1
              ? credentialForm.username
              : student.srNo.toLowerCase(),
          password: credentialForm.password,
          accountCreated: true,
        };
      })
    );

    setShowGeneratePopup(false);
    setSelectedIds([]);
  };

  const openResetPopup = () => {
    if (!canUseSchoolManaged) {
      alert("Not allowed");
      return;
    }

    if (selectedIds.length === 0) {
      alert("Select student");
      return;
    }

    setCredentialForm({
      username: "",
      password: "",
      confirmPassword: "",
    });

    setShowResetPopup(true);
  };

  const handleResetPassword = () => {
    if (
      !credentialForm.password ||
      !credentialForm.confirmPassword
    ) {
      alert("Fill all fields");
      return;
    }

    if (
      credentialForm.password !==
      credentialForm.confirmPassword
    ) {
      alert("Passwords do not match");
      return;
    }

    setStudents((prev) =>
      prev.map((student) =>
        selectedIds.includes(student.id)
          ? {
              ...student,
              password: credentialForm.password,
            }
          : student
      )
    );

    setShowResetPopup(false);
    setSelectedIds([]);
  };

  const handleEnableDisable = () => {
    if (selectedIds.length === 0) {
      alert("Select student");
      return;
    }

    const selected = students.filter((s) =>
      selectedIds.includes(s.id)
    );

    const allEnabled = selected.every(
      (s) => s.isEnabled
    );

    const allDisabled = selected.every(
      (s) => !s.isEnabled
    );

    if (!allEnabled && !allDisabled) {
      alert(
        "Please select students with same login status."
      );
      return;
    }

    setStudents((prev) =>
      prev.map((student) => {
        if (!selectedIds.includes(student.id))
          return student;

        return {
          ...student,
          isEnabled: !allEnabled,
        };
      })
    );

    setSelectedIds([]);
  };

  const enableDisableLabel = (() => {
    if (selectedIds.length === 0)
      return "Login Status";

    const selected = students.filter((s) =>
      selectedIds.includes(s.id)
    );

    const allEnabled = selected.every(
      (s) => s.isEnabled
    );

    const allDisabled = selected.every(
      (s) => !s.isEnabled
    );

    if (allEnabled) return "Disable";
    if (allDisabled) return "Enable";

    return "Login Status";
  })();

  return (
    <div className="student-login-page">

     <div className="common-page-header">

  <AppButton
    type="back"
    onClick={() =>
      window.location.href =
        "/student-app-access"
    }
  >
    ←
  </AppButton>

  <div>
    <h1>
      Student Login Management
    </h1>

    <p>
      Manage student login access,
      credentials and registration
      settings
    </p>
  </div>

</div>
      <div className="common-card">

        <div className="student-filter-grid">

          <div className="form-group">
            <label>Search Student</label>

            <input
              value={searchText}
              onChange={(e) =>
                setSearchText(e.target.value)
              }
              placeholder="Name, SR No, Mobile"
            />
          </div>

          <div className="form-group">
            <label>Class</label>

            <select
              value={classFilter}
              onChange={(e) =>
                setClassFilter(e.target.value)
              }
            >
              {classOptions.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Section</label>

            <select
              value={sectionFilter}
              onChange={(e) =>
                setSectionFilter(e.target.value)
              }
            >
              {sectionOptions.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Login Status</label>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
            >
              {statusOptions.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>
          </div>

        </div>

        <div className="top-action-bar">
          <AppButton
            type="primary"
            onClick={handleSearch}
          >
            Search
          </AppButton>
        </div>

      </div>

      {/* Summary cards */}

      <div className="summary-grid">

        <div
          className="summary-card"
          onClick={() =>
            applySummaryFilter(
              "Account Created"
            )
          }
        >
          <h3>Account Created</h3>
          <p>{summary.accountCreated}</p>
        </div>

        <div
          className="summary-card"
          onClick={() =>
            applySummaryFilter(
              "Not Registered"
            )
          }
        >
          <h3>Not Registered</h3>
          <p>{summary.notRegistered}</p>
        </div>

        <div
          className="summary-card"
          onClick={() =>
            applySummaryFilter(
              "Logged In"
            )
          }
        >
          <h3>Logged In</h3>
          <p>{summary.loggedIn}</p>
        </div>

        <div
          className="summary-card"
          onClick={() =>
            applySummaryFilter(
              "Never Logged In"
            )
          }
        >
          <h3>Never Logged In</h3>
          <p>{summary.neverLoggedIn}</p>
        </div>

      </div>

      {/* Table + Popups */}
      <div className="common-card">

        <div className="list-header">

          <h2>Student Login List</h2>

          <div className="list-action-buttons">

            {canUseSchoolManaged && (
              <>
                <AppButton
                  type="primary"
                  onClick={openGeneratePopup}
                >
                  Generate Login
                </AppButton>

                <AppButton
                  type="primary"
                  onClick={openResetPopup}
                >
                  Reset Password
                </AppButton>
              </>
            )}

            <AppButton
              type="primary"
              onClick={handleEnableDisable}
            >
              {enableDisableLabel}
            </AppButton>

            {canUseSchoolManaged && (
              <AppButton
                type="print"
                onClick={() => {
                  if (selectedIds.length === 0) {
                    alert("Select student");
                    return;
                  }

                  window.print();
                }}
              >
                Print Login Slip
              </AppButton>
            )}

          </div>

        </div>

        <div className="table-wrap">

          <table>

            <thead>

              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={
                      filteredStudents.length > 0 &&
                      selectedIds.length ===
                        filteredStudents.length
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(
                          filteredStudents.map(
                            (item) => item.id
                          )
                        );
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                  />
                </th>

                <th>S.No</th>
                <th>Class</th>
                <th>Section</th>
                <th>SR No</th>
                <th>Student Name</th>
                <th>Father Name</th>
                <th>Primary Mobile</th>
                <th>Username</th>
                <th>Status</th>
              </tr>

            </thead>

            <tbody>

              {filteredStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan="10"
                    className="empty-row"
                  >
                    No student found
                  </td>
                </tr>
              ) : (
                filteredStudents.map(
                  (student, index) => (
                    <tr key={student.id}>

                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(
                            student.id
                          )}
                          onChange={() => {
                            setSelectedIds(
                              (prev) =>
                                prev.includes(
                                  student.id
                                )
                                  ? prev.filter(
                                      (id) =>
                                        id !==
                                        student.id
                                    )
                                  : [
                                      ...prev,
                                      student.id,
                                    ]
                            );
                          }}
                        />
                      </td>

                      <td>{index + 1}</td>
                      <td>{student.className}</td>
                      <td>{student.sectionName}</td>
                      <td>{student.srNo}</td>
                      <td>{student.studentName}</td>
                      <td>{student.fatherName}</td>
                      <td>{student.primaryMobile}</td>

                      <td>
                        {student.username || "-"}
                      </td>

                      <td>
                        <span
                          className={`status-badge ${getStudentStatus(
                            student
                          )
                            .replaceAll(
                              " ",
                              "-"
                            )
                            .toLowerCase()}`}
                        >
                          {getStudentStatus(
                            student
                          )}
                        </span>
                      </td>

                    </tr>
                  )
                )
              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* Generate Login Popup */}

      {showGeneratePopup && (
        <div className="popup-overlay">

          <div className="popup-box">

            <div className="popup-header">

  <h2>
    Generate Login
  </h2>

  <button
    className="popup-close-btn"
    onClick={() =>
      setShowGeneratePopup(false)
    }
  >
    ×
  </button>

</div>

            <div className="popup-content">

              <div className="form-group">
                <label>Username</label>

                <input
                  value={
                    credentialForm.username
                  }
                  onChange={(e) =>
                    setCredentialForm({
                      ...credentialForm,
                      username:
                        e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>Password</label>

                <input
                  value={
                    credentialForm.password
                  }
                  onChange={(e) =>
                    setCredentialForm({
                      ...credentialForm,
                      password:
                        e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>
                  Confirm Password
                </label>

                <input
                  value={
                    credentialForm.confirmPassword
                  }
                  onChange={(e) =>
                    setCredentialForm({
                      ...credentialForm,
                      confirmPassword:
                        e.target.value,
                    })
                  }
                />
              </div>

            </div>

            <div className="popup-actions">

              <AppButton
                type="primary"
                onClick={
                  handleGenerateLogin
                }
              >
                Save
              </AppButton>

            </div>

          </div>

        </div>
      )}

      {/* Reset Password Popup */}

      {showResetPopup && (
        <div className="popup-overlay">

          <div className="popup-box">

           <div className="popup-header">

  <h2>
    Reset Password
  </h2>

  <button
    className="popup-close-btn"
    onClick={() =>
      setShowResetPopup(false)
    }
  >
    ×
  </button>

</div>

            <div className="popup-content">

              <div className="form-group">
                <label>
                  New Password
                </label>

                <input
                  value={
                    credentialForm.password
                  }
                  onChange={(e) =>
                    setCredentialForm({
                      ...credentialForm,
                      password:
                        e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label>
                  Confirm Password
                </label>

                <input
                  value={
                    credentialForm.confirmPassword
                  }
                  onChange={(e) =>
                    setCredentialForm({
                      ...credentialForm,
                      confirmPassword:
                        e.target.value,
                    })
                  }
                />
              </div>

            </div>

            <div className="popup-actions">

              <AppButton
                type="primary"
                onClick={
                  handleResetPassword
                }
              >
                Save
              </AppButton>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default StudentLoginManagement;