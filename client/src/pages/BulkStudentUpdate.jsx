import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { studentHubService } from "../services/api";

function BulkStudentUpdate() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [houses, setHouses] = useState([]);
  const [mediums, setMediums] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [searchText, setSearchText] = useState("");

  // Bulk update fields
  const [updateFields, setUpdateFields] = useState({
    section: "",
    house: "",
    medium: "",
    status: "",
  });

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const res = await studentHubService.getMeta();
        if (res.data?.success) {
          setClasses(res.data.data.classes || []);
          setSections(res.data.data.sections || []);
          setHouses(res.data.data.houses || []);
          setMediums(res.data.data.mediums || []);
          if (res.data.data.classes?.length > 0) {
            setClassFilter(res.data.data.classes[0].className);
          }
        }
      } catch (err) {
        console.error("Failed to load meta:", err);
      }
    };
    fetchMeta();
  }, []);

  const handleSearch = async () => {
    if (!classFilter) {
      alert("Please select a Class first");
      return;
    }

    try {
      setLoading(true);
      const params = { className: classFilter };
      if (sectionFilter) params.section = sectionFilter;
      if (searchText) params.q = searchText;

      const res = await studentHubService.searchStudents(params);
      if (res.data?.success) {
        setStudents(res.data.data || []);
      }
      setSelectedIds([]);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyBulkUpdate = async () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one student to update");
      return;
    }

    const hasAnyField =
      updateFields.section ||
      updateFields.house ||
      updateFields.medium ||
      updateFields.status;

    if (!hasAnyField) {
      alert("Please select at least one field to update (Section, House, Medium, or Status)");
      return;
    }

    const ok = window.confirm(
      `Apply bulk update to ${selectedIds.length} selected student(s)?`
    );
    if (!ok) return;

    try {
      setUpdating(true);
      const payload = {
        studentIds: selectedIds,
        ...updateFields,
      };

      const res = await studentHubService.bulkUpdateStudents(payload);
      if (res.data?.success) {
        alert(res.data.message || "Students updated successfully");
        setUpdateFields({ section: "", house: "", medium: "", status: "" });
        setSelectedIds([]);
        handleSearch();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update students");
    } finally {
      setUpdating(false);
    }
  };

  const availableSections = classFilter
    ? sections.filter((s) => s.className === classFilter)
    : sections;

  return (
    <div className="class-page">
      <div className="common-page-header">
        <AppButton type="back" onClick={() => navigate("/student-hub")}>
          ←
        </AppButton>

        <div>
          <h1>Bulk Student Update</h1>
          <p>Batch edit sections, houses, mediums, and statuses across multiple students at once</p>
        </div>
      </div>

      <div className="common-card">
        <div className="filter-grid">
          <div className="form-group">
            <label>Filter Class *</label>
            <select
              value={classFilter}
              onChange={(e) => {
                setClassFilter(e.target.value);
                setSectionFilter("");
              }}
            >
              <option value="">Select Class</option>
              {classes.map((item) => (
                <option key={item._id || item.className} value={item.className}>
                  {item.className}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Filter Section</label>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
            >
              <option value="">All Sections</option>
              {availableSections.map((item) => (
                <option key={item._id || item.sectionName} value={item.sectionName}>
                  Section {item.sectionName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Search Keyword</label>
            <input
              type="text"
              placeholder="Name or admission no..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
        </div>

        <div className="search-btn-row">
          <AppButton type="primary" onClick={handleSearch}>
            Load Students
          </AppButton>
        </div>
      </div>

      <div className="common-card">
        <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #e2e8f0" }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: "15px", color: "#1e293b" }}>
            🛠️ Bulk Operations Bar ({selectedIds.length} students selected)
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", alignItems: "flex-end" }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: "12px" }}>Set Section</label>
              <select
                value={updateFields.section}
                onChange={(e) => setUpdateFields({ ...updateFields, section: e.target.value })}
              >
                <option value="">— Keep Unchanged —</option>
                {availableSections.map((s) => (
                  <option key={s._id || s.sectionName} value={s.sectionName}>
                    Section {s.sectionName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: "12px" }}>Set House</label>
              <select
                value={updateFields.house}
                onChange={(e) => setUpdateFields({ ...updateFields, house: e.target.value })}
              >
                <option value="">— Keep Unchanged —</option>
                {houses.map((h) => (
                  <option key={h._id || h.houseName} value={h.houseName}>
                    {h.houseName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: "12px" }}>Set Medium</label>
              <select
                value={updateFields.medium}
                onChange={(e) => setUpdateFields({ ...updateFields, medium: e.target.value })}
              >
                <option value="">— Keep Unchanged —</option>
                {mediums.map((m) => (
                  <option key={m._id || m.mediumName} value={m.mediumName}>
                    {m.mediumName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ margin: 0 }}>
              <label style={{ fontSize: "12px" }}>Set Status</label>
              <select
                value={updateFields.status}
                onChange={(e) => setUpdateFields({ ...updateFields, status: e.target.value })}
              >
                <option value="">— Keep Unchanged —</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Alumni">Alumni</option>
              </select>
            </div>

            <div>
              <AppButton
                type="primary"
                onClick={handleApplyBulkUpdate}
                disabled={updating || selectedIds.length === 0}
              >
                {updating ? "Updating..." : "Apply to Selected"}
              </AppButton>
            </div>
          </div>
        </div>

        <div className="table-wrap">
          {loading ? (
            <SkeletonTable rows={5} columns={6} />
          ) : (
            <table>
              <thead>
                <tr>
                  <th style={{ width: "40px" }}>
                    <input
                      type="checkbox"
                      checked={
                        students.length > 0 &&
                        selectedIds.length === students.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(students.map((item) => item._id || item.id));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                    />
                  </th>
                  <th>S.No</th>
                  <th>Admission No</th>
                  <th>Student Name</th>
                  <th>Class & Section</th>
                  <th>House</th>
                  <th>Medium</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-row">
                      {classFilter ? "No students found in this class." : "Select a class and click Load Students."}
                    </td>
                  </tr>
                ) : (
                  students.map((item, index) => {
                    const itemId = item._id || item.id;
                    return (
                      <tr key={itemId}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(itemId)}
                            onChange={() => {
                              setSelectedIds((prev) =>
                                prev.includes(itemId)
                                  ? prev.filter((id) => id !== itemId)
                                  : [...prev, itemId]
                              );
                            }}
                          />
                        </td>
                        <td>{index + 1}</td>
                        <td><span className="badge-code">{item.admissionNo || item.srNo || "—"}</span></td>
                        <td><strong>{item.studentName}</strong></td>
                        <td>{item.className} {item.section ? `(${item.section})` : ""}</td>
                        <td>{item.house || "—"}</td>
                        <td>{item.medium || "—"}</td>
                        <td>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "10px",
                              backgroundColor: item.status === "Active" ? "#dcfce7" : "#fee2e2",
                              color: item.status === "Active" ? "#166534" : "#991b1b",
                              fontSize: "12px",
                              fontWeight: "600",
                            }}
                          >
                            {item.status || "Active"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default BulkStudentUpdate;
