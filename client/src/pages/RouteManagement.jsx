import React, { useCallback, useEffect, useState } from "react";
import "./routeManagement.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { transportService } from "../services/api";

function RouteManagement() {
  const [showForm, setShowForm] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const [routeNameFilter, setRouteNameFilter] = useState("");
  const [startPointFilter, setStartPointFilter] = useState("");
  const [endPointFilter, setEndPointFilter] = useState("");

  const [isSearched, setIsSearched] = useState(false);
  const [editId, setEditId] = useState(null);

  const [appliedFilters, setAppliedFilters] = useState({
    routeNameFilter: "",
    startPointFilter: "",
    endPointFilter: "",
  });

  const [formData, setFormData] = useState({
    routeName: "",
    startPoint: "",
    endPoint: "",
    distance: "",
    monthlyFee: "",
    isAssigned: false,
  });

  const resetForm = () => {
    setFormData({
      routeName: "",
      startPoint: "",
      endPoint: "",
      distance: "",
      monthlyFee: "",
      isAssigned: false,
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

  const loadRoutes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await transportService.getRoutes();
      setRoutes(res.data?.data || []);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to load routes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  const selectedRoutes = routes.filter((item) =>
    selectedIds.includes(item._id)
  );

  const selectedSingle =
    selectedRoutes.length === 1 ? selectedRoutes[0] : null;

  const handleSearch = () => {
    if (!routeNameFilter.trim()) {
      alert("Enter route name to search");
      return;
    }

    const filters = {
      routeNameFilter,
      startPointFilter,
      endPointFilter,
    };

    setAppliedFilters(filters);

    const result = routes.filter((item) => {
      const routeNameMatch = item.routeName
        .toLowerCase()
        .includes(filters.routeNameFilter.toLowerCase());

      const startPointMatch = filters.startPointFilter
        ? item.startPoint
            .toLowerCase()
            .includes(filters.startPointFilter.toLowerCase())
        : true;

      const endPointMatch = filters.endPointFilter
        ? item.endPoint
            .toLowerCase()
            .includes(filters.endPointFilter.toLowerCase())
        : true;

      return (
        routeNameMatch &&
        startPointMatch &&
        endPointMatch
      );
    });

    if (result.length === 0) {
      alert("No route found");
    }

    setIsSearched(true);
    setSelectedIds([]);
  };

  const filteredRoutes = routes.filter((item) => {
    const routeNameMatch = appliedFilters.routeNameFilter
      ? item.routeName
          .toLowerCase()
          .includes(appliedFilters.routeNameFilter.toLowerCase())
      : true;

    const startPointMatch = appliedFilters.startPointFilter
      ? item.startPoint
          .toLowerCase()
          .includes(appliedFilters.startPointFilter.toLowerCase())
      : true;

    const endPointMatch = appliedFilters.endPointFilter
      ? item.endPoint
          .toLowerCase()
          .includes(appliedFilters.endPointFilter.toLowerCase())
      : true;

    return (
  routeNameMatch &&
  startPointMatch &&
  endPointMatch
);
})
.sort((a, b) =>
  a.routeName.localeCompare(
    b.routeName
  )
);

  const handleSave = async () => {
    if (!formData.routeName || !formData.monthlyFee) {
      alert("Route name and monthly fee are required");
      return;
    }

    if (Number(formData.monthlyFee) <= 0) {
      alert("Monthly fee must be greater than zero");
      return;
    }

    if (
  formData.distance &&
  Number(formData.distance) <= 0
) {
  alert("Distance must be greater than zero");
  return;
}

    const duplicateRoute = routes.find(
      (item) =>
        item.routeName.trim().toLowerCase() ===
          formData.routeName.trim().toLowerCase() &&
        item._id !== editId
    );

    if (duplicateRoute) {
      alert("Route name already exists");
      return;
    }

    const payload = {
      routeName: formData.routeName,
      startPoint: formData.startPoint,
      endPoint: formData.endPoint,
      distance: formData.distance,
      monthlyFee: formData.monthlyFee,
    };

    try {
      setSaving(true);

      if (editId) {
        await transportService.updateRoute(editId, payload);
        alert("Route updated successfully");
      } else {
        await transportService.createRoute(payload);
        alert("Route added successfully");
      }

      await loadRoutes();
      resetForm();
      setShowForm(false);
      setIsSearched(true);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save route");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    if (!selectedSingle) {
      alert("Select one route");
      return;
    }

    setFormData({
      routeName: selectedSingle.routeName || "",
      startPoint: selectedSingle.startPoint || "",
      endPoint: selectedSingle.endPoint || "",
      distance: selectedSingle.distance || "",
      monthlyFee: selectedSingle.monthlyFee || "",
      isAssigned: selectedSingle.isAssigned || false,
    });

    setEditId(selectedSingle._id);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      alert("Select route");
      return;
    }

    const assignedRoute = selectedRoutes.some(
      (item) => item.isAssigned
    );

    if (assignedRoute) {
      alert(
        "This route is assigned to students and cannot be deleted."
      );
      return;
    }

    const ok = window.confirm("Delete selected route?");
    if (!ok) return;

    try {
      setSaving(true);
      await Promise.all(
        selectedIds.map((id) => transportService.deleteRoute(id))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete route");
    } finally {
      setSaving(false);
    }

    setSelectedIds([]);
    await loadRoutes();
  };

  return (
    <div className="route-page">
      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => {
            if (showForm) {
              resetForm();
              setShowForm(false);
            } else {
              window.location.href = "/transport-System";
            }
          }}
        >
          ←
        </AppButton>

        <div>
          <h1>Route Management</h1>
          <p>Manage transport routes and route fees</p>
        </div>
      </div>

      {!showForm && (
        <>
          <div className="common-card">
            <div className="filter-grid">
              <div className="form-group">
                <label>Route Name</label>
                <input
                  type="text"
                  placeholder="Enter route name"
                  value={routeNameFilter}
                  onChange={(e) =>
                    setRouteNameFilter(e.target.value)
                  }
                />
              </div>

              <div className="form-group">
                <label>Start Point</label>
                <input
                  type="text"
                  placeholder="Start point"
                  value={startPointFilter}
                  onChange={(e) =>
                    setStartPointFilter(e.target.value)
                  }
                />
              </div>

              <div className="form-group">
                <label>End Point</label>
                <input
                  type="text"
                  placeholder="End point"
                  value={endPointFilter}
                  onChange={(e) =>
                    setEndPointFilter(e.target.value)
                  }
                />
              </div>
            </div>

            <div className="search-btn-row">
              <AppButton
                type="primary"
                onClick={handleSearch}
              >
                Search
              </AppButton>
            </div>
          </div>

          <div className="common-card">
            <div className="list-header">
              <h2>Route List</h2>

              <div className="list-action-buttons">
                <AppButton
                  type="primary"
                  onClick={() => setShowForm(true)}
                >
                  + Add Route
                </AppButton>

                <AppButton
                  type="primary"
                  onClick={handleEdit}
                >
                  Edit
                </AppButton>

                <AppButton
                  type="delete"
                  onClick={handleDelete}
                >
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
                          isSearched &&
                          filteredRoutes.length > 0 &&
                          selectedIds.length ===
                            filteredRoutes.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(
                              filteredRoutes.map((item) => item._id)
                            );
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                      />
                    </th>

                    <th>Route Name</th>
                    <th>Start Point</th>
                    <th>End Point</th>
                    <th>Distance</th>
                    <th>Monthly Fee</th>
                  </tr>
                </thead>

                <tbody>
  {loading ? (
    <tr>
      <td colSpan="6">
        <SkeletonTable rows={4} columns={6} />
      </td>
    </tr>
  ) : routes.length === 0 ? (
    <tr>
      <td
        colSpan="6"
        className="empty-row"
      >
        No routes created yet.
        Please create a route.
      </td>
    </tr>
                  ) : filteredRoutes.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty-row">
                        No route found
                      </td>
                    </tr>
                  ) : (
                    filteredRoutes.map((item) => (
                      <tr key={item._id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(
                              item._id
                            )}
                            onChange={() => {
                              setSelectedIds((prev) =>
                                prev.includes(item._id)
                                  ? prev.filter(
                                      (id) => id !== item._id
                                    )
                                  : [...prev, item._id]
                              );
                            }}
                          />
                        </td>

                        <td>{item.routeName}</td>
                        <td>{item.startPoint || "-"}</td>
                        <td>{item.endPoint || "-"}</td>
                        <td>
                          {item.distance
                            ? `${item.distance} KM`
                            : "-"}
                        </td>
                       <td>
  {item.monthlyFee
    ? `₹${item.monthlyFee}`
    : "-"}
</td>
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
              <label>Route Name</label>
              <input
                type="text"
                name="routeName"
                placeholder="Example: Abc Route"
                value={formData.routeName}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Start Point</label>
              <input
                type="text"
                name="startPoint"
                placeholder="Start point"
                value={formData.startPoint}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>End Point</label>
              <input
                type="text"
                name="endPoint"
                placeholder="End point"
                value={formData.endPoint}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Distance</label>
              <input
                type="number"
                name="distance"
                placeholder="Example: 12"
                min="0"
                value={formData.distance}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Monthly Fee</label>
              <input
                type="number"
                name="monthlyFee"
                placeholder="Example: 425"
                value={formData.monthlyFee}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-actions">
            <AppButton
  type="primary"
  onClick={handleSave}
  disabled={saving}
>
  {saving
    ? "Saving..."
    : editId
    ? "Update"
    : "Save"}
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
    </div>
  );
}

export default RouteManagement;