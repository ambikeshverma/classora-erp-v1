import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./vehicleManagement.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { transportService } from "../services/api";

import { notifyAlert, confirmDialog } from "../utils/toast";
const DOCUMENT_TYPES = [
  "Registration Certificate (RC)",
  "Fitness Certificate",
  "Insurance",
  "Pollution Certificate (PUC)",
  "Permit",
  "Road Tax Receipt",
  "Other",
];

const ALLOWED_FILE_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
const MAX_DOCUMENT_BYTES = 6 * 1024 * 1024;

const EMPTY_FORM = {
  vehicleName: "",
  vehicleNo: "",
  madeYear: "",
  totalSeats: "",
  driverId: "",
  driverName: "",
  driverMobile: "",
  conductorId: "",
  conductorName: "",
  conductorMobile: "",
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

const downloadDataUrl = (fileUrl, fileName) => {
  const link = document.createElement("a");
  link.href = fileUrl;
  link.download = fileName || "document";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

function VehicleManagement() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [conductors, setConductors] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const [vehicleNameFilter, setVehicleNameFilter] = useState("");
  const [driverNameFilter, setDriverNameFilter] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({ vehicleName: "", driverName: "" });

  const [formData, setFormData] = useState(EMPTY_FORM);

  // Documents of the vehicle being edited (without files), plus changes made in the form
  const [savedDocuments, setSavedDocuments] = useState([]);
  const [newDocuments, setNewDocuments] = useState([]);
  const [removedTypes, setRemovedTypes] = useState([]);

  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [uploadData, setUploadData] = useState({ documentType: "", file: null });

  const [showDownloadPopup, setShowDownloadPopup] = useState(false);
  const [downloadVehicle, setDownloadVehicle] = useState(null);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState([]);

  const loadVehicles = useCallback(async () => {
    try {
      setLoading(true);
      const [vehicleRes, staffRes] = await Promise.all([
        transportService.getVehicles(),
        transportService.getStaffOptions(),
      ]);

      setVehicles(vehicleRes.data?.data || []);
      setDrivers(staffRes.data?.data?.drivers || []);
      setConductors(staffRes.data?.data?.conductors || []);
    } catch (err) {
      notifyAlert(err.response?.data?.message || "Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setEditId(null);
    setSavedDocuments([]);
    setNewDocuments([]);
    setRemovedTypes([]);
    setUploadData({ documentType: "", file: null });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCrewChange = (role, list) => (e) => {
    const member = list.find((item) => item._id === e.target.value);

    setFormData({
      ...formData,
      [`${role}Id`]: member?._id || "",
      [`${role}Name`]: member?.name || "",
      [`${role}Mobile`]: member?.mobile || "",
    });
  };

  const selectedVehicles = vehicles.filter((item) => selectedIds.includes(item._id));
  const selectedSingle = selectedVehicles.length === 1 ? selectedVehicles[0] : null;

  const filteredVehicles = useMemo(
    () =>
      vehicles.filter(
        (item) =>
          (!appliedFilters.vehicleName ||
            String(item.vehicleName || "").toLowerCase().includes(appliedFilters.vehicleName.toLowerCase())) &&
          (!appliedFilters.driverName ||
            String(item.driverName || "").toLowerCase().includes(appliedFilters.driverName.toLowerCase()))
      ),
    [vehicles, appliedFilters]
  );

  const handleSearch = () => {
    setAppliedFilters({ vehicleName: vehicleNameFilter.trim(), driverName: driverNameFilter.trim() });
    setSelectedIds([]);
  };

  // Documents shown in the upload popup: saved ones that are not removed, plus the new uploads
  const formDocuments = [
    ...savedDocuments
      .filter((doc) => !removedTypes.includes(doc.documentType) && !newDocuments.some((n) => n.documentType === doc.documentType))
      .map((doc) => ({ documentType: doc.documentType, fileName: doc.fileName })),
    ...newDocuments.map((doc) => ({ documentType: doc.documentType, fileName: doc.fileName })),
  ];

  const handleSave = async () => {
    if (!formData.vehicleName.trim() || !formData.totalSeats) {
      notifyAlert("Vehicle name and total seats are required");
      return;
    }

    if (Number(formData.totalSeats) <= 0) {
      notifyAlert("Total seats must be greater than zero");
      return;
    }

    const payload = {
      vehicleName: formData.vehicleName,
      vehicleNo: formData.vehicleNo,
      madeYear: formData.madeYear,
      totalSeats: Number(formData.totalSeats),
      driverId: formData.driverId,
      conductorId: formData.conductorId,
      newDocuments,
      removeDocumentTypes: removedTypes,
    };

    try {
      setSaving(true);

      if (editId) {
        await transportService.updateVehicle(editId, payload);
        notifyAlert("Vehicle updated successfully");
      } else {
        await transportService.createVehicle(payload);
        notifyAlert("Vehicle added successfully");
      }

      resetForm();
      setShowForm(false);
      await loadVehicles();
    } catch (err) {
      notifyAlert(err.response?.data?.message || "Failed to save vehicle");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    if (!selectedSingle) {
      notifyAlert("Select one vehicle");
      return;
    }

    setFormData({
      vehicleName: selectedSingle.vehicleName || "",
      vehicleNo: selectedSingle.vehicleNo || "",
      madeYear: selectedSingle.madeYear || "",
      totalSeats: selectedSingle.totalSeats || "",
      driverId: selectedSingle.driverId || "",
      driverName: selectedSingle.driverName || "",
      driverMobile: selectedSingle.driverMobile || "",
      conductorId: selectedSingle.conductorId || "",
      conductorName: selectedSingle.conductorName || "",
      conductorMobile: selectedSingle.conductorMobile || "",
    });
    setSavedDocuments(selectedSingle.documents || []);
    setNewDocuments([]);
    setRemovedTypes([]);
    setEditId(selectedSingle._id);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      notifyAlert("Select vehicle");
      return;
    }

    if (selectedVehicles.some((item) => item.isAssigned)) {
      notifyAlert("Assigned vehicle cannot be deleted");
      return;
    }

    if (!await confirmDialog("Delete selected vehicle?")) return;

    try {
      setSaving(true);
      await Promise.all(selectedIds.map((id) => transportService.deleteVehicle(id)));
      setSelectedIds([]);
    } catch (err) {
      notifyAlert(err.response?.data?.message || "Failed to delete vehicle");
    } finally {
      setSaving(false);
      await loadVehicles();
    }
  };

  const handleUploadDocument = async () => {
    if (!uploadData.documentType || !uploadData.file) {
      notifyAlert("Select document type and file");
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(uploadData.file.type)) {
      notifyAlert("Only PDF, JPG, JPEG and PNG files are allowed");
      return;
    }

    if (uploadData.file.size > MAX_DOCUMENT_BYTES) {
      notifyAlert("File must be smaller than 6 MB");
      return;
    }

    try {
      const fileUrl = await readFileAsDataUrl(uploadData.file);

      setNewDocuments((prev) => [
        ...prev.filter((doc) => doc.documentType !== uploadData.documentType),
        { documentType: uploadData.documentType, fileName: uploadData.file.name, fileUrl },
      ]);
      setRemovedTypes((prev) => prev.filter((type) => type !== uploadData.documentType));
      setUploadData({ documentType: "", file: null });
      setShowUploadPopup(false);
      notifyAlert("Document added. It is saved with the vehicle.");
    } catch {
      notifyAlert("Failed to read file");
    }
  };

  const handleRemoveDocument = () => {
    if (!uploadData.documentType) {
      notifyAlert("Select document type");
      return;
    }

    setNewDocuments((prev) => prev.filter((doc) => doc.documentType !== uploadData.documentType));
    setRemovedTypes((prev) => (prev.includes(uploadData.documentType) ? prev : [...prev, uploadData.documentType]));
    notifyAlert("Document removed. The change is saved with the vehicle.");
  };

  const openDownloadPopup = (vehicle) => {
    setDownloadVehicle(vehicle);
    setSelectedDocumentIds([]);
    setShowDownloadPopup(true);
  };

  const handleDownloadDocuments = async () => {
    if (selectedDocumentIds.length === 0) {
      notifyAlert("Select document");
      return;
    }

    try {
      setSaving(true);

      for (const docId of selectedDocumentIds) {
        const res = await transportService.getVehicleDocument(downloadVehicle._id, docId);
        const file = res.data?.data;
        if (file?.fileUrl) downloadDataUrl(file.fileUrl, file.fileName);
      }
    } catch (err) {
      notifyAlert(err.response?.data?.message || "Failed to download document");
    } finally {
      setSaving(false);
    }
  };

  const driverOptions = drivers.some((item) => item._id === formData.driverId) || !formData.driverId
    ? drivers
    : [...drivers, { _id: formData.driverId, name: formData.driverName, mobile: formData.driverMobile }];

  const conductorOptions = conductors.some((item) => item._id === formData.conductorId) || !formData.conductorId
    ? conductors
    : [...conductors, { _id: formData.conductorId, name: formData.conductorName, mobile: formData.conductorMobile }];

  return (
    <div className="vehicle-page">
      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => {
            if (showForm) {
              resetForm();
              setShowForm(false);
            } else {
              navigate("/transport-system");
            }
          }}
        >
          ←
        </AppButton>

        <div>
          <h1>Vehicle Management</h1>
          <p>Manage transport vehicles</p>
        </div>
      </div>

      {!showForm && (
        <>
          <div className="common-card">
            <div className="filter-grid">
              <div className="form-group">
                <label>Vehicle Name</label>
                <input
                  type="text"
                  placeholder="Enter vehicle name"
                  value={vehicleNameFilter}
                  onChange={(e) => setVehicleNameFilter(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Driver Name</label>
                <input
                  type="text"
                  placeholder="Driver name"
                  value={driverNameFilter}
                  onChange={(e) => setDriverNameFilter(e.target.value)}
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
              <h2>Vehicle List</h2>

              <div className="list-action-buttons">
                <AppButton
                  type="primary"
                  onClick={() => {
                    resetForm();
                    setShowForm(true);
                  }}
                >
                  + Add Vehicle
                </AppButton>

                <AppButton type="primary" onClick={handleEdit} disabled={saving}>
                  Edit
                </AppButton>

                <AppButton type="delete" onClick={handleDelete} disabled={saving}>
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
                        checked={filteredVehicles.length > 0 && selectedIds.length === filteredVehicles.length}
                        onChange={(e) => setSelectedIds(e.target.checked ? filteredVehicles.map((item) => item._id) : [])}
                      />
                    </th>
                    <th>Vehicle Name</th>
                    <th>Vehicle No</th>
                    <th>Driver Name</th>
                    <th>Driver Mobile</th>
                    <th>No of Seats</th>
                    <th>Students</th>
                    <th>Download</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" style={{ padding: "4px 0", border: "none" }}>
                        <SkeletonTable rows={5} columns={8} />
                      </td>
                    </tr>
                  ) : vehicles.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="empty-row">
                        No vehicles created yet. Please create a vehicle.
                      </td>
                    </tr>
                  ) : filteredVehicles.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="empty-row">
                        No vehicle found
                      </td>
                    </tr>
                  ) : (
                    filteredVehicles.map((item) => (
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

                        <td>{item.vehicleName || "-"}</td>
                        <td>{item.vehicleNo || "-"}</td>
                        <td>{item.driverName || "-"}</td>
                        <td>{item.driverMobile || "-"}</td>
                        <td>{item.totalSeats || "-"}</td>
                        <td>{item.studentCount}</td>
                        <td>
                          <button type="button" className="download-icon-btn" onClick={() => openDownloadPopup(item)}>
                            ⬇️
                          </button>
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
              <label>Vehicle Name</label>
              <input
                type="text"
                name="vehicleName"
                placeholder="Vehicle name"
                value={formData.vehicleName}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Vehicle No</label>
              <input
                type="text"
                name="vehicleNo"
                placeholder="Vehicle number"
                value={formData.vehicleNo}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Made Year</label>
              <input type="date" name="madeYear" value={formData.madeYear} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>No of Seats</label>
              <input
                type="number"
                name="totalSeats"
                min="1"
                placeholder="Total seats"
                value={formData.totalSeats}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Driver Name</label>
              <select value={formData.driverId} onChange={handleCrewChange("driver", driverOptions)}>
                <option value="">{driverOptions.length === 0 ? "No driver in staff" : "Select Driver"}</option>
                {driverOptions.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Driver Mobile</label>
              <input type="text" value={formData.driverMobile} readOnly />
            </div>

            <div className="form-group">
              <label>Conductor Name</label>
              <select value={formData.conductorId} onChange={handleCrewChange("conductor", conductorOptions)}>
                <option value="">{conductorOptions.length === 0 ? "No conductor in staff" : "Select Conductor"}</option>
                {conductorOptions.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group vehicle-document-upload-field">
              <label>Conductor Mobile</label>
              <div className="vehicle-upload-inline">
                <input type="text" value={formData.conductorMobile} readOnly />
                <button type="button" className="upload-icon-btn" onClick={() => setShowUploadPopup(true)}>
                  ⬆️
                </button>
              </div>
            </div>
          </div>

          {(drivers.length === 0 || conductors.length === 0) && (
            <p className="empty-row">
              Drivers and conductors come from Staff Management. Add staff with a Driver / Conductor position to select them.
            </p>
          )}

          {formDocuments.length > 0 && (
            <p className="empty-row">Documents: {formDocuments.map((doc) => doc.documentType).join(", ")}</p>
          )}

          <div className="form-actions">
            <AppButton type="primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editId ? "Update" : "Save"}
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

      {showUploadPopup && (
        <div className="popup-overlay">
          <div className="view-popup">
            <div className="popup-head">
              <h2>Upload Vehicle Document</h2>
              <button type="button" className="popup-close-btn" onClick={() => setShowUploadPopup(false)}>
                ×
              </button>
            </div>

            <div className="form-group">
              <label>Document Type</label>
              <select
                value={uploadData.documentType}
                onChange={(e) => setUploadData({ ...uploadData, documentType: e.target.value })}
              >
                <option value="">Select Document</option>
                {DOCUMENT_TYPES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                    {formDocuments.some((doc) => doc.documentType === item) ? " (uploaded)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Choose File / Camera</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                capture="environment"
                onChange={(e) => setUploadData({ ...uploadData, file: e.target.files?.[0] || null })}
              />
            </div>

            <div className="form-actions">
              <AppButton type="primary" onClick={handleUploadDocument}>
                Upload
              </AppButton>

              <AppButton type="delete" onClick={handleRemoveDocument}>
                Delete
              </AppButton>
            </div>
          </div>
        </div>
      )}

      {showDownloadPopup && downloadVehicle && (
        <div className="popup-overlay">
          <div className="view-popup">
            <div className="popup-head">
              <h2>Download Documents</h2>
              <button type="button" className="popup-close-btn" onClick={() => setShowDownloadPopup(false)}>
                ×
              </button>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        checked={
                          downloadVehicle.documents.length > 0 &&
                          selectedDocumentIds.length === downloadVehicle.documents.length
                        }
                        onChange={(e) =>
                          setSelectedDocumentIds(e.target.checked ? downloadVehicle.documents.map((doc) => doc._id) : [])
                        }
                      />
                    </th>
                    <th>Document Name</th>
                    <th>File Name</th>
                  </tr>
                </thead>

                <tbody>
                  {downloadVehicle.documents.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="empty-row">
                        No document uploaded
                      </td>
                    </tr>
                  ) : (
                    downloadVehicle.documents.map((doc) => (
                      <tr key={doc._id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedDocumentIds.includes(doc._id)}
                            onChange={() =>
                              setSelectedDocumentIds((prev) =>
                                prev.includes(doc._id) ? prev.filter((id) => id !== doc._id) : [...prev, doc._id]
                              )
                            }
                          />
                        </td>
                        <td>{doc.documentType}</td>
                        <td>{doc.fileName}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="form-actions">
              <AppButton type="primary" onClick={handleDownloadDocuments} disabled={saving}>
                {saving ? "Downloading..." : "Download"}
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VehicleManagement;
