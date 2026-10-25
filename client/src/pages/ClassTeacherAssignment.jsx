import React, { useState, useEffect } from "react";
import "./classTeacherAssignment.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { userControlService } from "../services/api";

function ClassTeacherAssignment() {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [teachingStaff, setTeachingStaff] = useState([]);
  const [assignments, setAssignments] = useState([]);

  const [filterClassId, setFilterClassId] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const [teacherForm, setTeacherForm] = useState({
    classTeacher1Id: "",
    classTeacher2Id: "",
  });

  /* ===============================
     Fetch Data (Optimized: single initial load)
  =============================== */
  const fetchData = async () => {
    try {
      setLoading(true);
      const [metaRes, assignRes] = await Promise.all([
        userControlService.getMeta(),
        userControlService.getClassTeachers(),
      ]);

      if (metaRes.data?.success) {
        setClasses(metaRes.data.data.classes || []);
        setTeachingStaff(metaRes.data.data.teachingStaff || []);
      }

      if (assignRes.data?.success) {
        setAssignments(assignRes.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load class teacher assignments data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ===============================
     Construct Class-Section Rows
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

  const getAssignment = (classId, sectionId) => {
    return assignments.find((item) => {
      const itemClassId = item.classId?._id || item.classId;
      return (
        String(itemClassId) === String(classId) &&
        String(item.sectionId) === String(sectionId)
      );
    });
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

  const openAssignPopup = (row) => {
    const existing = getAssignment(row.classId, row.sectionId);
    setSelectedRow(row);

    setTeacherForm({
      classTeacher1Id:
        existing?.classTeacher1Id?._id || existing?.classTeacher1Id || "",
      classTeacher2Id:
        existing?.classTeacher2Id?._id || existing?.classTeacher2Id || "",
    });

    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedRow(null);
    setTeacherForm({
      classTeacher1Id: "",
      classTeacher2Id: "",
    });
  };

  const handleAssign = async () => {
    if (
      teacherForm.classTeacher1Id &&
      teacherForm.classTeacher2Id &&
      teacherForm.classTeacher1Id === teacherForm.classTeacher2Id
    ) {
      alert("Class Teacher I and Class Teacher II cannot be the same person.");
      return;
    }

    try {
      const res = await userControlService.assignClassTeacher({
        classId: selectedRow.classId,
        sectionId: selectedRow.sectionId,
        sectionName: selectedRow.sectionName,
        classTeacher1Id: teacherForm.classTeacher1Id || null,
        classTeacher2Id: teacherForm.classTeacher2Id || null,
      });

      if (res.data?.success) {
        alert("Class teacher assigned successfully");
        const updatedAssignment = res.data.data;
        setAssignments((prev) => {
          const filtered = prev.filter((item) => {
            const itemCls = item.classId?._id || item.classId;
            return !(
              String(itemCls) === String(selectedRow.classId) &&
              String(item.sectionId) === String(selectedRow.sectionId)
            );
          });
          return [...filtered, updatedAssignment];
        });
      }

      closePopup();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign class teacher");
    }
  };

  return (
    <div className="class-teacher-assignment-page">
      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => (window.location.href = "/user-control")}
        >
          ←
        </AppButton>

        <div>
          <h1>Class Teacher Assignment</h1>
          <p>Assign class teachers section wise</p>
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
                <th>Class Teacher I</th>
                <th>Class Teacher II</th>
                <th>Assign</th>
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
                  const assignment = getAssignment(
                    row.classId,
                    row.sectionId
                  );

                  return (
                    <tr key={`${row.classId}-${row.sectionId}`}>
                      <td>{index + 1}</td>
                      <td>Class {row.className}</td>
                      <td>{row.sectionName}</td>
                      <td>{getStaffName(assignment?.classTeacher1Id)}</td>
                      <td>{getStaffName(assignment?.classTeacher2Id)}</td>
                      <td>
                        <button
                          className="assign-icon-btn"
                          onClick={() => openAssignPopup(row)}
                          title="Assign Class Teacher"
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
              <h2>Assign Class Teacher</h2>
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

            <div className="form-group">
              <label>Class Teacher I</label>
              <select
                value={teacherForm.classTeacher1Id}
                onChange={(e) =>
                  setTeacherForm({
                    ...teacherForm,
                    classTeacher1Id: e.target.value,
                  })
                }
              >
                <option value="">Select Class Teacher</option>
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

            <div className="form-group">
              <label>Class Teacher II</label>
              <select
                value={teacherForm.classTeacher2Id}
                onChange={(e) =>
                  setTeacherForm({
                    ...teacherForm,
                    classTeacher2Id: e.target.value,
                  })
                }
              >
                <option value="">Select Class Teacher</option>
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

            <div className="popup-actions">
              <AppButton type="primary" onClick={handleAssign}>
                Save Assignment
              </AppButton>
              <AppButton type="secondary" onClick={closePopup}>
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