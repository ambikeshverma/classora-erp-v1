import React, { useState } from "react";
import "./houseManagement.css";
import AppButton from "../components/AppButton";

function HouseManagement() {
  const schoolId = localStorage.getItem("schoolId") || "SCH001";

  const usedHouses = ["Red House"];

  const [showForm, setShowForm] = useState(false);
  const [houses, setHouses] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewData, setViewData] = useState(null);
  const [editId, setEditId] = useState(null);

  const [searchText, setSearchText] = useState("");
  const [isSearched, setIsSearched] = useState(false);

  const [appliedFilters, setAppliedFilters] = useState({
    searchText: "",
  });

  const [formData, setFormData] = useState({
    houseName: "",
    houseCode: "",
    status: "Active",
  });

  const visibleHouses = houses.filter((item) => item.schoolId === schoolId);

  const resetForm = () => {
    setFormData({
      houseName: "",
      houseCode: "",
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
    if (!formData.houseName || !formData.houseCode) {
      alert("Please fill required fields");
      return;
    }

    const houseNameExists = visibleHouses.some(
      (item) =>
        item.houseName.toLowerCase().trim() ===
          formData.houseName.toLowerCase().trim() && item.id !== editId
    );

    if (houseNameExists) {
      alert("House already exists");
      return;
    }

    const houseCodeExists = visibleHouses.some(
      (item) =>
        item.houseCode.toLowerCase().trim() ===
          formData.houseCode.toLowerCase().trim() && item.id !== editId
    );

    if (houseCodeExists) {
      alert("House code already exists");
      return;
    }

    if (editId) {
      const updatedHouses = houses
        .map((item) =>
          item.id === editId
            ? {
                ...item,
                ...formData,
              }
            : item
        )
        .sort((a, b) => a.houseName.localeCompare(b.houseName));

      setHouses(updatedHouses);

      alert("House updated successfully");
    } else {
      const newHouse = {
        id: Date.now(),
        schoolId,
        ...formData,
      };

      const updatedHouses = [...houses, newHouse].sort((a, b) =>
        a.houseName.localeCompare(b.houseName)
      );

      setHouses(updatedHouses);

      alert("House added successfully");
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

    const result = visibleHouses.filter((item) => {
      const searchMatch = filters.searchText
        ? item.houseName
            .toLowerCase()
            .includes(filters.searchText.toLowerCase()) ||
          item.houseCode.toLowerCase().includes(filters.searchText.toLowerCase())
        : true;

      return searchMatch;
    });

    if (result.length === 0) {
      alert("No house found");
    }

    setIsSearched(true);
    setSelectedIds([]);
  };

  const filteredHouses = visibleHouses.filter((item) => {
    const searchMatch = appliedFilters.searchText
      ? item.houseName
          .toLowerCase()
          .includes(appliedFilters.searchText.toLowerCase()) ||
        item.houseCode
          .toLowerCase()
          .includes(appliedFilters.searchText.toLowerCase())
      : true;

    return searchMatch;
  });

  const selectedHouses = visibleHouses.filter((item) =>
    selectedIds.includes(item.id)
  );

  const selectedSingle =
    selectedHouses.length === 1 ? selectedHouses[0] : null;

  const handleEdit = () => {
    if (!selectedSingle) {
      alert("Select one house");
      return;
    }

    setEditId(selectedSingle.id);

    setFormData({
      houseName: selectedSingle.houseName,
      houseCode: selectedSingle.houseCode,
      status: selectedSingle.status,
    });

    setShowForm(true);
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) {
      alert("Select house");
      return;
    }

    const blockedHouse = visibleHouses.find(
      (item) =>
        selectedIds.includes(item.id) && usedHouses.includes(item.houseName)
    );

    if (blockedHouse) {
      alert("House is already in use. Cannot delete.");
      return;
    }

    const ok = window.confirm("Delete selected house?");

    if (!ok) return;

    setHouses(houses.filter((item) => !selectedIds.includes(item.id)));

    setSelectedIds([]);
  };

  return (
    <div className="house-page">
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
          <h1>House Management</h1>

          <p>Manage school houses</p>
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
                  placeholder="House name or code"
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
              <h2>House List</h2>

              <div className="list-action-buttons">
                <AppButton type="primary" onClick={() => setShowForm(true)}>
                  + Add House
                </AppButton>

                <AppButton
                  type="view"
                  onClick={() => {
                    if (!selectedSingle) {
                      alert("Select one house");
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
                          filteredHouses.length > 0 &&
                          selectedIds.length === filteredHouses.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(
                              filteredHouses.map((item) => item.id)
                            );
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                      />
                    </th>

                    <th>S.No</th>
                    <th>House Name</th>
                    <th>House Code</th>
                  </tr>
                </thead>

                <tbody>
                  {!isSearched ? (
                    <tr>
                      <td colSpan="4" className="empty-row">
                        Click Search to view houses
                      </td>
                    </tr>
                  ) : filteredHouses.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="empty-row">
                        No house found
                      </td>
                    </tr>
                  ) : (
                    filteredHouses.map((item, index) => (
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
                        <td>{item.houseName}</td>
                        <td>{item.houseCode}</td>
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
              <label>House Name</label>

              <input
                type="text"
                name="houseName"
                placeholder="Example: Red House"
                value={formData.houseName}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>House Code</label>

              <input
                type="text"
                name="houseCode"
                placeholder="Example: RED"
                value={formData.houseCode}
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
              <h2>House Details</h2>

              <button
                className="popup-close-btn"
                onClick={() => setViewData(null)}
              >
                ×
              </button>
            </div>

            <div className="view-grid">
              <p>
                <strong>House Name:</strong> {viewData.houseName}
              </p>

              <p>
                <strong>House Code:</strong> {viewData.houseCode}
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

export default HouseManagement;