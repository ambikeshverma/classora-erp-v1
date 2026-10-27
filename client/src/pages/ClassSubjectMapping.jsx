import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./classSubjectMapping.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { academicService } from "../services/api";

function ClassSubjectMapping() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [availableScholastic, setAvailableScholastic] = useState([]);
  const [availableCoScholastic, setAvailableCoScholastic] = useState([]);
  const [savedMappings, setSavedMappings] = useState([]);

  const [selectedClass, setSelectedClass] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedScholasticSubjects, setSelectedScholasticSubjects] = useState([]);
  const [selectedCoScholasticSubjects, setSelectedCoScholasticSubjects] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);

  /* ===============================
     Initial Data Load
  =============================== */
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await academicService.getMeta();
      if (res.data?.success) {
        const { classes, scholasticSubjects, coScholasticSubjects, classSubjectMappings } = res.data.data;
        setClasses(classes || []);
        setAvailableScholastic(scholasticSubjects || []);
        setAvailableCoScholastic(coScholasticSubjects || []);
        setSavedMappings(classSubjectMappings || []);
      }
    } catch (err) {
      console.error("Failed to load academic meta:", err);
    } finally {
      setLoading(false);
    }
  };

  const hasFetched = React.useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchData();
  }, []);

  /* ===============================
     Modal Handlers
  =============================== */
  const openPopup = (clsName) => {
    const targetClass = clsName || selectedClass;
    if (!targetClass) {
      alert("Please select a class");
      return;
    }

    setSelectedClass(targetClass);

    const existing = savedMappings.find(
      (item) => item.className === targetClass
    );

    if (existing) {
      setSelectedScholasticSubjects(existing.scholasticSubjects || []);
      setSelectedCoScholasticSubjects(existing.coScholasticSubjects || []);
    } else {
      setSelectedScholasticSubjects([]);
      setSelectedCoScholasticSubjects([]);
    }

    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
    setSelectedScholasticSubjects([]);
    setSelectedCoScholasticSubjects([]);
  };

  const toggleScholasticSubject = (subjectName) => {
    setSelectedScholasticSubjects((prev) =>
      prev.includes(subjectName)
        ? prev.filter((item) => item !== subjectName)
        : [...prev, subjectName]
    );
  };

  const toggleSelectAllScholastic = (e) => {
    if (e.target.checked) {
      setSelectedScholasticSubjects(availableScholastic.map((s) => s.subjectName));
    } else {
      setSelectedScholasticSubjects([]);
    }
  };

  const toggleCoScholasticSubject = (subjectName) => {
    setSelectedCoScholasticSubjects((prev) =>
      prev.includes(subjectName)
        ? prev.filter((item) => item !== subjectName)
        : [...prev, subjectName]
    );
  };

  const toggleSelectAllCoScholastic = (e) => {
    if (e.target.checked) {
      setSelectedCoScholasticSubjects(availableCoScholastic.map((s) => s.subjectName));
    } else {
      setSelectedCoScholasticSubjects([]);
    }
  };

  const saveMapping = async () => {
    if (!selectedClass) {
      alert("Please select a class");
      return;
    }

    if (
      selectedScholasticSubjects.length === 0 &&
      selectedCoScholasticSubjects.length === 0
    ) {
      alert("Please select at least one subject to map to this class");
      return;
    }

    try {
      const classObj = classes.find((c) => c.className === selectedClass);
      const payload = {
        className: selectedClass,
        classId: classObj?._id,
        scholasticSubjects: selectedScholasticSubjects,
        coScholasticSubjects: selectedCoScholasticSubjects,
      };

      const res = await academicService.saveClassSubjectMapping(payload);
      if (res.data?.success) {
        alert("Class Subject Mapping saved successfully");
        const updatedDoc = res.data.data;
        setSavedMappings((prev) => {
          const index = prev.findIndex((m) => m.className === selectedClass);
          if (index >= 0) {
            const next = [...prev];
            next[index] = updatedDoc;
            return next;
          }
          return [...prev, updatedDoc];
        });
        closePopup();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save class subject mapping");
    }
  };

  /* ===============================
     Table Row Actions
  =============================== */
  const handleEdit = () => {
    if (selectedRows.length !== 1) {
      alert("Please select exactly one mapping to edit");
      return;
    }

    const mappingId = selectedRows[0];
    const selectedItem = savedMappings.find((m) => (m._id || m.id) === mappingId);

    if (!selectedItem) return;

    openPopup(selectedItem.className);
    setSelectedRows([]);
  };

  const handleDelete = async () => {
    if (selectedRows.length === 0) {
      alert("Please select at least one mapping to delete");
      return;
    }

    const ok = window.confirm(`Delete ${selectedRows.length} selected mapping(s)?`);
    if (!ok) return;

    try {
      for (const id of selectedRows) {
        await academicService.deleteClassSubjectMapping(id);
      }

      setSavedMappings((prev) =>
        prev.filter((m) => !selectedRows.includes(m._id || m.id))
      );
      setSelectedRows([]);
      alert("Mapping(s) deleted successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete mapping");
    }
  };

  const handleRowSelect = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(filteredMappings.map((m) => m._id || m.id));
    } else {
      setSelectedRows([]);
    }
  };

  const filteredMappings = savedMappings.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const scholStr = (item.scholasticSubjects || []).join(" ").toLowerCase();
    const coScholStr = (item.coScholasticSubjects || []).join(" ").toLowerCase();
    return (
      (item.className || "").toLowerCase().includes(q) ||
      scholStr.includes(q) ||
      coScholStr.includes(q)
    );
  });

  return (
    <div className="class-subject-page">
      <div className="common-page-header">
        <AppButton type="back" onClick={() => navigate("/academic-zone")}>
          ←
        </AppButton>

        <div>
          <h1>Class Subject Mapping</h1>
          <p>Assign subjects to classes and manage curriculum rules</p>
        </div>
      </div>

      <div className="common-card">
        <h2>Assign Subjects</h2>

        <div className="mapping-form-grid">
          <div className="form-group">
            <label style={{ marginBottom: "8px", fontWeight: "600", fontSize: "14px" }}>
              Select Class *
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              disabled={loading}
            >
              <option value="">-- Select Class --</option>
              {classes.map((cls) => (
                <option value={cls.className} key={cls._id || cls.className}>
                  {cls.className}
                </option>
              ))}
            </select>
          </div>
        </div>

        {classes.length === 0 && !loading && (
          <p style={{ color: "#d97706", fontSize: "13px", marginTop: "10px" }}>
            ⚠️ No classes found. Please create classes in Student Hub first.
          </p>
        )}

        <div className="form-actions" style={{ marginTop: "16px" }}>
          <AppButton
            type="primary"
            onClick={() => openPopup(selectedClass)}
            disabled={!selectedClass}
          >
            Assign Subjects
          </AppButton>
        </div>
      </div>

      <div className="common-card">
        <div
          className="list-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <h2>Mapping List</h2>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Search mappings..."
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

            <div className="list-action-buttons">
              <AppButton type="primary" onClick={handleEdit}>
                Edit
              </AppButton>

              <AppButton type="delete" onClick={handleDelete}>
                Delete
              </AppButton>
            </div>
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
                      filteredMappings.length > 0 &&
                      selectedRows.length === filteredMappings.length
                    }
                    onChange={handleSelectAll}
                  />
                </th>
                <th>S.No</th>
                <th>Class</th>
                <th className="subject-column">Scholastic Subjects</th>
                <th className="subject-column">Co-Scholastic Subjects</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ padding: "4px 0", border: "none" }}>
                    <SkeletonTable rows={4} columns={5} />
                  </td>
                </tr>
              ) : filteredMappings.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-row">
                    {searchQuery
                      ? "No class mappings match your search"
                      : "No mapping added yet"}
                  </td>
                </tr>
              ) : (
                filteredMappings.map((item, index) => {
                  const mId = item._id || item.id;
                  return (
                    <tr key={mId || item.className}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(mId)}
                          onChange={() => handleRowSelect(mId)}
                        />
                      </td>
                      <td>{index + 1}</td>
                      <td style={{ fontWeight: "600" }}>{item.className}</td>
                      <td className="subject-column">
                        {item.scholasticSubjects && item.scholasticSubjects.length > 0 ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                            {item.scholasticSubjects.map((sub, sIdx) => (
                              <span
                                key={sIdx}
                                style={{
                                  background: "#eff6ff",
                                  color: "#1d4ed8",
                                  padding: "3px 8px",
                                  borderRadius: "6px",
                                  fontSize: "12px",
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
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                            {item.coScholasticSubjects.map((sub, cIdx) => (
                              <span
                                key={cIdx}
                                style={{
                                  background: "#fdf4ff",
                                  color: "#9333ea",
                                  padding: "3px 8px",
                                  borderRadius: "6px",
                                  fontSize: "12px",
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
          Assignment Popup Modal
      =============================== */}
      {showPopup && (
        <div className="popup-overlay" onClick={closePopup}>
          <div className="popup-box" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h3>Map Subjects to {selectedClass}</h3>
              <button className="popup-close-btn" onClick={closePopup}>
                ✕
              </button>
            </div>

            <div className="popup-content">
              {/* Scholastic Section */}
              <div className="subject-category-block">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <h4 style={{ margin: 0, color: "#1e3a8a" }}>
                    📘 Scholastic Subjects ({selectedScholasticSubjects.length} selected)
                  </h4>
                  {availableScholastic.length > 0 && (
                    <label style={{ fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                      <input
                        type="checkbox"
                        checked={
                          selectedScholasticSubjects.length > 0 &&
                          selectedScholasticSubjects.length === availableScholastic.length
                        }
                        onChange={toggleSelectAllScholastic}
                      />
                      Select All
                    </label>
                  )}
                </div>

                {availableScholastic.length === 0 ? (
                  <p style={{ color: "#6b7280", fontStyle: "italic", fontSize: "13px" }}>
                    No scholastic subjects available. Please add subjects in Subject Setup first.
                  </p>
                ) : (
                  <div className="subject-checkbox-grid">
                    {availableScholastic.map((sub) => {
                      const isChecked = selectedScholasticSubjects.includes(sub.subjectName);
                      return (
                        <label
                          key={sub._id || sub.subjectName}
                          className={`subject-checkbox-item ${isChecked ? "checked" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleScholasticSubject(sub.subjectName)}
                          />
                          <span>{sub.subjectName}</span>
                          {sub.subjectCode && (
                            <small style={{ color: "#9ca3af", marginLeft: "4px" }}>
                              ({sub.subjectCode})
                            </small>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Co-Scholastic Section */}
              <div className="subject-category-block" style={{ marginTop: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <h4 style={{ margin: 0, color: "#581c87" }}>
                    🧩 Co-Scholastic Subjects ({selectedCoScholasticSubjects.length} selected)
                  </h4>
                  {availableCoScholastic.length > 0 && (
                    <label style={{ fontSize: "12px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                      <input
                        type="checkbox"
                        checked={
                          selectedCoScholasticSubjects.length > 0 &&
                          selectedCoScholasticSubjects.length === availableCoScholastic.length
                        }
                        onChange={toggleSelectAllCoScholastic}
                      />
                      Select All
                    </label>
                  )}
                </div>

                {availableCoScholastic.length === 0 ? (
                  <p style={{ color: "#6b7280", fontStyle: "italic", fontSize: "13px" }}>
                    No co-scholastic subjects available. Please add subjects in Co-Scholastic Subject Setup first.
                  </p>
                ) : (
                  <div className="subject-checkbox-grid">
                    {availableCoScholastic.map((sub) => {
                      const isChecked = selectedCoScholasticSubjects.includes(sub.subjectName);
                      return (
                        <label
                          key={sub._id || sub.subjectName}
                          className={`subject-checkbox-item ${isChecked ? "checked" : ""}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCoScholasticSubject(sub.subjectName)}
                          />
                          <span>{sub.subjectName}</span>
                          {sub.subjectCode && (
                            <small style={{ color: "#9ca3af", marginLeft: "4px" }}>
                              ({sub.subjectCode})
                            </small>
                          )}
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
              <AppButton type="primary" onClick={saveMapping}>
                Save Mapping
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClassSubjectMapping;