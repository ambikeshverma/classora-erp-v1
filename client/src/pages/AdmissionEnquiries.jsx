import React, { useState } from "react";
import "./admissionEnquiries.css";
import AppButton from "../components/AppButton";

function AdmissionEnquiries() {
  const sources = ["Walk-in", "WhatsApp", "Facebook", "Instagram", "Reference", "Website"];
  const statuses = ["NEW", "FOLLOW-UP", "CLOSED", "CONVERTED"];
  const [selectedIds, setSelectedIds] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [enquiries, setEnquiries] = useState([]);
  const [editId, setEditId] = useState(null);
  const [viewData, setViewData] = useState(null);

  const [formData, setFormData] = useState({
    studentName: "",
    mobileNumber: "",
    classInterested: "",
    fatherName: "",
    address: "",
    source: "",
    status: "NEW",
    enquiryDate: new Date().toISOString().split("T")[0],
    remarks: "",
  });

  const resetForm = () => {
    setFormData({
      studentName: "",
      mobileNumber: "",
      classInterested: "",
      fatherName: "",
      address: "",
      source: "",
      status: "NEW",
      enquiryDate: new Date().toISOString().split("T")[0],
      remarks: "",
    });
    setEditId(null);
  };

  const generateEnquiryNo = () => {
    return `ENQ-2026-${String(enquiries.length + 1).padStart(4, "0")}`;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    if (!formData.studentName || !formData.mobileNumber || !formData.classInterested || !formData.source) {
      alert("Please fill all required fields");
      return;
    }

    if (editId) {
      setEnquiries(
        enquiries.map((item) =>
          item.id === editId ? { ...item, ...formData } : item
        )
      );
      alert("Enquiry updated successfully");
    } else {
      const newEnquiry = {
        id: Date.now(),
        schoolId: "SCH001",
        enquiryNo: generateEnquiryNo(),
        ...formData,
      };

      setEnquiries([...enquiries, newEnquiry]);
      alert("Enquiry added successfully");
    }

    resetForm();
    setShowForm(false);
  };

  const handleEdit = (item) => {
    setEditId(item.id);
    setFormData({
      studentName: item.studentName,
      mobileNumber: item.mobileNumber,
      classInterested: item.classInterested,
      fatherName: item.fatherName,
      address: item.address,
      source: item.source,
      status: item.status,
      enquiryDate: item.enquiryDate,
      remarks: item.remarks,
    });

    setShowForm(true);
  };

  const handleDelete = (id) => {
    const ok = window.confirm("Delete this enquiry?");
    if (!ok) return;

    setEnquiries(enquiries.filter((item) => item.id !== id));
  };

  const activeEnquiries = enquiries.filter(
    (item) =>
      item.status !== "CLOSED" &&
      item.status !== "CONVERTED"
  );

  return (
    <div className="enquiry-management-page">

      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => {
            if (showForm) {
              resetForm();
              setShowForm(false);
            } else {
              window.location.href = "/admissions";
            }
          }}
        >
          ←
        </AppButton>

        <div>
          <h1>
            {showForm ? "Add / Edit Enquiry" : "Admission Enquiries"}
          </h1>

          <p>Manage student admission enquiries</p>
        </div>
      </div>

      {!showForm && (
        <>
          <div className="top-action-bar">
            <AppButton
              type="primary"
              onClick={() => setShowForm(true)}
            >
              + New Enquiry
            </AppButton>
          </div>

          <div className="common-card">
            <div className="list-header">
  <h2>Active Enquiry List</h2>

  <div className="list-action-buttons">

    <AppButton
      type="view"
      onClick={() => {
        if (selectedIds.length !== 1) {
          alert("Select one enquiry");
          return;
        }

        const selected = enquiries.find(
          (item) => item.id === selectedIds[0]
        );

        setViewData(selected);
      }}
    >
      View
    </AppButton>

    <AppButton
      type="edit"
      onClick={() => {
        if (selectedIds.length !== 1) {
          alert("Select one enquiry");
          return;
        }

        const selected = enquiries.find(
          (item) => item.id === selectedIds[0]
        );

        handleEdit(selected);
      }}
    >
      Edit
    </AppButton>

    <AppButton
      type="delete"
      onClick={() => {
        if (selectedIds.length === 0) {
          alert("Select enquiry");
          return;
        }

        handleDelete(selectedIds[0]);
      }}
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
      activeEnquiries.length > 0 &&
      selectedIds.length === activeEnquiries.length
    }
    onChange={(e) => {
      if (e.target.checked) {
        setSelectedIds(activeEnquiries.map((item) => item.id));
      } else {
        setSelectedIds([]);
      }
    }}
  />
</th>
                    <th>S.No</th>
                    <th>Student</th>
                    <th>Mobile</th>
                    <th>Class</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>

                <tbody>
                  {activeEnquiries.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="empty-row">
                        No active enquiry found
                      </td>
                    </tr>
                  ) : (
                    activeEnquiries.map((item, index) => (
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

                        <td>{item.studentName}</td>

                        <td>{item.mobileNumber}</td>

                        <td>{item.classInterested}</td>

                        <td>
                          <span
                            className={`status-badge status-${item.status.toLowerCase()}`}
                          >
                            {item.status}
                          </span>
                        </td>

                        <td>{item.enquiryDate}</td>
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
              <label>Student Name *</label>

              <input
                name="studentName"
                value={formData.studentName}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Mobile Number *</label>

              <input
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Class Interested *</label>

              <input
                name="classInterested"
                value={formData.classInterested}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Father Name</label>

              <input
                name="fatherName"
                value={formData.fatherName}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Source *</label>

              <select
                name="source"
                value={formData.source}
                onChange={handleChange}
              >
                <option value="">Select Source</option>

                {sources.map((source) => (
                  <option key={source} value={source}>
                    {source}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Status</label>

              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Enquiry Date</label>

              <input
                type="date"
                name="enquiryDate"
                value={formData.enquiryDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-group full-width">
              <label>Address</label>

              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
              ></textarea>
            </div>

            <div className="form-group full-width">
              <label>Remarks</label>

              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
              ></textarea>
            </div>

          </div>

          <div className="form-actions">

            <AppButton
              type="primary"
              onClick={handleSave}
            >
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
              <h2>Enquiry Details</h2>

              <button
                className="popup-close-btn"
                onClick={() => setViewData(null)}
              >
                ×
              </button>
            </div>

            <div className="view-grid">
              <p>
                <strong>Enquiry No:</strong> {viewData.enquiryNo}
              </p>

              <p>
                <strong>Student:</strong> {viewData.studentName}
              </p>

              <p>
                <strong>Mobile:</strong> {viewData.mobileNumber}
              </p>

              <p>
                <strong>Class:</strong> {viewData.classInterested}
              </p>

              <p>
                <strong>Father:</strong> {viewData.fatherName || "-"}
              </p>

              <p>
                <strong>Source:</strong> {viewData.source}
              </p>

              <p>
                <strong>Status:</strong> {viewData.status}
              </p>

              <p>
                <strong>Date:</strong> {viewData.enquiryDate}
              </p>

              <p>
                <strong>Address:</strong> {viewData.address || "-"}
              </p>

              <p>
                <strong>Remarks:</strong> {viewData.remarks || "-"}
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdmissionEnquiries;