import React, { useState } from "react";
import "./vehicleManagement.css";
import AppButton from "../components/AppButton";

function VehicleManagement() {
  const schoolId = localStorage.getItem("schoolId") || "SCH001";

  // Future API source:
  // HR & Staff Management -> Staff Management
  // Position = Driver
  const driverEmployees = [
    {
      id: 1,
      name: "Mukesh Kumar",
      mobile: "9876543210",
      position: "Driver",
    },
    {
      id: 2,
      name: "Ramesh Yadav",
      mobile: "9876543211",
      position: "Driver",
    },
  ];

  // Future API source:
  // HR & Staff Management -> Staff Management
  // Position = Conductor
  const conductorEmployees = [
    {
      id: 1,
      name: "Suresh Verma",
      mobile: "9876543220",
      position: "Conductor",
    },
    {
      id: 2,
      name: "Amit Singh",
      mobile: "9876543221",
      position: "Conductor",
    },
  ];

  const documentTypes = [
    "Registration Certificate (RC)",
    "Fitness Certificate",
    "Insurance",
    "Pollution Certificate (PUC)",
    "Permit",
    "Road Tax Receipt",
    "Other",
  ];

  const [showForm, setShowForm] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  const [vehicleNameFilter, setVehicleNameFilter] = useState("");
  const [driverNameFilter, setDriverNameFilter] = useState("");
  const [isSearched, setIsSearched] = useState(false);
  const [editId, setEditId] = useState(null);

  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [showDownloadPopup, setShowDownloadPopup] = useState(false);
  const [downloadVehicle, setDownloadVehicle] = useState(null);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState([]);

  const [uploadData, setUploadData] = useState({
    documentType: "",
    file: null,
  });

  const [appliedFilters, setAppliedFilters] = useState({
    vehicleNameFilter: "",
    driverNameFilter: "",
  });

  const [formData, setFormData] = useState({
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
    documents: [],
    isAssigned: false,
  });

  const resetForm = () => {
    setFormData({
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
      documents: [],
      isAssigned: false,
    });

    setEditId(null);
    setUploadData({
      documentType: "",
      file: null,
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleDriverChange = (e) => {
    const selectedId = Number(e.target.value);

    const selectedDriver = driverEmployees.find(
      (item) => item.id === selectedId
    );

    if (!selectedDriver) {
      setFormData({
        ...formData,
        driverId: "",
        driverName: "",
        driverMobile: "",
      });
      return;
    }

    setFormData({
      ...formData,
      driverId: selectedDriver.id,
      driverName: selectedDriver.name,
      driverMobile: selectedDriver.mobile,
    });
  };

  const handleConductorChange = (e) => {
    const selectedId = Number(e.target.value);

    const selectedConductor = conductorEmployees.find(
      (item) => item.id === selectedId
    );

    if (!selectedConductor) {
      setFormData({
        ...formData,
        conductorId: "",
        conductorName: "",
        conductorMobile: "",
      });
      return;
    }

    setFormData({
      ...formData,
      conductorId: selectedConductor.id,
      conductorName: selectedConductor.name,
      conductorMobile: selectedConductor.mobile,
    });
  };

  const selectedVehicles = vehicles.filter((item) =>
    selectedIds.includes(item.id)
  );

  const selectedSingle = selectedVehicles.length === 1 ? selectedVehicles[0] : null;

  const handleSearch = () => {
    if (!vehicleNameFilter.trim()) {
  alert("Enter vehicle name to search");
  return;
}

   const filters = {
  vehicleNameFilter,
  driverNameFilter,
};

    setAppliedFilters(filters);
    setIsSearched(true);
    setSelectedIds([]);

    const result = vehicles.filter((item) => {
      const schoolMatch = item.schoolId === schoolId;

      const vehicleMatch = item.vehicleName
  ? item.vehicleName
      .toLowerCase()
      .includes(
        filters.vehicleNameFilter.toLowerCase()
      )
  : false;

      const driverMatch = filters.driverNameFilter
        ? item.driverName
            ?.toLowerCase()
            .includes(filters.driverNameFilter.toLowerCase())
        : true;

      return schoolMatch && vehicleMatch && driverMatch;
    });

    if (result.length === 0) {
      alert("No vehicle found");
    }
  };

  const filteredVehicles = (isSearched
    ? vehicles.filter((item) => {
        const schoolMatch = item.schoolId === schoolId;

        const vehicleMatch = appliedFilters.vehicleNoFilter
          ? item.vehicleNo
            ? item.vehicleNo
                .toLowerCase()
                .includes(appliedFilters.vehicleNoFilter.toLowerCase())
            : false
          : true;

        const driverMatch = appliedFilters.driverNameFilter
          ? item.driverName
              ?.toLowerCase()
              .includes(appliedFilters.driverNameFilter.toLowerCase())
          : true;

        return schoolMatch && vehicleMatch && driverMatch;
      })
    : vehicles.filter((item) => item.schoolId === schoolId)
  ).sort((a, b) =>
    String(a.vehicleName || "").localeCompare(String(b.vehicleName || ""))
  );

  const handleSave = () => {
    if (!formData.vehicleName || !formData.totalSeats) {
      alert("Vehicle name and total seats are required");
      return;
    }

    if (Number(formData.totalSeats) <= 0) {
      alert("Total seats must be greater than zero");
      return;
    }

    const duplicateVehicleName =
  vehicles.find(
    (item) =>
      item.schoolId === schoolId &&
      item.vehicleName
        .trim()
        .toLowerCase() ===
        formData.vehicleName
          .trim()
          .toLowerCase() &&
      item.id !== editId
  );

if (duplicateVehicleName) {

  alert(
    "Vehicle name already exists"
  );

  return;
}

    if (formData.vehicleNo.trim()) {
      const duplicateVehicle = vehicles.find(
        (item) =>
          item.schoolId === schoolId &&
          item.vehicleNo &&
          item.vehicleNo.trim().toLowerCase() ===
            formData.vehicleNo.trim().toLowerCase() &&
          item.id !== editId
      );

      if (duplicateVehicle) {
        alert("Vehicle number already exists");
        return;
      }
    }

    if (editId) {
      setVehicles(
        vehicles.map((item) =>
          item.id === editId
            ? {
                ...item,
                ...formData,
                schoolId,
              }
            : item
        )
      );

      alert("Vehicle updated successfully");
    } else {
      const newVehicle = {
        id: Date.now(),
        schoolId,
        ...formData,
      };

      setVehicles([...vehicles, newVehicle]);

      alert("Vehicle added successfully");
    }

    resetForm();
    setShowForm(false);
  };

  const handleEdit = () => {
    if (!selectedSingle) {
      alert("Select one vehicle");
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
      documents: selectedSingle.documents || [],
      isAssigned: selectedSingle.isAssigned || false,
    });

    setEditId(selectedSingle.id);
    setShowForm(true);
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) {
      alert("Select vehicle");
      return;
    }

    const assignedVehicle = selectedVehicles.some((item) => item.isAssigned);

    if (assignedVehicle) {
      alert("Assigned vehicle cannot be deleted");
      return;
    }

    const ok = window.confirm("Delete selected vehicle?");
    if (!ok) return;

    setVehicles(vehicles.filter((item) => !selectedIds.includes(item.id)));
    setSelectedIds([]);
  };

  const handleOpenUploadPopup = () => {
    setUploadData({
      documentType: "",
      file: null,
    });
    setShowUploadPopup(true);
  };

  const handleUploadDocument = () => {
    if (!uploadData.documentType || !uploadData.file) {
      alert("Select document type and file");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    if (!allowedTypes.includes(uploadData.file.type)) {
      alert("Only PDF, JPG, JPEG and PNG files are allowed");
      return;
    }

    const newDocument = {
      id: Date.now(),
      documentType: uploadData.documentType,
      fileName: uploadData.file.name,
      file: uploadData.file,
      fileUrl: URL.createObjectURL(uploadData.file),
    };

    const existingIndex =
  (formData.documents || []).findIndex(
    (doc) =>
      doc.documentType ===
      uploadData.documentType
  );

let updatedDocuments =
  [...(formData.documents || [])];

if (existingIndex >= 0) {

  updatedDocuments[
    existingIndex
  ] = newDocument;

} else {

  updatedDocuments.push(
    newDocument
  );

}

setFormData({
  ...formData,
  documents: updatedDocuments,
});

    setUploadData({
      documentType: "",
      file: null,
    });

    setShowUploadPopup(false);
    alert("Document uploaded successfully");
  };

  const openDownloadPopup = (vehicle) => {
    setDownloadVehicle(vehicle);
    setSelectedDocumentIds([]);
    setShowDownloadPopup(true);
  };

  const handleDocumentSelection = (documentId) => {
    setSelectedDocumentIds((prev) =>
      prev.includes(documentId)
        ? prev.filter((id) => id !== documentId)
        : [...prev, documentId]
    );
  };

  const handleSelectAllDocuments = (checked) => {
    if (!downloadVehicle?.documents) return;

    if (checked) {
      setSelectedDocumentIds(downloadVehicle.documents.map((doc) => doc.id));
    } else {
      setSelectedDocumentIds([]);
    }
  };

  const handleDownloadDocuments = () => {
    if (selectedDocumentIds.length === 0) {
      alert("Select document");
      return;
    }

    const selectedDocs = (downloadVehicle?.documents || []).filter((doc) =>
      selectedDocumentIds.includes(doc.id)
    );

    selectedDocs.forEach((doc) => {
      const link = document.createElement("a");
      link.href = doc.fileUrl;
      link.download = doc.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(doc.fileUrl);
    });
  };

  const currentYear = new Date().getFullYear();

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
              window.location.href = "/transport-System";
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
                          filteredVehicles.length > 0 &&
                          selectedIds.length === filteredVehicles.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(filteredVehicles.map((item) => item.id));
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                      />
                    </th>
                    <th>Vehicle Name</th>
                    <th>Vehicle No</th>
                    <th>Driver Name</th>
                    <th>Driver Mobile</th>
                    <th>No of Seats</th>
                    <th>Download</th>
                  </tr>
                </thead>

                <tbody>
                  {vehicles.filter((item) => item.schoolId === schoolId).length === 0 ? (
                    <tr>
                      <td colSpan="7" className="empty-row">
                        No vehicles created yet. Please create a vehicle.
                      </td>
                    </tr>
                  ) : filteredVehicles.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="empty-row">
                        No vehicle found
                      </td>
                    </tr>
                  ) : (
                    filteredVehicles.map((item) => (
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

                        <td>{item.vehicleName || "-"}</td>
                        <td>{item.vehicleNo || "-"}</td>
                        <td>{item.driverName || "-"}</td>
                        <td>{item.driverMobile || "-"}</td>
                        <td>{item.totalSeats || "-"}</td>
                        <td>
                          <button
                            type="button"
                            className="download-icon-btn"
                            onClick={() => openDownloadPopup(item)}
                          >
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
              <input
  type="date"
  name="madeYear"
  value={formData.madeYear}
  onChange={handleChange}
/>
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
              <select value={formData.driverId} onChange={handleDriverChange}>
                <option value="">Select Driver</option>
                {driverEmployees
                  .filter((item) => item.position === "Driver")
                  .map((item) => (
                    <option key={item.id} value={item.id}>
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
              <select value={formData.conductorId} onChange={handleConductorChange}>
                <option value="">Select Conductor</option>
                {conductorEmployees
                  .filter((item) => item.position === "Conductor")
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="form-group vehicle-document-upload-field">
              <label>Conductor Mobile</label>
              <div className="vehicle-upload-inline">
                <input type="text" value={formData.conductorMobile} readOnly />
                <button
                  type="button"
                  className="upload-icon-btn"
                  onClick={handleOpenUploadPopup}
                >
                  ⬆️
                </button>
              </div>
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

      {showUploadPopup && (
        <div className="popup-overlay">
          <div className="view-popup">
            <div className="popup-head">
              <h2>Upload Vehicle Document</h2>
              <button
                type="button"
                className="popup-close-btn"
                onClick={() => setShowUploadPopup(false)}
              >
                ×
              </button>
            </div>

            <div className="form-group">
              <label>Document Type</label>
              <select
                value={uploadData.documentType}
                onChange={(e) =>
                  setUploadData({
                    ...uploadData,
                    documentType: e.target.value,
                  })
                }
              >
                <option value="">Select Document</option>
                {documentTypes.map((item) => (
                  <option key={item} value={item}>
                    {item}
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
    onChange={(e) =>
      setUploadData({
        ...uploadData,
        file: e.target.files?.[0] || null,
      })
    }
  />
</div>

<div className="form-actions">

  <AppButton
    type="primary"
    onClick={handleUploadDocument}
  >
    Upload
  </AppButton>

  <AppButton
    type="delete"
    onClick={() => {

      if (!uploadData.documentType) {
        alert("Select document type");
        return;
      }

      setFormData({
        ...formData,
        documents:
          (formData.documents || []).filter(
            (doc) =>
              doc.documentType !==
              uploadData.documentType
          ),
      });

      alert(
        "Document deleted successfully"
      );

    }}
  >
    Delete
  </AppButton>

</div>
          </div>
        </div>
      )}

      {showDownloadPopup && (
        <div className="popup-overlay">
          <div className="view-popup">
            <div className="popup-head">
              <h2>Download Documents</h2>
              <button
                type="button"
                className="popup-close-btn"
                onClick={() => setShowDownloadPopup(false)}
              >
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
                          downloadVehicle?.documents?.length > 0 &&
                          selectedDocumentIds.length ===
                            downloadVehicle.documents.length
                        }
                        onChange={(e) =>
                          handleSelectAllDocuments(e.target.checked)
                        }
                      />
                    </th>
                    <th>Document Name</th>
                    <th>File Name</th>
                  </tr>
                </thead>

                <tbody>
                  {!downloadVehicle?.documents ||
                  downloadVehicle.documents.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="empty-row">
                        No document uploaded
                      </td>
                    </tr>
                  ) : (
                    downloadVehicle.documents.map((doc) => (
                      <tr key={doc.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedDocumentIds.includes(doc.id)}
                            onChange={() => handleDocumentSelection(doc.id)}
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
              <AppButton type="primary" onClick={handleDownloadDocuments}>
                Download
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VehicleManagement;