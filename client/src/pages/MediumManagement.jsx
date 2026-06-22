import React, { useState } from "react";
import "./mediumManagement.css";
import AppButton from "../components/AppButton";

function MediumManagement() {
  const schoolId = localStorage.getItem("schoolId") || "SCH001";

  const usedMediums = ["English Medium"];

  const [showForm, setShowForm] = useState(false);
  const [mediums, setMediums] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewData, setViewData] = useState(null);
  const [editId, setEditId] = useState(null);

  const [searchText, setSearchText] = useState("");
  const [isSearched, setIsSearched] = useState(false);

  const [appliedFilters, setAppliedFilters] = useState({
    searchText: "",
  });

  const [formData, setFormData] = useState({
    mediumName: "",
    mediumCode: "",
    status: "Active",
  });

  const resetForm = () => {
    setFormData({
      mediumName: "",
      mediumCode: "",
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

  const visibleMediums = mediums.filter((item) => item.schoolId === schoolId);

  const handleSave = () => {
    if (!formData.mediumName || !formData.mediumCode) {
      alert("Please fill required fields");
      return;
    }

    const mediumNameExists = visibleMediums.some(
      (item) =>
        item.mediumName.toLowerCase().trim() ===
          formData.mediumName.toLowerCase().trim() && item.id !== editId
    );

    if (mediumNameExists) {
      alert("Medium already exists");
      return;
    }

    const mediumCodeExists = visibleMediums.some(
      (item) =>
        item.mediumCode.toLowerCase().trim() ===
          formData.mediumCode.toLowerCase().trim() && item.id !== editId
    );

    if (mediumCodeExists) {
      alert("Medium code already exists");
      return;
    }

    if (editId) {
      const updatedMediums = mediums
        .map((item) =>
          item.id === editId
            ? {
                ...item,
                ...formData,
              }
            : item
        )
        .sort((a, b) => a.mediumName.localeCompare(b.mediumName));

      setMediums(updatedMediums);

      alert("Medium updated successfully");
    } else {
      const newMedium = {
        id: Date.now(),
        schoolId,
        ...formData,
      };

      const updatedMediums = [...mediums, newMedium].sort((a, b) =>
        a.mediumName.localeCompare(b.mediumName)
      );

      setMediums(updatedMediums);

      alert("Medium added successfully");
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

    const result = visibleMediums.filter((item) => {
      const searchMatch = filters.searchText
        ? item.mediumName
            .toLowerCase()
            .includes(filters.searchText.toLowerCase()) ||
          item.mediumCode
            .toLowerCase()
            .includes(filters.searchText.toLowerCase())
        : true;

      return searchMatch;
    });

    if (result.length === 0) {
      alert("No medium found");
    }

    setIsSearched(true);
    setSelectedIds([]);
  };

  const filteredMediums = visibleMediums.filter((item) => {
    const searchMatch = appliedFilters.searchText
      ? item.mediumName
          .toLowerCase()
          .includes(appliedFilters.searchText.toLowerCase()) ||
        item.mediumCode
          .toLowerCase()
          .includes(appliedFilters.searchText.toLowerCase())
      : true;

    return searchMatch;
  });

  const selectedMediums = visibleMediums.filter((item) =>
    selectedIds.includes(item.id)
  );

  const selectedSingle =
    selectedMediums.length === 1 ? selectedMediums[0] : null;

  const handleEdit = () => {
    if (!selectedSingle) {
      alert("Select one medium");
      return;
    }

    setEditId(selectedSingle.id);

    setFormData({
      mediumName: selectedSingle.mediumName,
      mediumCode: selectedSingle.mediumCode,
      status: selectedSingle.status,
    });

    setShowForm(true);
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) {
      alert("Select medium");
      return;
    }

    const blockedMedium = visibleMediums.find(
      (item) =>
        selectedIds.includes(item.id) && usedMediums.includes(item.mediumName)
    );

    if (blockedMedium) {
      alert("Medium is already in use. Cannot delete.");
      return;
    }

    const ok = window.confirm("Delete selected medium?");

    if (!ok) return;

    setMediums(mediums.filter((item) => !selectedIds.includes(item.id)));

    setSelectedIds([]);
  };

  return (
    <div className="medium-page">
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
          <h1>Medium Management</h1>
          <p>Manage school mediums</p>
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
                  placeholder="Medium name or code"
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
              <h2>Medium List</h2>

              <div className="list-action-buttons">
                <AppButton type="primary" onClick={() => setShowForm(true)}>
                  + Add Medium
                </AppButton>

                <AppButton
                  type="view"
                  onClick={() => {
                    if (!selectedSingle) {
                      alert("Select one medium");
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
                          filteredMediums.length > 0 &&
                          selectedIds.length === filteredMediums.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(
                              filteredMediums.map((item) => item.id)
                            );
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                      />
                    </th>

                    <th>S.No</th>
                    <th>Medium Name</th>
                    <th>Medium Code</th>
                  </tr>
                </thead>

                <tbody>
                  {!isSearched ? (
                    <tr>
                      <td colSpan="4" className="empty-row">
                        Click Search to view mediums
                      </td>
                    </tr>
                  ) : filteredMediums.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="empty-row">
                        No medium found
                      </td>
                    </tr>
                  ) : (
                    filteredMediums.map((item, index) => (
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
                        <td>{item.mediumName}</td>
                        <td>{item.mediumCode}</td>
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
              <label>Medium Name</label>

              <input
                type="text"
                name="mediumName"
                placeholder="Example: English Medium"
                value={formData.mediumName}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Medium Code</label>

              <input
                type="text"
                name="mediumCode"
                placeholder="Example: ENG"
                value={formData.mediumCode}
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
              <h2>Medium Details</h2>

              <button
                className="popup-close-btn"
                onClick={() => setViewData(null)}
              >
                ×
              </button>
            </div>

            <div className="view-grid">
              <p>
                <strong>Medium Name:</strong> {viewData.mediumName}
              </p>

              <p>
                <strong>Medium Code:</strong> {viewData.mediumCode}
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

export default MediumManagement;