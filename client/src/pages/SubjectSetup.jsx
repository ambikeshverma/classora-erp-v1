import React, { useState, useEffect } from "react";
import "./subjectSetup.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { masterService } from "../services/api";

function SubjectSetup() {
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [editId, setEditId] = useState(null);

  const [subject, setSubject] = useState({
    subjectName: "",
    subjectCode: "",
    subjectType: "",
  });

  /* ===============================
     Fetch Subjects on Mount
  =============================== */
  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await masterService.getSubjects();
      if (res.data?.success) {
        setSubjects(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load subjects:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleChange = (e) => {
    setSubject({
      ...subject,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = async () => {
    if (!subject.subjectName.trim() || !subject.subjectType) {
      alert("Please fill Subject Name and Subject Type");
      return;
    }

    const cleanName = subject.subjectName.trim();

    const duplicateSubject = subjects.some(
      (item) =>
        item.subjectName.toLowerCase() === cleanName.toLowerCase() &&
        (item._id || item.id) !== editId
    );

    if (duplicateSubject) {
      alert("Subject already exists");
      return;
    }

    try {
      if (editId) {
        const res = await masterService.updateSubject(editId, {
          subjectName: cleanName,
          subjectCode: subject.subjectCode,
          subjectType: subject.subjectType,
        });
        if (res.data?.success) {
          alert("Subject updated successfully");
          setSubjects((prev) =>
            prev.map((s) => ((s._id || s.id) === editId ? res.data.data : s))
          );
        }
      } else {
        const res = await masterService.createSubject({
          subjectName: cleanName,
          subjectCode: subject.subjectCode,
          subjectType: subject.subjectType,
        });
        if (res.data?.success) {
          alert("Subject added successfully");
          setSubjects((prev) => [...prev, res.data.data]);
        }
      }

      setSubject({
        subjectName: "",
        subjectCode: "",
        subjectType: "",
      });
      setEditId(null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save subject");
    }
  };

  const handleEdit = () => {
    if (selectedIds.length !== 1) {
      alert("Please select one subject to edit");
      return;
    }

    const selected = subjects.find(
      (item) => (item._id || item.id) === selectedIds[0]
    );
    if (!selected) return;

    setEditId(selected._id || selected.id);
    setSubject({
      subjectName: selected.subjectName,
      subjectCode: selected.subjectCode || "",
      subjectType: selected.subjectType || "Theory",
    });

    setSelectedIds([]);
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      alert("Please select subjects to delete");
      return;
    }

    const ok = window.confirm(
      `Delete ${selectedIds.length} selected subject(s)?`
    );
    if (!ok) return;

    try {
      for (const id of selectedIds) {
        await masterService.deleteSubject(id);
      }
      setSubjects((prev) =>
        prev.filter((item) => !selectedIds.includes(item._id || item.id))
      );
      setSelectedIds([]);
      alert("Subject deleted successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete subject");
    }
  };

  return (
    <div className="subject-setup-page">
      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => (window.location.href = "/academic-zone")}
        >
          ←
        </AppButton>

        <div>
          <h1>Subject Setup</h1>
          <p>Create and manage subjects</p>
        </div>
      </div>

      <div className="common-card">
        <h2>{editId ? "Edit Subject" : "Add Subject"}</h2>

        <div className="subject-form-grid">
          <div className="form-group">
            <label>Subject Name *</label>
            <input
              type="text"
              name="subjectName"
              value={subject.subjectName}
              onChange={handleChange}
              placeholder="Enter subject name"
            />
          </div>

          <div className="form-group">
            <label>Subject Code</label>
            <input
              type="text"
              name="subjectCode"
              value={subject.subjectCode}
              onChange={handleChange}
              placeholder="Enter subject code"
            />
          </div>

          <div className="form-group">
            <label>Subject Type *</label>
            <select
              name="subjectType"
              value={subject.subjectType}
              onChange={handleChange}
            >
              <option value="">Select Type</option>
              <option value="Theory">Theory</option>
              <option value="Practical">Practical</option>
              <option value="Scholastic">Scholastic</option>
              <option value="Co-Scholastic">Co-Scholastic</option>
            </select>
          </div>
        </div>

        <div className="form-action right-action">
          {editId && (
            <AppButton
              type="secondary"
              onClick={() => {
                setSubject({
                  subjectName: "",
                  subjectCode: "",
                  subjectType: "",
                });
                setEditId(null);
              }}
              style={{ marginRight: "10px" }}
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
        <div className="table-top-header">
          <h2>Subject List</h2>

          <div className="top-action-buttons">
            <AppButton type="primary" onClick={handleEdit}>
              Edit
            </AppButton>

            <AppButton type="delete" onClick={handleDelete}>
              Delete
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
                      subjects.length > 0 &&
                      selectedIds.length === subjects.length
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(
                          subjects.map((item) => item._id || item.id)
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
                <th>Type</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ padding: "4px 0", border: "none" }}>
                    <SkeletonTable rows={4} columns={5} />
                  </td>
                </tr>
              ) : subjects.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-row">
                    No subjects added yet
                  </td>
                </tr>
              ) : (
                subjects.map((item, index) => {
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
                      <td>{item.subjectType || "Theory"}</td>
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

export default SubjectSetup;