import React, { useState, useEffect } from "react";
import "./subjectTeacherAssignment.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { userControlService } from "../services/api";

function SubjectTeacherAssignment() {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachingStaff, setTeachingStaff] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [filterClassId, setFilterClassId] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const [formData, setFormData] = useState({
    subjectId: "",
    teacherStaffId: "",
  });

  /* ===============================
     Fetch Data (Optimized: single initial load)
  =============================== */
  const fetchData = async () => {
    try {
      setLoading(true);
      const [metaRes, assignRes] = await Promise.all([
        userControlService.getMeta(),
        userControlService.getSubjectTeachers(),
      ]);

      if (metaRes.data?.success) {
        setClasses(metaRes.data.data.classes || []);
        setSubjects(metaRes.data.data.subjects || []);
        setTeachingStaff(metaRes.data.data.teachingStaff || []);
      }

      if (assignRes.data?.success) {
        setAssignments(assignRes.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load subject teacher assignment data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ===============================
     Construct Rows
  =============================== */
  const classSectionRows = classes
    .flatMap((cls) => {
      const clsId = cls._id || cls.id;
      const sections = cls.sections || [];
      return sections.map((sec) => ({
        classId: clsId,
        sectionId: sec._id || sec.id || sec.sectionName,
        className: cls.className,
        sectionName: sec.sectionName,
      }));
    })
    .filter((item) => !filterClassId || String(item.classId) === String(filterClassId));

  const getSubjectName = (subjectObjOrId) => {
    if (!subjectObjOrId) return "-";
    if (typeof subjectObjOrId === "object" && subjectObjOrId.subjectName) {
      return subjectObjOrId.subjectName;
    }
    const subject = subjects.find(
      (item) => String(item._id || item.id) === String(subjectObjOrId)
    );
    return subject?.subjectName || "-";
  };

  const getStaffName = (staffObjOrId) => {
    if (!staffObjOrId) return "-";
    if (typeof staffObjOrId === "object" && staffObjOrId.employeeName) {
      return staffObjOrId.employeeName;
    }
    const staff = teachingStaff.find(
      (item) => String(item._id || item.id) === String(staffObjOrId)
    );
    return staff?.employeeName || "-";
  };

  const getAssignmentsForRow = (classId, sectionId) => {
    return assignments.filter((item) => {
      const itemCls = item.classId?._id || item.classId;
      return (
        String(itemCls) === String(classId) &&
        String(item.sectionId) === String(sectionId)
      );
    });
  };

  const getAvailableSubjects = () => {
    if (!selectedRow) return [];

    const assignedSubjectIds = getAssignmentsForRow(
      selectedRow.classId,
      selectedRow.sectionId
    ).map((item) => String(item.subjectId?._id || item.subjectId));

    return subjects.filter(
      (subject) =>
        !assignedSubjectIds.includes(String(subject._id || subject.id))
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

  const handleSaveAssignment = async () => {
    if (!formData.subjectId) {
      alert("Please select subject");
      return;
    }

    if (!formData.teacherStaffId) {
      alert("Please select subject teacher");
      return;
    }

    try {
      const res = await userControlService.assignSubjectTeacher({
        classId: selectedRow.classId,
        sectionId: selectedRow.sectionId,
        sectionName: selectedRow.sectionName,
        subjectId: formData.subjectId,
        teacherStaffId: formData.teacherStaffId,
      });

      if (res.data?.success) {
        alert("Subject teacher assigned successfully");
        const updatedAssignment = res.data.data;
        setAssignments((prev) => {
          const filtered = prev.filter((item) => {
            const itemCls = item.classId?._id || item.classId;
            const itemSub = item.subjectId?._id || item.subjectId;
            return !(
              String(itemCls) === String(selectedRow.classId) &&
              String(item.sectionId) === String(selectedRow.sectionId) &&
              String(itemSub) === String(formData.subjectId)
            );
          });
          return [...filtered, updatedAssignment];
        });

        setFormData({
          subjectId: "",
          teacherStaffId: "",
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign subject teacher");
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    const ok = window.confirm("Delete this subject teacher assignment?");
    if (!ok) return;

    try {
      await userControlService.deleteSubjectTeacher(assignmentId);
      setAssignments((prev) =>
        prev.filter((item) => (item._id || item.id) !== assignmentId)
      );
      alert("Assignment deleted successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete assignment");
    }
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
          <p>Assign subject teachers section wise</p>
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
              {classes.map((item) => {
                const cId = item._id || item.id;
                return (
                  <option key={cId} value={cId}>
                    Class {item.className}
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </div>

      <div className="common-card">
        <div className="list-header">
          <h2>Assignment List</h2>
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
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ padding: "4px 0", border: "none" }}>
                    <SkeletonTable rows={5} columns={6} />
                  </td>
                </tr>
              ) : classSectionRows.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-row">
                    No class section found
                  </td>
                </tr>
              ) : (
                classSectionRows.map((row, index) => {
                  const assignedCount = getAssignmentsForRow(
                    row.classId,
                    row.sectionId
                  ).length;

                  return (
                    <tr key={`${row.classId}-${row.sectionId}`}>
                      <td>{index + 1}</td>
                      <td>Class {row.className}</td>
                      <td>{row.sectionName}</td>
                      <td>{subjects.length}</td>
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
                  {getAvailableSubjects().map((subject) => {
                    const subId = subject._id || subject.id;
                    return (
                      <option key={subId} value={subId}>
                        {subject.subjectName}{" "}
                        {subject.subjectCode ? `(${subject.subjectCode})` : ""}
                      </option>
                    );
                  })}
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
                  {teachingStaff.map((staff) => {
                    const sId = staff._id || staff.id;
                    return (
                      <option key={sId} value={sId}>
                        {staff.employeeName} ({staff.employeeCode || "STAFF"})
                      </option>
                    );
                  })}
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
                      ).map((assignment) => {
                        const aId = assignment._id || assignment.id;
                        return (
                          <tr key={aId}>
                            <td>
                              <button
                                className="del-btn"
                                onClick={() =>
                                  handleDeleteAssignment(aId)
                                }
                                title="Delete Assignment"
                              >
                                ✕
                              </button>
                            </td>
                            <td>{getSubjectName(assignment.subjectId)}</td>
                            <td>
                              {getStaffName(assignment.teacherStaffId)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SubjectTeacherAssignment;