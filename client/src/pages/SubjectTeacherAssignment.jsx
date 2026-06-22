import React, { useState } from "react";
import "./subjectTeacherAssignment.css";
import AppButton from "../components/AppButton";

function SubjectTeacherAssignment() {
  const schoolId = localStorage.getItem("schoolId") || "SCH001";

  const classes = [
    { id: 1, schoolId: "SCH001", className: "9" },
    { id: 2, schoolId: "SCH001", className: "10" },
  ];

  const sections = [
    { id: 1, schoolId: "SCH001", classId: 1, sectionName: "A" },
    { id: 2, schoolId: "SCH001", classId: 1, sectionName: "B" },
    { id: 3, schoolId: "SCH001", classId: 2, sectionName: "A" },
  ];

  const subjects = [
    { id: 1, schoolId: "SCH001", subjectName: "Hindi" },
    { id: 2, schoolId: "SCH001", subjectName: "English" },
    { id: 3, schoolId: "SCH001", subjectName: "Math" },
    { id: 4, schoolId: "SCH001", subjectName: "Science" },
    { id: 5, schoolId: "SCH001", subjectName: "SST" },
  ];

  const classSubjectMapping = [
    { id: 1, schoolId: "SCH001", classId: 1, subjectId: 1 },
    { id: 2, schoolId: "SCH001", classId: 1, subjectId: 2 },
    { id: 3, schoolId: "SCH001", classId: 1, subjectId: 3 },
    { id: 4, schoolId: "SCH001", classId: 1, subjectId: 4 },
    { id: 5, schoolId: "SCH001", classId: 1, subjectId: 5 },
    { id: 6, schoolId: "SCH001", classId: 2, subjectId: 1 },
    { id: 7, schoolId: "SCH001", classId: 2, subjectId: 2 },
    { id: 8, schoolId: "SCH001", classId: 2, subjectId: 3 },
  ];

  const staffList = [
    {
      id: 1,
      schoolId: "SCH001",
      employeeName: "Amit Kumar",
      departmentId: 1,
      positionId: 1,
      teachingStaff: "Yes",
      isActive: true,
    },
    {
      id: 2,
      schoolId: "SCH001",
      employeeName: "Pooja Singh",
      departmentId: 1,
      positionId: 1,
      teachingStaff: "Yes",
      isActive: true,
    },
    {
      id: 3,
      schoolId: "SCH001",
      employeeName: "Ravi Verma",
      departmentId: 1,
      positionId: 2,
      teachingStaff: "Yes",
      isActive: true,
    },
    {
      id: 4,
      schoolId: "SCH001",
      employeeName: "Accountant Staff",
      departmentId: 2,
      positionId: 3,
      teachingStaff: "No",
      isActive: true,
    },
  ];

  const [filterClassId, setFilterClassId] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const [formData, setFormData] = useState({
    subjectId: "",
    teacherStaffId: "",
  });

  const [assignments, setAssignments] = useState([
    {
      id: 1,
      schoolId: "SCH001",
      classId: 1,
      sectionId: 1,
      subjectId: 1,
      teacherStaffId: 1,
    },
    {
      id: 2,
      schoolId: "SCH001",
      classId: 1,
      sectionId: 1,
      subjectId: 2,
      teacherStaffId: 2,
    },
  ]);

  const schoolClasses = classes.filter((item) => item.schoolId === schoolId);

  const schoolSections = sections.filter((item) => item.schoolId === schoolId);

  const teachingStaff = staffList.filter(
    (item) =>
      item.schoolId === schoolId &&
      item.teachingStaff === "Yes" &&
      item.isActive
  );

  const classSectionRows = schoolSections
    .map((section) => {
      const classInfo = schoolClasses.find((cls) => cls.id === section.classId);

      return {
        classId: section.classId,
        sectionId: section.id,
        className: classInfo?.className || "",
        sectionName: section.sectionName,
      };
    })
    .filter(
      (item) => !filterClassId || item.classId === Number(filterClassId)
    );

  const getSubjectName = (subjectId) => {
    const subject = subjects.find((item) => item.id === Number(subjectId));
    return subject?.subjectName || "-";
  };

  const getStaffName = (staffId) => {
    const staff = staffList.find((item) => item.id === Number(staffId));
    return staff?.employeeName || "-";
  };

  const getMappedSubjects = (classId) => {
    const mappedSubjectIds = classSubjectMapping
      .filter((item) => item.schoolId === schoolId && item.classId === classId)
      .map((item) => item.subjectId);

    return subjects.filter(
      (subject) =>
        subject.schoolId === schoolId && mappedSubjectIds.includes(subject.id)
    );
  };

  const getAssignmentsForRow = (classId, sectionId) => {
    return assignments.filter(
      (item) =>
        item.schoolId === schoolId &&
        item.classId === classId &&
        item.sectionId === sectionId
    );
  };

  const getAvailableSubjects = () => {
    if (!selectedRow) return [];

    const mappedSubjects = getMappedSubjects(selectedRow.classId);

    const assignedSubjectIds = getAssignmentsForRow(
      selectedRow.classId,
      selectedRow.sectionId
    ).map((item) => item.subjectId);

    return mappedSubjects.filter(
      (subject) => !assignedSubjectIds.includes(subject.id)
    );
  };

  const openAssignPopup = (row) => {
    setSelectedRow(row);
    setFormData({
      subjectId: "",
      teacherStaffId: "",
    });
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedRow(null);
    setFormData({
      subjectId: "",
      teacherStaffId: "",
    });
  };

  const handleSaveAssignment = () => {
    if (!formData.subjectId) {
      alert("Please select subject");
      return;
    }

    if (!formData.teacherStaffId) {
      alert("Please select subject teacher");
      return;
    }

    const existing = assignments.find(
      (item) =>
        item.schoolId === schoolId &&
        item.classId === selectedRow.classId &&
        item.sectionId === selectedRow.sectionId &&
        item.subjectId === Number(formData.subjectId)
    );

    if (existing) {
      setAssignments(
        assignments.map((item) =>
          item.id === existing.id
            ? {
                ...item,
                teacherStaffId: Number(formData.teacherStaffId),
              }
            : item
        )
      );
    } else {
      const newAssignment = {
        id: Date.now(),
        schoolId,
        classId: selectedRow.classId,
        sectionId: selectedRow.sectionId,
        subjectId: Number(formData.subjectId),
        teacherStaffId: Number(formData.teacherStaffId),
      };

      setAssignments([...assignments, newAssignment]);
    }

    setFormData({
      subjectId: "",
      teacherStaffId: "",
    });

    alert("Subject teacher assigned successfully");
  };

  const handleDeleteAssignment = (assignmentId) => {
    const ok = window.confirm("Delete selected subject teacher assignment?");
    if (!ok) return;

    setAssignments(assignments.filter((item) => item.id !== assignmentId));
  };

  return (
    <div className="subject-teacher-assignment-page">
      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => (window.location.href = "/user-control")}
        >
          ←
        </AppButton>

        <div>
          <h1>Subject Teacher Assignment</h1>
          <p>Assign subject teachers class and section wise</p>
        </div>
      </div>

      <div className="common-card">
        <h2>Filter Records</h2>

        <div className="assignment-filter-grid">
          <div className="form-group">
            <label>Class</label>

            <select
              value={filterClassId}
              onChange={(e) => setFilterClassId(e.target.value)}
            >
              <option value="">All Classes</option>

              {schoolClasses.map((item) => (
                <option key={item.id} value={item.id}>
                  Class {item.className}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="common-card">
        <div className="list-header">
          <h2>Subject Teacher Assignment List</h2>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Class Name</th>
                <th>Section Name</th>
                <th>Subjects</th>
                <th>Assigned</th>
                <th>Assign Teachers</th>
              </tr>
            </thead>

            <tbody>
              {classSectionRows.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-row">
                    No class section found
                  </td>
                </tr>
              ) : (
                classSectionRows.map((row, index) => {
                  const totalSubjects = getMappedSubjects(row.classId).length;

                  const assignedCount = getAssignmentsForRow(
                    row.classId,
                    row.sectionId
                  ).length;

                  return (
                    <tr key={`${row.classId}-${row.sectionId}`}>
                      <td>{index + 1}</td>
                      <td>Class {row.className}</td>
                      <td>{row.sectionName}</td>
                      <td>{totalSubjects}</td>
                      <td>{assignedCount}</td>
                      <td>
                        <button
                          className="assign-icon-btn"
                          onClick={() => openAssignPopup(row)}
                          title="Assign Subject Teacher"
                        >
                          ⚙
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showPopup && selectedRow && (
        <div className="popup-overlay">
          <div className="assignment-popup">
            <div className="popup-head">
              <h2>Assign Subject Teacher</h2>

              <button className="popup-close-btn" onClick={closePopup}>
                ×
              </button>
            </div>

            <div className="readonly-info-box">
              <p>
                <strong>Class:</strong> Class {selectedRow.className}
              </p>

              <p>
                <strong>Section:</strong> {selectedRow.sectionName}
              </p>
            </div>

            <div className="popup-form-grid">
              <div className="form-group">
                <label>Subject *</label>

                <select
                  value={formData.subjectId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      subjectId: e.target.value,
                    })
                  }
                >
                  <option value="">Select Subject</option>

                  {getAvailableSubjects().map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.subjectName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Subject Teacher *</label>

                <select
                  value={formData.teacherStaffId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      teacherStaffId: e.target.value,
                    })
                  }
                >
                  <option value="">Select Subject Teacher</option>

                  {teachingStaff.map((staff) => (
                    <option key={staff.id} value={staff.id}>
                      {staff.employeeName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="popup-actions">
              <AppButton type="primary" onClick={handleSaveAssignment}>
                Save
              </AppButton>
            </div>

            <div className="assigned-subject-list">
              <h3>Assigned Subject List</h3>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Del</th>
                      <th>Subject Name</th>
                      <th>Teacher Name</th>
                    </tr>
                  </thead>

                  <tbody>
                    {getAssignmentsForRow(
                      selectedRow.classId,
                      selectedRow.sectionId
                    ).length === 0 ? (
                      <tr>
                        <td colSpan="3" className="empty-row">
                          No subject teacher assigned
                        </td>
                      </tr>
                    ) : (
                      getAssignmentsForRow(
                        selectedRow.classId,
                        selectedRow.sectionId
                      ).map((assignment) => (
                        <tr key={assignment.id}>
                          <td>
                            <button
                              className="delete-icon-btn"
                              onClick={() =>
                                handleDeleteAssignment(assignment.id)
                              }
                              title="Delete Assignment"
                            >
                              🗑
                            </button>
                          </td>

                          <td>{getSubjectName(assignment.subjectId)}</td>

                          <td>{getStaffName(assignment.teacherStaffId)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="popup-actions">
              <AppButton type="secondary" onClick={closePopup}>
                Close
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubjectTeacherAssignment;