import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./studentSubjectMapping.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { academicService } from "../services/api";

function StudentSubjectMapping() {
  const navigate = useNavigate();

  const [loadingMeta, setLoadingMeta] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [loadingMappings, setLoadingMappings] = useState(false);

  const [classes, setClasses] = useState([]);
  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [sectionsList, setSectionsList] = useState([]);

  // Students loaded for the selected class & section
  const [students, setStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [classSubjects, setClassSubjects] = useState({
    scholasticSubjects: [],
    coScholasticSubjects: [],
  });

  // Saved mappings table
  const [savedMappings, setSavedMappings] = useState([]);
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Assign modal state
  const [showPopup, setShowPopup] = useState(false);
  const [selectedScholastic, setSelectedScholastic] = useState([]);
  const [selectedCoScholastic, setSelectedCoScholastic] = useState([]);
  const [assignTargetStudents, setAssignTargetStudents] = useState([]);

  /* ===============================
     1. Load Metadata (Classes)
  =============================== */
  const hasFetchedMeta = React.useRef(false);

  useEffect(() => {
    if (hasFetchedMeta.current) return;
    hasFetchedMeta.current = true;

    const loadMeta = async () => {
      try {
        setLoadingMeta(true);
        const res = await academicService.getMeta();
        if (res.data?.success) {
          setClasses(res.data.data.classes || []);
        }
      } catch (err) {
        console.error("Failed to load academic meta:", err);
      } finally {
        setLoadingMeta(false);
      }
    };
    loadMeta();
  }, []);

  /* ===============================
     2. Class / Section Change
  =============================== */
  const handleClassChange = (selected) => {
    setClassName(selected);
    setSection("");
    setStudents([]);
    setSelectedStudentIds([]);
    setSavedMappings([]);
    setSelectedRowIds([]);

    const classObj = classes.find((c) => c.className === selected);
    if (classObj && Array.isArray(classObj.sections)) {
      setSectionsList(classObj.sections.map((s) => s.sectionName || s));
    } else {
      setSectionsList([]);
    }
  };

  /* ===============================
     3. Load Students for Class & Section
  =============================== */
  const loadStudents = async () => {
    if (!className || !section) {
      alert("Please select both Class and Section");
      return;
    }

    try {
      setLoadingStudents(true);
      setLoadingMappings(true);

      const [studRes, mapRes] = await Promise.all([
        academicService.getStudentsForMapping({ className, section }),
        academicService.getStudentSubjectMappings({ className, section }),
      ]);

      if (studRes.data?.success) {
        setStudents(studRes.data.data.students || []);
        setClassSubjects(studRes.data.data.classSubjects || { scholasticSubjects: [], coScholasticSubjects: [] });
      }

      if (mapRes.data?.success) {
        setSavedMappings(mapRes.data.data || []);
      }

      setSelectedStudentIds([]);
      setSelectedRowIds([]);
    } catch (err) {
      console.error("Failed to load students:", err);
      alert(err.response?.data?.message || "Failed to load students for mapping");
    } finally {
      setLoadingStudents(false);
      setLoadingMappings(false);
    }
  };

  /* ===============================
     4. Student Selection Handlers
  =============================== */
  const toggleStudent = (id) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const toggleSelectAllStudents = () => {
    if (selectedStudentIds.length === students.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map((s) => s.studentId || s._id));
    }
  };

  /* ===============================
     5. Open Assignment Popup
  =============================== */
  const openAssignPopup = (singleStudent = null) => {
    let targets = [];

    if (singleStudent) {
      targets = [singleStudent];
    } else {
      if (selectedStudentIds.length === 0) {
        alert("Please select at least one student to assign subjects");
        return;
      }
      targets = students.filter((s) =>
        selectedStudentIds.includes(s.studentId || s._id)
      );
    }

    if (targets.length === 0) return;

    if (
      (!classSubjects.scholasticSubjects || classSubjects.scholasticSubjects.length === 0) &&
      (!classSubjects.coScholasticSubjects || classSubjects.coScholasticSubjects.length === 0)
    ) {
      alert(
        `No subjects have been mapped to Class '${className}' yet. Please map subjects in Class Subject Mapping first.`
      );
      return;
    }

    setAssignTargetStudents(targets);

    // If single student with existing mapping, prefill their mapped subjects
    if (targets.length === 1 && targets[0].isMapped) {
      setSelectedScholastic(targets[0].scholasticSubjects || []);
      setSelectedCoScholastic(targets[0].coScholasticSubjects || []);
    } else {
      // Default to all class subjects
      setSelectedScholastic([...(classSubjects.scholasticSubjects || [])]);
      setSelectedCoScholastic([...(classSubjects.coScholasticSubjects || [])]);
    }

    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setAssignTargetStudents([]);
    setSelectedScholastic([]);
    setSelectedCoScholastic([]);
  };

  const toggleScholastic = (sub) => {
    setSelectedScholastic((prev) =>
      prev.includes(sub) ? prev.filter((item) => item !== sub) : [...prev, sub]
    );
  };

  const toggleCoScholastic = (sub) => {
    setSelectedCoScholastic((prev) =>
      prev.includes(sub) ? prev.filter((item) => item !== sub) : [...prev, sub]
    );
  };

  /* ===============================
     6. Save Assignment to DB
  =============================== */
  const handleSaveAssignment = async () => {
    if (selectedScholastic.length === 0 && selectedCoScholastic.length === 0) {
      alert("Please select at least one subject to assign");
      return;
    }

    try {
      const payload = {
        students: assignTargetStudents.map((s) => ({
          studentId: s.studentId || s._id,
          admissionNo: s.admissionNo || "",
          studentName: s.studentName || "",
          className: s.className || className,
          section: s.section || section,
          rollNo: s.rollNo || "",
        })),
        scholasticSubjects: selectedScholastic,
        coScholasticSubjects: selectedCoScholastic,
      };

      const res = await academicService.bulkAssignStudentSubjects(payload);
      if (res.data?.success) {
        alert(res.data.message || "Subjects assigned successfully");
        closePopup();
        // Refresh mapping and student statuses
        loadStudents();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign subjects");
    }
  };

  /* ===============================
     7. Table Mapping Handlers (Edit/Delete)
  =============================== */
  const handleEditMapping = () => {
    if (selectedRowIds.length !== 1) {
      alert("Please select exactly one mapping to edit");
      return;
    }

    const mapId = selectedRowIds[0];
    const mapping = savedMappings.find((m) => (m._id || m.id) === mapId);
    if (!mapping) return;

    const studentRecord = students.find(
      (s) => (s.studentId || s._id).toString() === mapping.studentId.toString()
    ) || {
      studentId: mapping.studentId,
      _id: mapping.studentId,
      studentName: mapping.studentName,
      admissionNo: mapping.admissionNo,
      className: mapping.className,
      section: mapping.section,
      rollNo: mapping.rollNo,
      isMapped: true,
      scholasticSubjects: mapping.scholasticSubjects,
      coScholasticSubjects: mapping.coScholasticSubjects,
    };

    openAssignPopup(studentRecord);
    setSelectedRowIds([]);
  };

  const handleDeleteMapping = async () => {
    if (selectedRowIds.length === 0) {
      alert("Please select at least one mapping to delete");
      return;
    }

    const ok = window.confirm(
      `Delete ${selectedRowIds.length} selected student subject mapping(s)?`
    );
    if (!ok) return;

    try {
      await academicService.bulkDeleteStudentSubjectMappings(selectedRowIds);
      alert("Mapping(s) deleted successfully");
      loadStudents();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete mapping(s)");
    }
  };

  const handleRowSelect = (id) => {
    setSelectedRowIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllRows = (e) => {
    if (e.target.checked) {
      setSelectedRowIds(filteredMappings.map((m) => m._id || m.id));
    } else {
      setSelectedRowIds([]);
    }
  };

  const filteredMappings = savedMappings.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const scholStr = (item.scholasticSubjects || []).join(" ").toLowerCase();
    const coScholStr = (item.coScholasticSubjects || []).join(" ").toLowerCase();
    return (
      (item.studentName || "").toLowerCase().includes(q) ||
      (item.admissionNo || "").toLowerCase().includes(q) ||
      (item.rollNo || "").toLowerCase().includes(q) ||
      scholStr.includes(q) ||
      coScholStr.includes(q)
    );
  });

  return (
    <div className="student-subject-page">
      <div className="common-page-header">
        <AppButton type="back" onClick={() => navigate("/academic-zone")}>
          ←
        </AppButton>

        <div>
          <h1>Student Subject Mapping</h1>
          <p>Assign and personalize subjects for individual students</p>
        </div>
      </div>

      {/* Class & Section Selection Card */}
      <div className="common-card">
        <h2>Select Class & Section</h2>

        <div className="mapping-filter-grid">
          <div className="form-group">
            <label>Class *</label>
            <select
              value={className}
              onChange={(e) => handleClassChange(e.target.value)}
              disabled={loadingMeta}
            >
              <option value="">-- Select Class --</option>
              {classes.map((cls) => (
                <option value={cls.className} key={cls._id || cls.className}>
                  {cls.className}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Section *</label>
            <select
              value={section}
              onChange={(e) => setSection(e.target.value)}
              disabled={!className}
            >
              <option value="">-- Select Section --</option>
              {sectionsList.map((sec, idx) => (
                <option value={sec} key={idx}>
                  Section {sec}
                </option>
              ))}
            </select>
          </div>
        </div>

        {classes.length === 0 && !loadingMeta && (
          <p style={{ color: "#d97706", fontSize: "13px", marginTop: "10px" }}>
            ⚠️ No classes found. Please create classes in Student Hub first.
          </p>
        )}

        <div className="form-actions" style={{ marginTop: "16px" }}>
          <AppButton
            type="primary"
            onClick={loadStudents}
            disabled={!className || !section || loadingStudents}
          >
            {loadingStudents ? "Loading..." : "Load Students"}
          </AppButton>
        </div>
      </div>

      {/* Students for Assignment Table */}
      {className && section && (
        <div className="common-card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <div>
              <h2 style={{ margin: 0 }}>
                Enrolled Students ({students.length})
              </h2>
              <small style={{ color: "#6b7280" }}>
                Class: {className} | Section: {section}
              </small>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <AppButton
                type="primary"
                onClick={() => openAssignPopup()}
                disabled={selectedStudentIds.length === 0}
              >
                Assign Subjects ({selectedStudentIds.length})
              </AppButton>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ width: "45px" }}>
                    <input
                      type="checkbox"
                      checked={
                        students.length > 0 &&
                        selectedStudentIds.length === students.length
                      }
                      onChange={toggleSelectAllStudents}
                    />
                  </th>
                  <th style={{ width: "60px" }}>S.No</th>
                  <th>Admission No</th>
                  <th>Student Name</th>
                  <th>Roll No</th>
                  <th>Mapping Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loadingStudents ? (
                  <tr>
                    <td colSpan="7" style={{ padding: "4px 0", border: "none" }}>
                      <SkeletonTable rows={4} columns={7} />
                    </td>
                  </tr>
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-row">
                      No active students found in Class {className} - Section {section}
                    </td>
                  </tr>
                ) : (
                  students.map((student, index) => {
                    const sid = student.studentId || student._id;
                    const isSelected = selectedStudentIds.includes(sid);
                    return (
                      <tr key={sid}>
                        <td>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleStudent(sid)}
                          />
                        </td>
                        <td>{index + 1}</td>
                        <td style={{ fontWeight: "500" }}>{student.admissionNo}</td>
                        <td style={{ fontWeight: "600" }}>{student.studentName}</td>
                        <td>{student.rollNo || "-"}</td>
                        <td>
                          {student.isMapped ? (
                            <span
                              style={{
                                background: "#dcfce7",
                                color: "#15803d",
                                padding: "3px 8px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "600",
                              }}
                            >
                              ✓ Mapped ({((student.scholasticSubjects || []).length) + ((student.coScholasticSubjects || []).length)} subjects)
                            </span>
                          ) : (
                            <span
                              style={{
                                background: "#fee2e2",
                                color: "#b91c1c",
                                padding: "3px 8px",
                                borderRadius: "6px",
                                fontSize: "12px",
                                fontWeight: "600",
                              }}
                            >
                              Not Mapped
                            </span>
                          )}
                        </td>
                        <td>
                          <AppButton
                            type="primary"
                            style={{ padding: "4px 10px", fontSize: "12px" }}
                            onClick={() => openAssignPopup(student)}
                          >
                            {student.isMapped ? "Edit Mapping" : "Assign"}
                          </AppButton>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mapped Students List */}
      <div className="common-card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>Mapped Students Directory</h2>
            <small style={{ color: "#6b7280" }}>
              {savedMappings.length} record(s) currently mapped
            </small>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Search mapped students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid #d1d5db",
                fontSize: "14px",
                outline: "none",
                minWidth: "180px",
              }}
            />

            <div style={{ display: "flex", gap: "8px" }}>
              <AppButton type="primary" onClick={handleEditMapping}>
                Edit
              </AppButton>
              <AppButton type="delete" onClick={handleDeleteMapping}>
                Delete
              </AppButton>
            </div>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: "45px" }}>
                  <input
                    type="checkbox"
                    checked={
                      filteredMappings.length > 0 &&
                      selectedRowIds.length === filteredMappings.length
                    }
                    onChange={handleSelectAllRows}
                  />
                </th>
                <th style={{ width: "50px" }}>S.No</th>
                <th>Admission No</th>
                <th>Student Name</th>
                <th>Class</th>
                <th>Section</th>
                <th>Roll No</th>
                <th>Scholastic Subjects</th>
                <th>Co-Scholastic Subjects</th>
              </tr>
            </thead>

            <tbody>
              {loadingMappings ? (
                <tr>
                  <td colSpan="9" style={{ padding: "4px 0", border: "none" }}>
                    <SkeletonTable rows={4} columns={9} />
                  </td>
                </tr>
              ) : filteredMappings.length === 0 ? (
                <tr>
                  <td colSpan="9" className="empty-row">
                    {searchQuery
                      ? "No records match your search"
                      : "No student subject mappings found. Load a class & section above to assign subjects."}
                  </td>
                </tr>
              ) : (
                filteredMappings.map((item, index) => {
                  const mId = item._id || item.id;
                  return (
                    <tr key={mId}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedRowIds.includes(mId)}
                          onChange={() => handleRowSelect(mId)}
                        />
                      </td>
                      <td>{index + 1}</td>
                      <td style={{ fontWeight: "500" }}>{item.admissionNo}</td>
                      <td style={{ fontWeight: "600" }}>{item.studentName}</td>
                      <td>{item.className}</td>
                      <td>{item.section}</td>
                      <td>{item.rollNo || "-"}</td>
                      <td className="subject-column">
                        {item.scholasticSubjects && item.scholasticSubjects.length > 0 ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {item.scholasticSubjects.map((sub, sIdx) => (
                              <span
                                key={sIdx}
                                style={{
                                  background: "#eff6ff",
                                  color: "#1d4ed8",
                                  padding: "2px 7px",
                                  borderRadius: "5px",
                                  fontSize: "11px",
                                  fontWeight: "500",
                                }}
                              >
                                {sub}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: "#9ca3af", fontStyle: "italic" }}>None</span>
                        )}
                      </td>
                      <td className="subject-column">
                        {item.coScholasticSubjects && item.coScholasticSubjects.length > 0 ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {item.coScholasticSubjects.map((sub, cIdx) => (
                              <span
                                key={cIdx}
                                style={{
                                  background: "#fdf4ff",
                                  color: "#9333ea",
                                  padding: "2px 7px",
                                  borderRadius: "5px",
                                  fontSize: "11px",
                                  fontWeight: "500",
                                }}
                              >
                                {sub}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: "#9ca3af", fontStyle: "italic" }}>None</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===============================
          Assignment Modal Popup
      =============================== */}
      {showPopup && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="popup-box" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h3>
                Assign Subjects to {assignTargetStudents.length} Student(s)
              </h3>
              <button className="popup-close-btn" onClick={closePopup}>
                ✕
              </button>
            </div>

            <div style={{ marginBottom: "14px", padding: "10px 14px", background: "#f8fafc", borderRadius: "10px", fontSize: "13px", color: "#475569" }}>
              <strong>Class:</strong> {className} | <strong>Section:</strong> {section}
              {assignTargetStudents.length === 1 && (
                <span> | <strong>Student:</strong> {assignTargetStudents[0].studentName} ({assignTargetStudents[0].admissionNo})</span>
              )}
            </div>

            <div className="popup-content">
              {/* Scholastic subjects from Class mapping */}
              <div className="subject-category-block">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <h4 style={{ margin: 0, color: "#1e3a8a" }}>
                    📘 Scholastic Subjects ({selectedScholastic.length} selected)
                  </h4>
                  {classSubjects.scholasticSubjects.length > 0 && (
                    <label style={{ fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                      <input
                        type="checkbox"
                        checked={
                          selectedScholastic.length > 0 &&
                          selectedScholastic.length === classSubjects.scholasticSubjects.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedScholastic([...classSubjects.scholasticSubjects]);
                          } else {
                            setSelectedScholastic([]);
                          }
                        }}
                      />
                      Select All
                    </label>
                  )}
                </div>

                {classSubjects.scholasticSubjects.length === 0 ? (
                  <p style={{ color: "#6b7280", fontStyle: "italic", fontSize: "13px" }}>
                    No scholastic subjects mapped to this class.
                  </p>
                ) : (
                  <div className="subject-checkbox-grid">
                    {classSubjects.scholasticSubjects.map((subName) => {
                      const isChecked = selectedScholastic.includes(subName);
                      return (
                        <label
                          key={subName}
                          className={`subject-checkbox-item ${isChecked ? "checked" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleScholastic(subName)}
                          />
                          <span>{subName}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Co-Scholastic subjects from Class mapping */}
              <div className="subject-category-block" style={{ marginTop: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <h4 style={{ margin: 0, color: "#581c87" }}>
                    🧩 Co-Scholastic Subjects ({selectedCoScholastic.length} selected)
                  </h4>
                  {classSubjects.coScholasticSubjects.length > 0 && (
                    <label style={{ fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                      <input
                        type="checkbox"
                        checked={
                          selectedCoScholastic.length > 0 &&
                          selectedCoScholastic.length === classSubjects.coScholasticSubjects.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCoScholastic([...classSubjects.coScholasticSubjects]);
                          } else {
                            setSelectedCoScholastic([]);
                          }
                        }}
                      />
                      Select All
                    </label>
                  )}
                </div>

                {classSubjects.coScholasticSubjects.length === 0 ? (
                  <p style={{ color: "#6b7280", fontStyle: "italic", fontSize: "13px" }}>
                    No co-scholastic subjects mapped to this class.
                  </p>
                ) : (
                  <div className="subject-checkbox-grid">
                    {classSubjects.coScholasticSubjects.map((subName) => {
                      const isChecked = selectedCoScholastic.includes(subName);
                      return (
                        <label
                          key={subName}
                          className={`subject-checkbox-item ${isChecked ? "checked" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCoScholastic(subName)}
                          />
                          <span>{subName}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="popup-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px", paddingTop: "14px", borderTop: "1px solid #e5e7eb" }}>
              <AppButton type="secondary" onClick={closePopup}>
                Cancel
              </AppButton>
              <AppButton type="primary" onClick={handleSaveAssignment}>
                Confirm & Assign
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentSubjectMapping;