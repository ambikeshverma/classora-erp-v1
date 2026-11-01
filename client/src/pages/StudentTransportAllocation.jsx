import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./studentTransportAllocation.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { transportService } from "../services/api";

import { notifyAlert, confirmDialog } from "../utils/toast";
const EMPTY_FILTERS = { className: "", section: "", q: "" };

function StudentTransportAllocation() {
  const navigate = useNavigate();

  const [meta, setMeta] = useState(null);
  const [metaLoading, setMetaLoading] = useState(true);

  const [result, setResult] = useState({ items: [], total: 0, pages: 1 });
  const [listLoading, setListLoading] = useState(false);
  const [isSearched, setIsSearched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);

  const [selectedIds, setSelectedIds] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [showRemovePopup, setShowRemovePopup] = useState(false);

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);

  const [removeType, setRemoveType] = useState("FULL");
  const [selectedMonths, setSelectedMonths] = useState([]);

  const [formData, setFormData] = useState({ routeId: "", vehicleId: "" });

  useEffect(() => {
    let active = true;

    transportService
      .getMeta()
      .then((res) => {
        if (active) setMeta(res.data?.data || null);
      })
      .catch((err) => {
        console.error("Failed to load transport meta", err);
      })
      .finally(() => {
        if (active) setMetaLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const loadStudents = async (nextFilters, nextPage) => {
    try {
      setListLoading(true);

      const params = { page: nextPage };
      if (nextFilters.className) params.className = nextFilters.className;
      if (nextFilters.section) params.section = nextFilters.section;
      if (nextFilters.q.trim()) params.q = nextFilters.q.trim();

      const res = await transportService.getAllocations(params);
      setResult(res.data?.data || { items: [], total: 0, pages: 1 });
    } catch (err) {
      notifyAlert(err.response?.data?.message || "Failed to load students");
    } finally {
      setListLoading(false);
    }
  };

  const classes = meta?.classes || [];
  const routes = meta?.routes || [];
  const vehicles = meta?.vehicles || [];
  const periods = meta?.periods || [];

  const sectionOptions = filters.className
    ? classes.find((item) => item.className === filters.className)?.sections || []
    : [...new Set(classes.flatMap((item) => item.sections))];

  const handleSearch = async () => {
    setAppliedFilters(filters);
    setIsSearched(true);
    setSelectedIds([]);
    setPage(1);
    await loadStudents(filters, 1);
  };

  const changePage = async (nextPage) => {
    setPage(nextPage);
    setSelectedIds([]);
    await loadStudents(appliedFilters, nextPage);
  };

  const students = result.items;
  const selectedStudents = students.filter((item) => selectedIds.includes(item._id));
  const selectedSingle = selectedStudents.length === 1 ? selectedStudents[0] : null;

  const allocateButtonText =
    selectedIds.length > 0 && selectedStudents.every((item) => item.allocation?.vehicleId)
      ? "Update Transport"
      : "Allocate Transport";

  const handleAllocateOpen = () => {
    if (selectedIds.length === 0) {
      notifyAlert("Select student");
      return;
    }

    setFormData({ routeId: "", vehicleId: "" });
    setShowForm(true);
  };

  const handleSaveAllocation = async () => {
    if (!formData.routeId || !formData.vehicleId) {
      notifyAlert("Select route and vehicle");
      return;
    }

    try {
      setSaving(true);
      const res = await transportService.bulkAllocate({
        studentIds: selectedIds,
        routeId: formData.routeId,
        vehicleId: formData.vehicleId,
      });

      notifyAlert(res.data?.message || "Transport allocated successfully");

      setSelectedIds([]);
      setShowForm(false);
      setFormData({ routeId: "", vehicleId: "" });
      await loadStudents(appliedFilters, page);
    } catch (err) {
      notifyAlert(err.response?.data?.message || "Failed to allocate transport");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveTransportOpen = () => {
    if (selectedIds.length === 0) {
      notifyAlert("Select one student");
      return;
    }

    if (selectedIds.length > 1) {
      notifyAlert("Select only one student");
      return;
    }

    if (!selectedSingle.allocation) {
      notifyAlert("Transport is not allocated to this student");
      return;
    }

    setRemoveType("MONTHS");
    setSelectedMonths(selectedSingle.allocation.removedPeriods || []);
    setShowRemovePopup(true);
  };

  const handleSaveRemoveTransport = async () => {
    if (removeType === "MONTHS" && selectedMonths.length === 0) {
      notifyAlert("Select at least one month");
      return;
    }

    if (removeType === "FULL" && !await confirmDialog("Remove full transport from selected student?")) return;

    try {
      setSaving(true);
      const res = await transportService.removeAllocation({
        studentId: selectedSingle._id,
        mode: removeType,
        periods: selectedMonths,
      });

      notifyAlert(res.data?.message || "Transport updated successfully");

      setSelectedIds([]);
      setSelectedMonths([]);
      setShowRemovePopup(false);
      await loadStudents(appliedFilters, page);
    } catch (err) {
      notifyAlert(err.response?.data?.message || "Failed to remove transport");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="student-transport-page">
      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => {
            if (showForm) {
              setShowForm(false);
            } else {
              navigate("/transport-system");
            }
          }}
        >
          ←
        </AppButton>

        <div>
          <h1>Student Transport Allocation</h1>
          <p>Allocate route and vehicle to active students</p>
        </div>
      </div>

      {!showForm && (
        <>
          <div className="common-card">
            <div className="filter-grid">
              <div className="form-group">
                <label>Class</label>
                <select
                  value={filters.className}
                  disabled={metaLoading}
                  onChange={(e) => setFilters({ ...filters, className: e.target.value, section: "" })}
                >
                  <option value="">All</option>
                  {classes.map((item) => (
                    <option key={item.className} value={item.className}>
                      {item.className}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Section</label>
                <select
                  value={filters.section}
                  disabled={metaLoading}
                  onChange={(e) => setFilters({ ...filters, section: e.target.value })}
                >
                  <option value="">All</option>
                  {sectionOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group search-full">
                <label>Search Student</label>
                <input
                  type="text"
                  placeholder="Name, father name, admission no or mobile"
                  value={filters.q}
                  onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                />
              </div>
            </div>

            <div className="search-btn-row transport-actions">
              <AppButton type="primary" onClick={handleSearch} disabled={listLoading}>
                Search
              </AppButton>
            </div>
          </div>

          <div className="common-card">
            <div className="list-header">
              <h2>Student Transport List</h2>

              <div className="list-action-buttons">
                <AppButton type="primary" onClick={handleAllocateOpen} disabled={saving}>
                  {allocateButtonText}
                </AppButton>

                <AppButton type="delete" onClick={handleRemoveTransportOpen} disabled={saving}>
                  Remove Transport
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
                    <th>Class</th>
                    <th>Section</th>
                    <th>Student Name</th>
                    <th>Father Name</th>
                    <th>Mobile</th>
                    <th>Route</th>
                    <th>Vehicle</th>
                  </tr>
                </thead>

                <tbody>
                  {!isSearched ? (
                    <tr>
                      <td colSpan="8" className="empty-row">
                        Please click Search
                      </td>
                    </tr>
                  ) : listLoading ? (
                    <tr>
                      <td colSpan="8" style={{ padding: "4px 0", border: "none" }}>
                        <SkeletonTable rows={6} columns={8} />
                      </td>
                    </tr>
                  ) : students.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="empty-row">
                        No active student found
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student._id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(student._id)}
                            onChange={() =>
                              setSelectedIds((prev) =>
                                prev.includes(student._id) ? prev.filter((id) => id !== student._id) : [...prev, student._id]
                              )
                            }
                          />
                        </td>

                        <td>{student.className}</td>
                        <td>{student.section}</td>
                        <td>{student.studentName}</td>
                        <td>{student.fatherName}</td>
                        <td>{student.mobile}</td>
                        <td>{student.allocation?.routeName || "-"}</td>
                        <td>
                          {student.allocation?.vehicleNo || student.allocation?.vehicleName || "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {isSearched && result.pages > 1 && (
              <div className="search-btn-row">
                <AppButton type="secondary" disabled={page <= 1 || listLoading} onClick={() => changePage(page - 1)}>
                  Previous
                </AppButton>

                <span>
                  Page {page} of {result.pages} ({result.total} students)
                </span>

                <AppButton
                  type="secondary"
                  disabled={page >= result.pages || listLoading}
                  onClick={() => changePage(page + 1)}
                >
                  Next
                </AppButton>
              </div>
            )}
          </div>
        </>
      )}

      {showForm && (
        <div className="common-card">
          <div className="enquiry-form-grid">
            <div className="form-group">
              <label>Selected Students</label>
              <input type="text" value={`${selectedIds.length} student selected`} readOnly />
            </div>

            <div className="form-group">
              <label>Route</label>
              <select value={formData.routeId} onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}>
                <option value="">{routes.length === 0 ? "No route available" : "Select Route"}</option>
                {routes.map((route) => (
                  <option key={route._id} value={route._id}>
                    {route.routeName} - ₹{route.monthlyFee}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Vehicle</label>
              <select value={formData.vehicleId} onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}>
                <option value="">{vehicles.length === 0 ? "No vehicle available" : "Select Vehicle"}</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle._id} value={vehicle._id}>
                    {vehicle.vehicleNo || "No number"} {vehicle.vehicleName ? `- ${vehicle.vehicleName}` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(routes.length === 0 || vehicles.length === 0) && (
            <p className="empty-row">Add routes in Route Management and vehicles in Vehicle Management first.</p>
          )}

          <div className="form-actions">
            <AppButton type="primary" onClick={handleSaveAllocation} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </AppButton>

            <AppButton
              type="secondary"
              onClick={() => {
                setShowForm(false);
                setFormData({ routeId: "", vehicleId: "" });
              }}
            >
              Go Back
            </AppButton>
          </div>
        </div>
      )}

      {showRemovePopup && (
        <div className="popup-overlay">
          <div className="view-popup">
            <div className="popup-head">
              <h2>Remove Transport</h2>

              <button className="popup-close-btn" onClick={() => setShowRemovePopup(false)}>
                ×
              </button>
            </div>

            <div className="remove-options">
              <label>
                <input type="radio" name="removeType" checked={removeType === "FULL"} onChange={() => setRemoveType("FULL")} />
                Remove Full Transport
              </label>

              <label>
                <input
                  type="radio"
                  name="removeType"
                  checked={removeType === "MONTHS"}
                  onChange={() => setRemoveType("MONTHS")}
                />
                Remove Selected Months
              </label>
            </div>

            {removeType === "MONTHS" && (
              <div className="month-grid">
                {periods.map((period) => (
                  <label key={period.key}>
                    <input
                      type="checkbox"
                      checked={selectedMonths.includes(period.key)}
                      onChange={() =>
                        setSelectedMonths((prev) =>
                          prev.includes(period.key) ? prev.filter((item) => item !== period.key) : [...prev, period.key]
                        )
                      }
                    />
                    {period.key}
                  </label>
                ))}
              </div>
            )}

            <div className="form-actions">
              <AppButton type="primary" onClick={handleSaveRemoveTransport} disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </AppButton>

              <AppButton type="secondary" onClick={() => setShowRemovePopup(false)}>
                Go Back
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentTransportAllocation;
