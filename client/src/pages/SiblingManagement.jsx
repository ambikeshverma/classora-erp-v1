import React, { useState } from "react";
import "./siblingManagement.css";
import AppButton from "../components/AppButton";

function SiblingManagement() {
  const schoolId = localStorage.getItem("schoolId") || "SCH001";

  const demoStudents = [
    {
      id: 1,
      admissionNo: "ADM001",
      studentName: "Rahul Kumar",
      className: "Class 6",
      sectionName: "A",
    },
    {
      id: 2,
      admissionNo: "ADM002",
      studentName: "Priya Kumar",
      className: "Class 4",
      sectionName: "B",
    },
    {
      id: 3,
      admissionNo: "ADM003",
      studentName: "Aman Singh",
      className: "Class 7",
      sectionName: "A",
    },
  ];

  const usedSiblingGroups = [];

  const [showForm, setShowForm] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewData, setViewData] = useState(null);
  const [editId, setEditId] = useState(null);

  const [searchText, setSearchText] = useState("");
  const [guardianMobileFilter, setGuardianMobileFilter] = useState("");
  const [isSearched, setIsSearched] = useState(false);

  const [appliedFilters, setAppliedFilters] = useState({
    searchText: "",
    guardianMobileFilter: "",
  });

  const [formData, setFormData] = useState({
    guardianName: "",
    guardianMobile: "",
    address: "",
    students: [],
  });

  const [studentForm, setStudentForm] = useState({
    studentId: "",
  });

  const visibleGroups = groups.filter((item) => item.schoolId === schoolId);

  const resetForm = () => {
    setFormData({
      guardianName: "",
      guardianMobile: "",
      address: "",
      students: [],
    });

    setStudentForm({
      studentId: "",
    });

    setEditId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleStudentFormChange = (e) => {
    const { name, value } = e.target;

    setStudentForm({
      ...studentForm,
      [name]: value,
    });
  };

  const handleAddStudentToGroup = () => {
    if (!studentForm.studentId) {
      alert("Select student");
      return;
    }

    const selectedStudent = demoStudents.find(
      (item) => item.id === Number(studentForm.studentId)
    );

    if (!selectedStudent) return;

    const alreadyAdded = formData.students.some(
      (item) => item.id === selectedStudent.id
    );

    if (alreadyAdded) {
      alert("Student already added in this group");
      return;
    }

    const alreadyInOtherGroup = visibleGroups.find(
      (group) =>
        group.id !== editId &&
        group.students.some((student) => student.id === selectedStudent.id)
    );

    if (alreadyInOtherGroup) {
      alert(
        "This student is already linked in another sibling group. Remove the student from the existing sibling group first."
      );
      return;
    }

    setFormData({
      ...formData,
      students: [...formData.students, selectedStudent],
    });

    setStudentForm({
      studentId: "",
    });
  };

  const handleRemoveStudentFromForm = (studentId) => {
    setFormData({
      ...formData,
      students: formData.students.filter((item) => item.id !== studentId),
    });
  };

  const handleSave = () => {
    if (
      !formData.guardianName ||
      !formData.guardianMobile ||
      formData.students.length < 2
    ) {
      alert("Guardian details and minimum 2 students are required");
      return;
    }

    if (!/^[0-9]{10}$/.test(formData.guardianMobile)) {
      alert("Guardian mobile must be 10 digits");
      return;
    }

    const alreadyExists = visibleGroups.some(
      (item) =>
        item.guardianMobile.trim() === formData.guardianMobile.trim() &&
        item.id !== editId
    );

    if (alreadyExists) {
      alert("Sibling group already exists");
      return;
    }

    if (editId) {
      setGroups(
        groups.map((item) =>
          item.id === editId
            ? {
                ...item,
                ...formData,
              }
            : item
        )
      );

      alert("Sibling group updated successfully");
    } else {
      const newGroup = {
        id: Date.now(),
        schoolId,
        ...formData,
      };

      setGroups([...groups, newGroup]);

      alert("Sibling group created successfully");
    }

    resetForm();
    setShowForm(false);
    setIsSearched(true);
    setSelectedIds([]);
  };

  const handleSearch = () => {
    const filters = {
      searchText,
      guardianMobileFilter,
    };

    setAppliedFilters(filters);

    const result = visibleGroups.filter((item) => {
      const mobileMatch = filters.guardianMobileFilter
        ? item.guardianMobile.includes(filters.guardianMobileFilter)
        : true;

      const searchMatch = filters.searchText
        ? item.guardianName
            .toLowerCase()
            .includes(filters.searchText.toLowerCase()) ||
          item.guardianMobile.includes(filters.searchText) ||
          item.students.some(
            (student) =>
              student.studentName
                .toLowerCase()
                .includes(filters.searchText.toLowerCase()) ||
              student.admissionNo
                .toLowerCase()
                .includes(filters.searchText.toLowerCase())
          )
        : true;

      return mobileMatch && searchMatch;
    });

    if (result.length === 0) {
      alert("No sibling group found");
    }

    setIsSearched(true);
    setSelectedIds([]);
  };

  const filteredGroups = visibleGroups.filter((item) => {
    const mobileMatch = appliedFilters.guardianMobileFilter
      ? item.guardianMobile.includes(appliedFilters.guardianMobileFilter)
      : true;

    const searchMatch = appliedFilters.searchText
      ? item.guardianName
          .toLowerCase()
          .includes(appliedFilters.searchText.toLowerCase()) ||
        item.guardianMobile.includes(appliedFilters.searchText) ||
        item.students.some(
          (student) =>
            student.studentName
              .toLowerCase()
              .includes(appliedFilters.searchText.toLowerCase()) ||
            student.admissionNo
              .toLowerCase()
              .includes(appliedFilters.searchText.toLowerCase())
        )
      : true;

    return mobileMatch && searchMatch;
  });

  const selectedGroups = visibleGroups.filter((item) =>
    selectedIds.includes(item.id)
  );

  const selectedSingle =
    selectedGroups.length === 1 ? selectedGroups[0] : null;

  const handleEdit = () => {
    if (!selectedSingle) {
      alert("Select one sibling group");
      return;
    }

    setEditId(selectedSingle.id);

    setFormData({
      guardianName: selectedSingle.guardianName,
      guardianMobile: selectedSingle.guardianMobile,
      address: selectedSingle.address,
      students: selectedSingle.students,
    });

    setShowForm(true);
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) {
      alert("Select sibling group");
      return;
    }

    const blockedGroup = visibleGroups.find((item) =>
      usedSiblingGroups.includes(item.id)
    );

    if (blockedGroup) {
      alert("Sibling group is already linked with students. Cannot delete.");
      return;
    }

    const ok = window.confirm("Delete selected sibling group?");

    if (!ok) return;

    setGroups(groups.filter((item) => !selectedIds.includes(item.id)));

    setSelectedIds([]);
  };

  const handleOpenProfile = (student) => {
    alert("Open profile: " + student.studentName);
  };

  return (
    <div className="sibling-page">
      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => {
            if (showForm) {
              resetForm();
              setShowForm(false);
            } else {
              window.location.href = "/student-hub";
            }
          }}
        >
          ←
        </AppButton>

        <div>
          <h1>Sibling Management</h1>
          <p>Manage sibling groups and family student links</p>
        </div>
      </div>

      {!showForm && (
        <>
          <div className="common-card">
            <div className="filter-grid">
              <div className="form-group">
                <label>Guardian Mobile</label>

                <input
                  type="text"
                  placeholder="Guardian mobile"
                  value={guardianMobileFilter}
                  onChange={(e) => setGuardianMobileFilter(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Search</label>

                <input
                  type="text"
                  placeholder="Guardian, student or admission no"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
            </div>

            <div className="search-btn-row">
              <AppButton type="primary" onClick={handleSearch}>
                Search
              </AppButton>
            </div>
          </div>

          <div className="common-card">
            <div className="list-header">
              <h2>Sibling Group List</h2>

              <div className="list-action-buttons">
                <AppButton type="primary" onClick={() => setShowForm(true)}>
                  + Create Sibling Group
                </AppButton>

                <AppButton
                  type="view"
                  onClick={() => {
                    if (!selectedSingle) {
                      alert("Select one sibling group");
                      return;
                    }

                    setViewData(selectedSingle);
                  }}
                >
                  View Group
                </AppButton>

                <AppButton type="primary" onClick={handleEdit}>
                  Edit Group
                </AppButton>

                <AppButton type="delete" onClick={handleDelete}>
                  Delete Group
                </AppButton>
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
                          filteredGroups.length > 0 &&
                          selectedIds.length === filteredGroups.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(
                              filteredGroups.map((item) => item.id)
                            );
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                      />
                    </th>

                    <th>S.No</th>
                    <th>Guardian Name</th>
                    <th>Guardian Mobile</th>
                    <th>Total Children</th>
                    <th>Students</th>
                  </tr>
                </thead>

                <tbody>
                  {!isSearched ? (
                    <tr>
                      <td colSpan="6" className="empty-row">
                        Click Search to view sibling groups
                      </td>
                    </tr>
                  ) : filteredGroups.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-row">
                        No sibling group found
                      </td>
                    </tr>
                  ) : (
                    filteredGroups.map((item, index) => (
                      <tr key={item.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => {
                              setSelectedIds((prev) =>
                                prev.includes(item.id)
                                  ? prev.filter((id) => id !== item.id)
                                  : [...prev, item.id]
                              );
                            }}
                          />
                        </td>

                        <td>{index + 1}</td>
                        <td>{item.guardianName}</td>
                        <td>{item.guardianMobile}</td>
                        <td>{item.students.length}</td>
                        <td>
                          {item.students
                            .map((student) => student.studentName)
                            .join(", ")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showForm && (
        <div className="common-card">
         <div className="guardian-form-grid">
            <div className="form-group">
              <label>Guardian Name</label>

              <input
                type="text"
                name="guardianName"
                value={formData.guardianName}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Guardian Mobile</label>

              <input
                type="text"
                name="guardianMobile"
                value={formData.guardianMobile}
                onChange={handleChange}
              />
            </div>

            <div className="form-group full-width">
              <label>Address</label>

              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
              ></textarea>
            </div>
          </div>

          <div className="common-card inner-card">
            <h2>Add Students In Group</h2>

            <div className="student-add-row">
              <div className="form-group">

                <select
                  name="studentId"
                  value={studentForm.studentId}
                  onChange={handleStudentFormChange}
                >
                  <option value="">Select Student</option>

                  {demoStudents.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.studentName} - {student.admissionNo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="student-add-btn">
                <AppButton type="primary" onClick={handleAddStudentToGroup}>
                  Add Student
                </AppButton>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Admission No</th>
                    <th>Student Name</th>
                    <th>Class</th>
                    <th>Section</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {formData.students.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-row">
                        No student added
                      </td>
                    </tr>
                  ) : (
                    formData.students.map((student, index) => (
                      <tr key={student.id}>
                        <td>{index + 1}</td>
                        <td>{student.admissionNo}</td>
                        <td>{student.studentName}</td>
                        <td>{student.className}</td>
                        <td>{student.sectionName}</td>
                        <td>
                          <AppButton
                            type="delete"
                            onClick={() =>
                              handleRemoveStudentFromForm(student.id)
                            }
                          >
                            Remove
                          </AppButton>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="form-actions">
            <AppButton type="primary" onClick={handleSave}>
              {editId ? "Update Group" : "Save Group"}
            </AppButton>

            <AppButton
              type="secondary"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
            >
              Go Back
            </AppButton>
          </div>
        </div>
      )}

      {viewData && (
        <div className="popup-overlay">
          <div className="view-popup">
            <div className="popup-head">
              <h2>Sibling Group Details</h2>

              <button
                className="popup-close-btn"
                onClick={() => setViewData(null)}
              >
                ×
              </button>
            </div>

            <div className="view-grid">
              <p>
                <strong>Guardian Name:</strong> {viewData.guardianName}
              </p>

              <p>
                <strong>Guardian Mobile:</strong> {viewData.guardianMobile}
              </p>

              <p>
                <strong>Total Children:</strong> {viewData.students.length}
              </p>

              <p className="full-width">
                <strong>Address:</strong> {viewData.address || "-"}
              </p>
            </div>

            <div className="table-wrap sibling-popup-table">
              <table>
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>Admission No</th>
                    <th>Student Name</th>
                    <th>Class</th>
                    <th>Section</th>
                    <th>Profile</th>
                  </tr>
                </thead>

                <tbody>
                  {viewData.students.map((student, index) => (
                    <tr key={student.id}>
                      <td>{index + 1}</td>
                      <td>{student.admissionNo}</td>
                      <td>{student.studentName}</td>
                      <td>{student.className}</td>
                      <td>{student.sectionName}</td>
                      <td>
                        <button
                          className="profile-icon-btn"
                          onClick={() => handleOpenProfile(student)}
                        >
                          👤
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SiblingManagement;