import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./coScholasticSubjectSetup.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { academicService } from "../services/api";

function CoScholasticSubjectSetup() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [editId, setEditId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [subject, setSubject] = useState({
    subjectName: "",
    subjectCode: "",
  });

  /* ===============================
     Fetch Co-Scholastic Subjects
  =============================== */
  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await academicService.getCoScholasticSubjects();
      if (res.data?.success) {
        setSubjects(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load co-scholastic subjects:", err);
    } finally {
      setLoading(false);
    }
  };

  const hasFetched = React.useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchSubjects();
  }, []);

  const handleChange = (e) => {
    setSubject({
      ...subject,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    if (!subject.subjectName.trim()) {
      alert("Please fill Subject Name");
      return;
    }

    const cleanName = subject.subjectName.trim();
    const cleanCode = subject.subjectCode ? subject.subjectCode.trim().toUpperCase() : "";

    const duplicateSubject = subjects.some(
      (item) =>
        item.subjectName.toLowerCase() === cleanName.toLowerCase() &&
        (item._id || item.id) !== editId
    );

    if (duplicateSubject) {
      alert(`Subject '${cleanName}' already exists`);
      return;
    }

    try {
      if (editId) {
        const res = await academicService.updateCoScholasticSubject(editId, {
          subjectName: cleanName,
          subjectCode: cleanCode,
        });

        if (res.data?.success) {
          alert("Co-Scholastic Subject updated successfully");
          setSubjects((prev) =>
            prev.map((s) => ((s._id || s.id) === editId ? res.data.data : s))
          );
        }
      } else {
        const res = await academicService.createCoScholasticSubject({
          subjectName: cleanName,
          subjectCode: cleanCode,
        });

        if (res.data?.success) {
          alert("Co-Scholastic Subject added successfully");
          setSubjects((prev) => [...prev, res.data.data]);
        }
      }

      setSubject({
        subjectName: "",
        subjectCode: "",
      });
      setEditId(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save co-scholastic subject");
    }
  };

  const handleEdit = () => {
    if (selectedIds.length !== 1) {
      alert("Please select exactly one subject to edit");
      return;
    }

    const selected = subjects.find(
      (item) => (item._id || item.id) === selectedIds[0]
    );

    if (!selected) return;

    setEditId(selected._id || selected.id);
    setSubject({
      subjectName: selected.subjectName || "",
      subjectCode: selected.subjectCode || "",
    });

    setSelectedIds([]);
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one subject to delete");
      return;
    }

    const ok = window.confirm(
      `Delete ${selectedIds.length} selected co-scholastic subject(s)?`
    );
    if (!ok) return;

    try {
      for (const id of selectedIds) {
        await academicService.deleteCoScholasticSubject(id);
      }

      setSubjects((prev) =>
        prev.filter((item) => !selectedIds.includes(item._id || item.id))
      );
      setSelectedIds([]);
      alert("Co-Scholastic Subject(s) deleted successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete subject");
    }
  };

  const filteredSubjects = subjects.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (item.subjectName || "").toLowerCase().includes(q) ||
      (item.subjectCode || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="co-scholastic-subject-page">
      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => navigate("/academic-zone")}
        >
          ←
        </AppButton>

        <div>
          <h1>Co-Scholastic Subject Setup</h1>
          <p>Create and manage co-scholastic subjects</p>
        </div>
      </div>

      <div className="common-card">
        <h2>{editId ? "Edit Co-Scholastic Subject" : "Add Co-Scholastic Subject"}</h2>

        <div className="subject-form-grid two-column-grid">
          <div className="form-group">
            <label>Subject Name *</label>
            <input
              type="text"
              name="subjectName"
              value={subject.subjectName}
              onChange={handleChange}
              placeholder="Enter subject name (e.g. Discipline, Sports, Art)"
            />
          </div>

          <div className="form-group">
            <label>Subject Code</label>
            <input
              type="text"
              name="subjectCode"
              value={subject.subjectCode}
              onChange={handleChange}
              placeholder="Enter subject code (optional)"
            />
          </div>
        </div>

        <div className="form-action right-action" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
          {editId && (
            <AppButton
              type="secondary"
              onClick={() => {
                setSubject({ subjectName: "", subjectCode: "" });
                setEditId(null);
              }}
            >
              Cancel
            </AppButton>
          )}

          <AppButton type="primary" onClick={handleSave}>
            {editId ? "Update Subject" : "Save Subject"}
          </AppButton>
        </div>
      </div>

      <div className="common-card">
        <div className="table-top-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <h2>Co-Scholastic Subject List</h2>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Search co-scholastic..."
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

            <div className="top-action-buttons">
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
                      filteredSubjects.length > 0 &&
                      selectedIds.length === filteredSubjects.length
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(
                          filteredSubjects.map((item) => item._id || item.id)
                        );
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                  />
                </th>

                <th>S.No.</th>
                <th>Subject Name</th>
                <th>Code</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" style={{ padding: "4px 0", border: "none" }}>
                    <SkeletonTable rows={4} columns={4} />
                  </td>
                </tr>
              ) : filteredSubjects.length === 0 ? (
                <tr>
                  <td colSpan="4" className="empty-row">
                    {searchQuery
                      ? "No co-scholastic subjects match your search"
                      : "No co-scholastic subjects added yet"}
                  </td>
                </tr>
              ) : (
                filteredSubjects.map((item, index) => {
                  const sId = item._id || item.id;
                  return (
                    <tr key={sId}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(sId)}
                          onChange={() => {
                            setSelectedIds((prev) =>
                              prev.includes(sId)
                                ? prev.filter((id) => id !== sId)
                                : [...prev, sId]
                            );
                          }}
                        />
                      </td>

                      <td>{index + 1}</td>
                      <td>{item.subjectName}</td>
                      <td>{item.subjectCode || "-"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CoScholasticSubjectSetup;