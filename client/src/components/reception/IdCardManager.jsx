import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./IdCardManager.css";
import AppButton from "../AppButton";
import { SkeletonTable } from "../Skeleton";
import { receptionService } from "../../services/api";

const CONFIG = {
  STUDENT: {
    pageClass: "student-id-page",
    title: "Student ID Management",
    subtitle: "Generate, preview, print and reprint student ID cards",
    listTitle: "Student ID List",
    previewTitle: "ID Card Preview",
  },
  PARENT: {
    pageClass: "parent-id-page",
    title: "Parent ID Management",
    subtitle: "Generate, preview, print and reprint parent ID cards",
    listTitle: "Parent ID List",
    previewTitle: "Parent ID Preview",
  },
};

const EMPTY_FILTERS = { className: "", section: "", photo: "", status: "" };

function IdCardManager({ type }) {
  const navigate = useNavigate();
  const text = CONFIG[type];
  const isStudent = type === "STUDENT";

  const [meta, setMeta] = useState({ classes: [], templates: { STUDENT: [], PARENT: [] }, schoolInfo: {} });
  const [metaLoading, setMetaLoading] = useState(true);

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [templateId, setTemplateId] = useState("");
  const [mirrorPrint, setMirrorPrint] = useState(false);

  const [students, setStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSearched, setIsSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const [preview, setPreview] = useState(null);

  useEffect(() => {
    let active = true;

    receptionService
      .getIdCardMeta()
      .then((res) => {
        if (active) setMeta(res.data?.data || { classes: [], templates: { STUDENT: [], PARENT: [] }, schoolInfo: {} });
      })
      .catch((err) => {
        console.error("Failed to load ID card meta", err);
      })
      .finally(() => {
        if (active) setMetaLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const templates = meta.templates?.[type] || [];
  const selectedTemplate = templates.find((item) => item.id === templateId);
  const sectionOptions = meta.classes.find((item) => item.className === filters.className)?.sections || [];

  const allIssued = selectedIds.length > 0 && students.filter((s) => selectedIds.includes(s._id)).every((s) => s.idStatus === "ISSUED");

  const loadStudents = async (appliedFilters = filters) => {
    const params = { type };
    Object.entries(appliedFilters).forEach(([key, value]) => {
      if (value && (isStudent || key !== "photo")) params[key] = value;
    });

    const res = await receptionService.getIdCardStudents(params);
    setStudents(res.data?.data || []);
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      setIsSearched(true);
      setSelectedIds([]);
      await loadStudents();
    } catch (err) {
      setStudents([]);
      alert(err.response?.data?.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  // Photos are only fetched for the cards that are actually shown
  const openPreview = async () => {
    if (!templateId) {
      alert("Please select template");
      return;
    }

    if (selectedIds.length === 0) {
      alert("Please select students");
      return;
    }

    if (selectedIds.length > 100) {
      alert("Select up to 100 students at a time");
      return;
    }

    try {
      setBusy(true);
      const res = await receptionService.previewIdCards(selectedIds);
      setPreview(res.data?.data || null);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to load ID cards");
    } finally {
      setBusy(false);
    }
  };

  const handlePrint = async () => {
    try {
      setBusy(true);
      await receptionService.issueIdCards({ type, studentIds: preview.students.map((s) => s._id), template: templateId });
      window.print();
      await loadStudents();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to mark ID cards as issued");
    } finally {
      setBusy(false);
    }
  };

  const schoolInfo = preview?.schoolInfo || meta.schoolInfo || {};

  const renderStudentCard = (student) => (
    <div
      key={student._id}
      className={`${selectedTemplate?.orientation === "Horizontal" ? "id-card horizontal" : "id-card vertical"} ${mirrorPrint ? "mirror" : ""}`}
    >
      <h3>{schoolInfo.schoolName}</h3>

      <div className="student-photo">
        {student.photoUrl ? <img src={student.photoUrl} alt={student.studentName} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "No Photo"}
      </div>

      <p>{student.studentName}</p>
      <p>
        Class: {student.className} - {student.section}
      </p>
      <p>Roll No: {student.rollNo || "-"}</p>
      <p>Father: {student.fatherName || "-"}</p>
      <p>Adm No: {student.admissionNo || student.srNo || "-"}</p>
      <p>Mobile: {student.mobile || "-"}</p>
    </div>
  );

  const renderParentCard = (student) => (
    <div key={student._id} className={`parent-id-card ${mirrorPrint ? "mirror" : ""}`}>
      <div className="parent-id-top">
        <div className="school-logo">
          {schoolInfo.logo ? <img src={schoolInfo.logo} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} /> : "LOGO"}
        </div>

        <div>
          <h3>{schoolInfo.schoolName}</h3>
          <p>{schoolInfo.address}</p>
        </div>
      </div>

      <div className="parent-photo-section">
        <div className="parent-photo">Father</div>

        <div className="student-photo">
          {student.photoUrl ? <img src={student.photoUrl} alt={student.studentName} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : "Student"}
        </div>

        <div className="parent-photo">Mother</div>
      </div>

      <div className="parent-id-details">
        <p>
          <strong>Student:</strong> {student.studentName}
        </p>
        <p>
          <strong>Class:</strong> {student.className} - {student.section}
        </p>
        <p>
          <strong>Father:</strong> {student.fatherName || "-"}
        </p>
        <p>
          <strong>Mother:</strong> {student.motherName || "-"}
        </p>
        <p>
          <strong>Mobile:</strong> {student.mobile || "-"}
        </p>
        <p>
          <strong>Address:</strong> {student.address || "-"}
        </p>
      </div>
    </div>
  );

  return (
    <div className={text.pageClass}>
      <div className="common-page-header">
        <AppButton type="back" onClick={() => navigate("/reception-desk")}>
          ←
        </AppButton>

        <div>
          <h1>{text.title}</h1>
          <p>{text.subtitle}</p>
        </div>
      </div>

      <div className="common-card">
        <div className="filter-grid">
          <div className="form-group">
            <label>Class</label>

            <select
              value={filters.className}
              disabled={metaLoading}
              onChange={(e) => setFilters({ ...filters, className: e.target.value, section: "" })}
            >
              <option value="">{metaLoading ? "Loading..." : "All Classes"}</option>

              {meta.classes.map((item) => (
                <option key={item.className} value={item.className}>
                  {item.className}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Section</label>

            <select value={filters.section} onChange={(e) => setFilters({ ...filters, section: e.target.value })}>
              <option value="">All Sections</option>

              {sectionOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          {isStudent && (
            <div className="form-group">
              <label>Photo Status</label>

              <select value={filters.photo} onChange={(e) => setFilters({ ...filters, photo: e.target.value })}>
                <option value="">All</option>
                <option value="YES">With Photo</option>
                <option value="NO">Without Photo</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label>ID Status</label>

            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All</option>
              <option value="ISSUED">Issued</option>
              <option value="NOT ISSUED">Not Issued</option>
            </select>
          </div>

          <div className="form-group">
            <label>Assigned Template</label>

            <select value={templateId} disabled={metaLoading} onChange={(e) => setTemplateId(e.target.value)}>
              <option value="">{metaLoading ? "Loading..." : "Select Template"}</option>

              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name} ({template.orientation})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-actions search-action-row">
          <label className="mirror-option">
            <input type="checkbox" checked={mirrorPrint} onChange={(e) => setMirrorPrint(e.target.checked)} />
            Mirror Printing
          </label>

          <AppButton type="primary" onClick={handleSearch} disabled={loading}>
            {loading ? "Loading..." : "Search"}
          </AppButton>
        </div>
      </div>

      <div className="common-card">
        <div className="list-header">
          <h2>{text.listTitle}</h2>

          <div className="list-action-buttons">
            <AppButton type="primary" onClick={openPreview} disabled={busy}>
              Preview
            </AppButton>

            <AppButton type="primary" onClick={openPreview} disabled={busy}>
              {allIssued ? "Reprint" : "Print"}
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
                    checked={students.length > 0 && selectedIds.length === students.length}
                    onChange={(e) => setSelectedIds(e.target.checked ? students.map((item) => item._id) : [])}
                  />
                </th>

                <th>S.No</th>
                <th>Name</th>
                <th>Class</th>
                <th>Sec</th>
                {isStudent ? (
                  <>
                    <th>Roll</th>
                    <th>Photo</th>
                  </>
                ) : (
                  <>
                    <th>Father</th>
                    <th>Mother</th>
                  </>
                )}
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {!isSearched ? (
                <tr>
                  <td colSpan="8" className="empty-row">
                    Please select filters and click Search
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan="8" style={{ padding: "4px 0", border: "none" }}>
                    <SkeletonTable rows={5} columns={8} />
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-row">
                    No student found
                  </td>
                </tr>
              ) : (
                students.map((item, index) => (
                  <tr key={item._id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item._id)}
                        onChange={() =>
                          setSelectedIds((prev) =>
                            prev.includes(item._id) ? prev.filter((id) => id !== item._id) : [...prev, item._id]
                          )
                        }
                      />
                    </td>

                    <td>{index + 1}</td>
                    <td>{item.studentName}</td>
                    <td>{item.className}</td>
                    <td>{item.section}</td>
                    {isStudent ? (
                      <>
                        <td>{item.rollNo || "-"}</td>
                        <td>{item.photo}</td>
                      </>
                    ) : (
                      <>
                        <td>{item.fatherName || "-"}</td>
                        <td>{item.motherName || "-"}</td>
                      </>
                    )}
                    <td>{item.idStatus}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {preview && (
        <div className="popup-overlay idcard-overlay">
          <div className="preview-popup idcard-popup">
            <div className="popup-head">
              <h2>{text.previewTitle}</h2>

              <button className="popup-close-btn" onClick={() => setPreview(null)}>
                ×
              </button>
            </div>

            <p className="template-info">
              Template: {selectedTemplate?.name || "Not Selected"} | Mirror: {mirrorPrint ? "Yes" : "No"}
            </p>

            <div className="idcard-actions">
              <AppButton type="primary" onClick={handlePrint} disabled={busy}>
                {busy ? "Please wait..." : "Print"}
              </AppButton>

              <AppButton type="secondary" onClick={() => setPreview(null)}>
                Close
              </AppButton>
            </div>

            <div className={isStudent ? "id-preview-grid idcard-print-area" : "parent-id-preview-grid idcard-print-area"}>
              {preview.students.map((student) => (isStudent ? renderStudentCard(student) : renderParentCard(student)))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default IdCardManager;
