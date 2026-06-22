import React, { useState } from "react";
import "./classTeacherAssignment.css";
import AppButton from "../components/AppButton";

function ClassTeacherAssignment() {
  const schoolId =
    localStorage.getItem("schoolId") ||
    "SCH001";

  const classes = [
    { id: 1, schoolId: "SCH001", className: "9" },
    { id: 2, schoolId: "SCH001", className: "10" },
  ];

  const sections = [
    { id: 1, schoolId: "SCH001", classId: 1, sectionName: "A" },
    { id: 2, schoolId: "SCH001", classId: 1, sectionName: "B" },
    { id: 3, schoolId: "SCH001", classId: 2, sectionName: "A" },
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

  const [filterClassId, setFilterClassId] =
    useState("");

  const [showPopup, setShowPopup] =
    useState(false);

  const [selectedRow, setSelectedRow] =
    useState(null);

  const [teacherForm, setTeacherForm] =
    useState({
      classTeacher1Id: "",
      classTeacher2Id: "",
    });

  const [assignments, setAssignments] =
    useState([
      {
        id: 1,
        schoolId: "SCH001",
        classId: 1,
        sectionId: 1,
        classTeacher1Id: 1,
        classTeacher2Id: 2,
      },
    ]);

  const schoolClasses =
    classes.filter(
      (item) =>
        item.schoolId === schoolId
    );

  const schoolSections =
    sections.filter(
      (item) =>
        item.schoolId === schoolId
    );

  const teachingStaff =
    staffList.filter(
      (item) =>
        item.schoolId === schoolId &&
        item.teachingStaff === "Yes" &&
        item.isActive
    );

  const classSectionRows =
    schoolSections
      .map((section) => {
        const classInfo =
          schoolClasses.find(
            (cls) =>
              cls.id === section.classId
          );

        return {
          classId: section.classId,
          sectionId: section.id,
          className:
            classInfo?.className || "",
          sectionName:
            section.sectionName,
        };
      })
      .filter(
        (item) =>
          !filterClassId ||
          item.classId ===
            Number(filterClassId)
      );

  const getAssignment = (
    classId,
    sectionId
  ) => {
    return assignments.find(
      (item) =>
        item.schoolId === schoolId &&
        item.classId === classId &&
        item.sectionId === sectionId
    );
  };

  const getStaffName = (staffId) => {
    const staff =
      staffList.find(
        (item) =>
          item.id === staffId
      );

    return staff?.employeeName || "-";
  };

  const openAssignPopup = (row) => {
    const existing =
      getAssignment(
        row.classId,
        row.sectionId
      );

    setSelectedRow(row);

    setTeacherForm({
      classTeacher1Id:
        existing?.classTeacher1Id || "",
      classTeacher2Id:
        existing?.classTeacher2Id || "",
    });

    setShowPopup(true);
  };

  const handleAssign = () => {
    if (
      teacherForm.classTeacher1Id &&
      teacherForm.classTeacher2Id &&
      teacherForm.classTeacher1Id ===
        teacherForm.classTeacher2Id
    ) {
      alert(
        "Class Teacher I and Class Teacher II cannot be same"
      );
      return;
    }

    const existing =
      getAssignment(
        selectedRow.classId,
        selectedRow.sectionId
      );

    if (existing) {
      setAssignments(
        assignments.map((item) =>
          item.id === existing.id
            ? {
                ...item,
                classTeacher1Id:
                  teacherForm.classTeacher1Id,
                classTeacher2Id:
                  teacherForm.classTeacher2Id,
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
        classTeacher1Id:
          teacherForm.classTeacher1Id,
        classTeacher2Id:
          teacherForm.classTeacher2Id,
      };

      setAssignments([
        ...assignments,
        newAssignment,
      ]);
    }

    alert(
      "Class teacher assigned successfully"
    );

    setShowPopup(false);
    setSelectedRow(null);

    setTeacherForm({
      classTeacher1Id: "",
      classTeacher2Id: "",
    });
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedRow(null);

    setTeacherForm({
      classTeacher1Id: "",
      classTeacher2Id: "",
    });
  };

  return (
    <div className="class-teacher-assignment-page">
      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() =>
            (window.location.href =
              "/user-control")
          }
        >
          ←
        </AppButton>

        <div>
          <h1>
            Class Teacher Assignment
          </h1>

          <p>
            Assign class teachers section wise
          </p>
        </div>
      </div>

      <div className="common-card">
        <h2>
          Filter Records
        </h2>

        <div className="assignment-filter-grid">
          <div className="form-group">
            <label>
              Class
            </label>

            <select
              value={filterClassId}
              onChange={(e) =>
                setFilterClassId(
                  e.target.value
                )
              }
            >
              <option value="">
                All Classes
              </option>

              {schoolClasses.map(
                (item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    Class {item.className}
                  </option>
                )
              )}
            </select>
          </div>
        </div>
      </div>

      <div className="common-card">
        <div className="list-header">
          <h2>
            Assignment List
          </h2>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Class Name</th>
                <th>Section Name</th>
                <th>Class Teacher I</th>
                <th>Class Teacher II</th>
                <th>Assign</th>
              </tr>
            </thead>

            <tbody>
              {classSectionRows.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="empty-row"
                  >
                    No class section found
                  </td>
                </tr>
              ) : (
                classSectionRows.map(
                  (row, index) => {
                    const assignment =
                      getAssignment(
                        row.classId,
                        row.sectionId
                      );

                    return (
                      <tr
                        key={`${row.classId}-${row.sectionId}`}
                      >
                        <td>{index + 1}</td>

                        <td>
                          Class {row.className}
                        </td>

                        <td>
                          {row.sectionName}
                        </td>

                        <td>
                          {assignment?.classTeacher1Id
                            ? getStaffName(
                                Number(
                                  assignment.classTeacher1Id
                                )
                              )
                            : "-"}
                        </td>

                        <td>
                          {assignment?.classTeacher2Id
                            ? getStaffName(
                                Number(
                                  assignment.classTeacher2Id
                                )
                              )
                            : "-"}
                        </td>

                        <td>
                          <button
                            className="assign-icon-btn"
                            onClick={() =>
                              openAssignPopup(row)
                            }
                            title="Assign Class Teacher"
                          >
                            ⚙
                          </button>
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showPopup && selectedRow && (
        <div className="popup-overlay">
          <div className="assignment-popup">
            <div className="popup-head">
              <h2>
                Assign Class Teacher
              </h2>

              <button
                className="popup-close-btn"
                onClick={closePopup}
              >
                ×
              </button>
            </div>

            <div className="readonly-info-box">
              <p>
                <strong>Class:</strong>{" "}
                Class {selectedRow.className}
              </p>

              <p>
                <strong>Section:</strong>{" "}
                {selectedRow.sectionName}
              </p>
            </div>

            <div className="form-group">
              <label>
                Class Teacher I
              </label>

              <select
                value={
                  teacherForm.classTeacher1Id
                }
                onChange={(e) =>
                  setTeacherForm({
                    ...teacherForm,
                    classTeacher1Id:
                      e.target.value,
                  })
                }
              >
                <option value="">
                  Select Class Teacher
                </option>

                {teachingStaff.map(
                  (staff) => (
                    <option
                      key={staff.id}
                      value={staff.id}
                    >
                      {staff.employeeName}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="form-group">
              <label>
                Class Teacher II
              </label>

              <select
                value={
                  teacherForm.classTeacher2Id
                }
                onChange={(e) =>
                  setTeacherForm({
                    ...teacherForm,
                    classTeacher2Id:
                      e.target.value,
                  })
                }
              >
                <option value="">
                  Select Class Teacher
                </option>

                {teachingStaff.map(
                  (staff) => (
                    <option
                      key={staff.id}
                      value={staff.id}
                    >
                      {staff.employeeName}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="popup-actions">
              <AppButton
                type="primary"
                onClick={handleAssign}
              >
                Assign
              </AppButton>

              <AppButton
                type="secondary"
                onClick={closePopup}
              >
                Cancel
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClassTeacherAssignment;