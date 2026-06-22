import React, { useState } from "react";
import "./classManagement.css";
import AppButton from "../components/AppButton";

function ClassManagement() {
  const schoolId = localStorage.getItem("schoolId") || "SCH001";

  const usedClasses = ["Class 8"];

  const [showForm, setShowForm] = useState(false);
  const [classes, setClasses] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewData, setViewData] = useState(null);
  const [editId, setEditId] = useState(null);

  const [searchText, setSearchText] = useState("");
  const [isSearched, setIsSearched] = useState(false);

  const [appliedFilters, setAppliedFilters] = useState({
    searchText: "",
  });

  const [formData, setFormData] = useState({
    className: "",
    classCode: "",
    status: "Active",
  });

  const resetForm = () => {
    setFormData({
      className: "",
      classCode: "",
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

  const visibleClasses = classes.filter((item) => item.schoolId === schoolId);

  const handleSave = () => {
    if (!formData.className || !formData.classCode) {
      alert("Please fill required fields");
      return;
    }

    const classNameExists = visibleClasses.some(
      (item) =>
        item.className.toLowerCase().trim() ===
          formData.className.toLowerCase().trim() && item.id !== editId
    );

    if (classNameExists) {
      alert("Class already exists");
      return;
    }

    const classCodeExists = visibleClasses.some(
      (item) =>
        item.classCode.toLowerCase().trim() ===
          formData.classCode.toLowerCase().trim() && item.id !== editId
    );

    if (classCodeExists) {
      alert("Class code already exists");
      return;
    }

    if (editId) {
      const updatedClasses = classes
        .map((item) =>
          item.id === editId
            ? {
                ...item,
                ...formData,
              }
            : item
        )
        .sort((a, b) => a.className.localeCompare(b.className));

      setClasses(updatedClasses);

      alert("Class updated successfully");
    } else {
      const newClass = {
        id: Date.now(),
        schoolId,
        ...formData,
      };

      const updatedClasses = [...classes, newClass].sort((a, b) =>
        a.className.localeCompare(b.className)
      );

      setClasses(updatedClasses);

      alert("Class added successfully");
    }

    resetForm();
    setShowForm(false);
    setIsSearched(true);
    setSelectedIds([]);
  };

  const handleSearch = () => {
    const filters = {
      searchText,
    };

    setAppliedFilters(filters);

    const result = visibleClasses.filter((item) => {
      const searchMatch = filters.searchText
        ? item.className
            .toLowerCase()
            .includes(filters.searchText.toLowerCase()) ||
          item.classCode.toLowerCase().includes(filters.searchText.toLowerCase())
        : true;

      return searchMatch;
    });

    if (result.length === 0) {
      alert("No class found");
    }

    setIsSearched(true);
    setSelectedIds([]);
  };

  const filteredClasses = visibleClasses.filter((item) => {
    const searchMatch = appliedFilters.searchText
      ? item.className
          .toLowerCase()
          .includes(appliedFilters.searchText.toLowerCase()) ||
        item.classCode
          .toLowerCase()
          .includes(appliedFilters.searchText.toLowerCase())
      : true;

    return searchMatch;
  });

  const selectedClasses = visibleClasses.filter((item) =>
    selectedIds.includes(item.id)
  );

  const selectedSingle =
    selectedClasses.length === 1 ? selectedClasses[0] : null;

  const handleEdit = () => {
    if (!selectedSingle) {
      alert("Select one class");
      return;
    }

    setEditId(selectedSingle.id);

    setFormData({
      className: selectedSingle.className,
      classCode: selectedSingle.classCode,
      status: selectedSingle.status,
    });

    setShowForm(true);
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) {
      alert("Select class");
      return;
    }

    const blockedClass = visibleClasses.find(
      (item) =>
        selectedIds.includes(item.id) && usedClasses.includes(item.className)
    );

    if (blockedClass) {
      alert("Class is already in use. Cannot delete.");
      return;
    }

    const ok = window.confirm("Delete selected class?");

    if (!ok) return;

    setClasses(classes.filter((item) => !selectedIds.includes(item.id)));

    setSelectedIds([]);
  };

  return (
    <div className="class-page">
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
          <h1>Class Management</h1>

          <p>Manage school classes</p>
        </div>
      </div>

      {!showForm && (
        <>
          <div className="common-card">
            <div className="filter-grid">
              <div className="form-group">
                <label>Search</label>

                <input
                  type="text"
                  placeholder="Class name or code"
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
              <h2>Class List</h2>

              <div className="list-action-buttons">
                <AppButton type="primary" onClick={() => setShowForm(true)}>
                  + Add Class
                </AppButton>

                <AppButton
                  type="view"
                  onClick={() => {
                    if (!selectedSingle) {
                      alert("Select one class");
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
                          filteredClasses.length > 0 &&
                          selectedIds.length === filteredClasses.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(
                              filteredClasses.map((item) => item.id)
                            );
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                      />
                    </th>

                    <th>S.No</th>
                    <th>Class Name</th>
                    <th>Class Code</th>
                  </tr>
                </thead>

                <tbody>
                  {!isSearched ? (
                    <tr>
                      <td colSpan="4" className="empty-row">
                        Click Search to view classes
                      </td>
                    </tr>
                  ) : filteredClasses.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="empty-row">
                        No class found
                      </td>
                    </tr>
                  ) : (
                    filteredClasses.map((item, index) => (
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
                        <td>{item.classCode}</td>
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
              <label>Class Name</label>

              <input
                type="text"
                name="className"
                placeholder="Example: Class 8"
                value={formData.className}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Class Code</label>

              <input
                type="text"
                name="classCode"
                placeholder="Example: VIII"
                value={formData.classCode}
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
              <h2>Class Details</h2>

              <button
                className="popup-close-btn"
                onClick={() => setViewData(null)}
              >
                ×
              </button>
            </div>

            <div className="view-grid">
              <p>
                <strong>Class Name:</strong> {viewData.className}
              </p>

              <p>
                <strong>Class Code:</strong> {viewData.classCode}
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

export default ClassManagement;