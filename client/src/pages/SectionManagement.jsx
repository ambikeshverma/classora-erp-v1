import React, { useState } from "react";
import "./sectionManagement.css";
import AppButton from "../components/AppButton";

function SectionManagement() {
  const schoolId = localStorage.getItem("schoolId") || "SCH001";

  // Demo master classes
  // Later backend/Class Management se aayengi
  const classOptions = [
    "Nursery",
    "LKG",
    "UKG",
    "Class 1",
    "Class 2",
    "Class 3",
    "Class 4",
    "Class 5",
    "Class 6",
    "Class 7",
    "Class 8",
    "Class 9",
    "Class 10",
    "Class 11",
    "Class 12",
  ];

  const usedSections = [
    {
      className: "Class 8",
      sectionName: "A",
    },
  ];

  const [showForm, setShowForm] = useState(false);
  const [sections, setSections] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewData, setViewData] = useState(null);
  const [editId, setEditId] = useState(null);

  const [searchText, setSearchText] = useState("");
  const [classFilter, setClassFilter] = useState("");

  const [isSearched, setIsSearched] = useState(false);

  const [appliedFilters, setAppliedFilters] = useState({
    searchText: "",
    classFilter: "",
  });

  const [formData, setFormData] = useState({
    className: "",
    sectionName: "",
    status: "Active",
  });

  const visibleSections = sections.filter((item) => item.schoolId === schoolId);

  const resetForm = () => {
    setFormData({
      className: "",
      sectionName: "",
      status: "Active",
    });

    setEditId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSave = () => {
    if (!formData.className || !formData.sectionName) {
      alert("Please fill required fields");
      return;
    }

    const alreadyExists = visibleSections.some(
      (item) =>
        item.className === formData.className &&
        item.sectionName.toLowerCase().trim() ===
          formData.sectionName.toLowerCase().trim() &&
        item.id !== editId
    );

    if (alreadyExists) {
      alert("Section already exists in this class");
      return;
    }

    if (editId) {
      const updatedSections = sections
        .map((item) =>
          item.id === editId
            ? {
                ...item,
                ...formData,
              }
            : item
        )
        .sort((a, b) => a.className.localeCompare(b.className));

      setSections(updatedSections);

      alert("Section updated successfully");
    } else {
      const newSection = {
        id: Date.now(),
        schoolId,
        ...formData,
      };

      const updatedSections = [...sections, newSection].sort((a, b) =>
        a.className.localeCompare(b.className)
      );

      setSections(updatedSections);

      alert("Section added successfully");
    }

    resetForm();
    setShowForm(false);
    setIsSearched(true);
    setSelectedIds([]);
  };

  const handleSearch = () => {
    const filters = {
      searchText,
      classFilter,
    };

    setAppliedFilters(filters);

    const result = visibleSections.filter((item) => {
      const classMatch = filters.classFilter
        ? item.className === filters.classFilter
        : true;

      const searchMatch = filters.searchText
        ? item.sectionName
            .toLowerCase()
            .includes(filters.searchText.toLowerCase()) ||
          item.className
            .toLowerCase()
            .includes(filters.searchText.toLowerCase())
        : true;

      return classMatch && searchMatch;
    });

    if (result.length === 0) {
      alert("No section found");
    }

    setIsSearched(true);
    setSelectedIds([]);
  };

  const filteredSections = visibleSections.filter((item) => {
    const classMatch = appliedFilters.classFilter
      ? item.className === appliedFilters.classFilter
      : true;

    const searchMatch = appliedFilters.searchText
      ? item.sectionName
          .toLowerCase()
          .includes(appliedFilters.searchText.toLowerCase()) ||
        item.className
          .toLowerCase()
          .includes(appliedFilters.searchText.toLowerCase())
      : true;

    return classMatch && searchMatch;
  });

  const selectedSections = visibleSections.filter((item) =>
    selectedIds.includes(item.id)
  );

  const selectedSingle =
    selectedSections.length === 1 ? selectedSections[0] : null;

  const handleEdit = () => {
    if (!selectedSingle) {
      alert("Select one section");
      return;
    }

    setEditId(selectedSingle.id);

    setFormData({
      className: selectedSingle.className,
      sectionName: selectedSingle.sectionName,
      status: selectedSingle.status,
    });

    setShowForm(true);
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) {
      alert("Select section");
      return;
    }

    const blockedSection = visibleSections.find(
      (item) =>
        selectedIds.includes(item.id) &&
        usedSections.some(
          (section) =>
            section.className === item.className &&
            section.sectionName === item.sectionName
        )
    );

    if (blockedSection) {
      alert("Section is already in use. Cannot delete.");
      return;
    }

    const ok = window.confirm("Delete selected section?");

    if (!ok) return;

    setSections(sections.filter((item) => !selectedIds.includes(item.id)));

    setSelectedIds([]);
  };

  return (
    <div className="section-page">
      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => {
            if (showForm) {
              resetForm();
              setShowForm(false);
            } else {
              window.location.href = "/student-hub";
            }
          }}
        >
          ←
        </AppButton>

        <div>
          <h1>Section Management</h1>

          <p>Manage class sections</p>
        </div>
      </div>

      {!showForm && (
        <>
          <div className="common-card">
            <div className="filter-grid">
              <div className="form-group">
                <label>Class</label>

                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                >
                  <option value="">All</option>

                  {classOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Search</label>

                <input
                  type="text"
                  placeholder="Section or class"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
            </div>

            <div className="search-btn-row">
              <AppButton type="primary" onClick={handleSearch}>
                Search
              </AppButton>
            </div>
          </div>

          <div className="common-card">
            <div className="list-header">
              <h2>Section List</h2>

              <div className="list-action-buttons">
                <AppButton type="primary" onClick={() => setShowForm(true)}>
                  + Add Section
                </AppButton>

                <AppButton
                  type="view"
                  onClick={() => {
                    if (!selectedSingle) {
                      alert("Select one section");
                      return;
                    }

                    setViewData(selectedSingle);
                  }}
                >
                  View
                </AppButton>

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
                          filteredSections.length > 0 &&
                          selectedIds.length === filteredSections.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(
                              filteredSections.map((item) => item.id)
                            );
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                      />
                    </th>

                    <th>S.No</th>
                    <th>Class</th>
                    <th>Section</th>
                  </tr>
                </thead>

                <tbody>
                  {!isSearched ? (
                    <tr>
                      <td colSpan="4" className="empty-row">
                        Click Search to view sections
                      </td>
                    </tr>
                  ) : filteredSections.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="empty-row">
                        No section found
                      </td>
                    </tr>
                  ) : (
                    filteredSections.map((item, index) => (
                      <tr key={item.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item.id)}
                            onChange={() => {
                              setSelectedIds((prev) =>
                                prev.includes(item.id)
                                  ? prev.filter((id) => id !== item.id)
                                  : [...prev, item.id]
                              );
                            }}
                          />
                        </td>

                        <td>{index + 1}</td>
                        <td>{item.className}</td>
                        <td>{item.sectionName}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {showForm && (
        <div className="common-card">
          <div className="enquiry-form-grid">
            <div className="form-group">
              <label>Class</label>

              <select
                name="className"
                value={formData.className}
                onChange={handleChange}
              >
                <option value="">Select Class</option>

                {classOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Section Name</label>

              <input
                type="text"
                name="sectionName"
                placeholder="Example: A"
                value={formData.sectionName}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-actions">
            <AppButton type="primary" onClick={handleSave}>
              {editId ? "Update" : "Save"}
            </AppButton>

            <AppButton
              type="secondary"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
            >
              Go Back
            </AppButton>
          </div>
        </div>
      )}

      {viewData && (
        <div className="popup-overlay">
          <div className="view-popup">
            <div className="popup-head">
              <h2>Section Details</h2>

              <button
                className="popup-close-btn"
                onClick={() => setViewData(null)}
              >
                ×
              </button>
            </div>

            <div className="view-grid">
              <p>
                <strong>Class:</strong> {viewData.className}
              </p>

              <p>
                <strong>Section:</strong> {viewData.sectionName}
              </p>

              <p>
                <strong>Status:</strong> {viewData.status}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SectionManagement;