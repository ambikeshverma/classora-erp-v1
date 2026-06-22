import React, { useState } from "react";
import "./followUpManagement.css";
import AppButton from "../components/AppButton";

function FollowUpManagement() {
  const followUpTypes = ["Call", "WhatsApp", "Visit", "SMS", "Meeting"];

  const followUpStatuses = [
    "Interested",
    "Call Back Later",
    "No Response",
    "Not Interested",
    "Admission Confirmed",
  ];

  const demoActiveEnquiries = [
    {
      id: 1,
      schoolId: "SCH001",
      enquiryId: 101,
      studentName: "Aman",
      mobileNumber: "9876543210",
      classInterested: "Class 6",
      status: "NEW",
    },
    {
      id: 2,
      schoolId: "SCH001",
      enquiryId: 102,
      studentName: "Riya",
      mobileNumber: "9876543211",
      classInterested: "Class 9",
      status: "FOLLOW-UP",
    },
  ];

  const [showForm, setShowForm] = useState(false);
  const [followUps, setFollowUps] = useState([]);
  const [editId, setEditId] = useState(null);
  const [viewData, setViewData] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const [formData, setFormData] = useState({
    enquiryId: "",
    studentName: "",
    mobileNumber: "",
    classInterested: "",
    followUpDate: new Date().toISOString().split("T")[0],
    followUpType: "",
    discussionNotes: "",
    nextFollowUpDate: "",
    followUpStatus: "Interested",
  });

  const resetForm = () => {
    setFormData({
      enquiryId: "",
      studentName: "",
      mobileNumber: "",
      classInterested: "",
      followUpDate: new Date().toISOString().split("T")[0],
      followUpType: "",
      discussionNotes: "",
      nextFollowUpDate: "",
      followUpStatus: "Interested",
    });

    setEditId(null);
  };

  const handleEnquirySelect = (e) => {
    const enquiry = demoActiveEnquiries.find(
      (item) => String(item
        .enquiryId) === String(e.target.value)
    );

    if (!enquiry) {
      resetForm();
      return;
    }

    setFormData({
      ...formData,
      enquiryId: enquiry.enquiryId,
      studentName: enquiry.studentName,
      mobileNumber: enquiry.mobileNumber,
      classInterested: enquiry.classInterested,
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSave = () => {
    if (
      !formData.enquiryId ||
      !formData.followUpDate ||
      !formData.followUpType ||
      !formData.followUpStatus
    ) {
      alert("Please fill all required fields");
      return;
    }

    if (
      (formData.followUpStatus === "Interested" ||
        formData.followUpStatus === "Call Back Later" ||
        formData.followUpStatus === "No Response") &&
      !formData.nextFollowUpDate
    ) {
      alert("Please select next follow-up date");
      return;
    }

    if (formData.followUpStatus === "Admission Confirmed") {
      alert("Admission confirmed successfully");
    }
    if (editId) {
      setFollowUps(
        followUps.map((item) =>
          item.id === editId
            ? {
                ...item,
                ...formData,
                updatedOn: new Date().toLocaleString(),
              }
            : item
        )
      );

      alert("Follow-up updated successfully");
    } else {
      const newFollowUp = {
        id: Date.now(),
        schoolId: "SCH001",
        ...formData,
        createdOn: new Date().toLocaleString(),
        updatedOn: "",
      };

      setFollowUps([...followUps, newFollowUp]);
      alert("Follow-up saved successfully");
    }

    resetForm();
    setShowForm(false);
    setSelectedIds([]);
  };

  const handleEdit = (item) => {
    setEditId(item.id);

    setFormData({
      enquiryId: item.enquiryId,
      studentName: item.studentName,
      mobileNumber: item.mobileNumber,
      classInterested: item.classInterested,
      followUpDate: item.followUpDate,
      followUpType: item.followUpType,
      discussionNotes: item.discussionNotes,
      nextFollowUpDate: item.nextFollowUpDate,
      followUpStatus: item.followUpStatus,
    });

    setShowForm(true);
  };

  const handleDelete = (ids) => {
    const ok = window.confirm("Delete selected follow-up?");
    if (!ok) return;

    setFollowUps(followUps.filter((item) => !ids.includes(item.id)));
    setSelectedIds([]);
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((selectedId) => selectedId !== id)
        : [...prev, id]
    );
  };
  const selectedFollowUps = followUps.filter((item) =>
    selectedIds.includes(item.id)
  );

  const selectedSingle =
    selectedFollowUps.length === 1 ? selectedFollowUps[0] : null;

  return (
    <div className="follow-up-page">
      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => {
            if (showForm) {
              resetForm();
              setShowForm(false);
            } else {
              window.location.href = "/reception-desk";
            }
          }}
        >
          ←
        </AppButton>

        <div>
          <h1>
            {showForm ? "Add / Edit Follow-up" : "Follow-up Management"}
          </h1>
          <p>Manage enquiry follow-ups and admission conversion</p>
        </div>
      </div>

      {!showForm && (
        <div className="common-card">
          <div className="list-header">
            <h2>Follow-up List</h2>

            <div className="list-action-buttons">
              <AppButton type="primary" onClick={() => setShowForm(true)}>
                + Add Follow-up
              </AppButton>

              <AppButton
                type="view"
                onClick={() => {
                  if (!selectedSingle) {
                    alert("Select one follow-up to view");
                    return;
                  }

                  setViewData(selectedSingle);
                }}
              >
                View
              </AppButton>

              <AppButton
                type="primary"
                onClick={() => {
                  if (!selectedSingle) {
                    alert("Select one follow-up to edit");
                    return;
                  }

                  handleEdit(selectedSingle);
                }}
              >
                Edit
              </AppButton>

              <AppButton
                type="delete"
                onClick={() => {
                  if (selectedIds.length === 0) {
                    alert("Select follow-up to delete");
                    return;
                  }

                  handleDelete(selectedIds);
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
                        followUps.length > 0 &&
                        selectedIds.length === followUps.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(followUps.map((item) => item.id));
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
                  <th>Next Date</th>
                </tr>
              </thead>

              <tbody>
                {followUps.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-row">
                      No follow-up found
                    </td>
                  </tr>
                ) : (
                  followUps.map((item, index) => (
                    <tr key={item.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggleSelect(item.id)}
                        />
                      </td>

                      <td>{index + 1}</td>

                      <td>{item.studentName}</td>

                      <td>{item.mobileNumber}</td>

                      <td>{item.classInterested}</td>

                      <td>{item.followUpStatus}</td>

                      <td>{item.nextFollowUpDate || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <div className="common-card">

          <div className="enquiry-form-grid">

            <div className="form-group">
              <label>Select Enquiry *</label>

              <select
                value={formData.enquiryId}
                onChange={handleEnquirySelect}
              >
                <option value="">Select Enquiry</option>

                {demoActiveEnquiries.map((item) => (
                  <option
                    key={item.enquiryId}
                    value={item.enquiryId}
                  >
                    {item.studentName} - {item.classInterested}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Student Name</label>

              <input
                value={formData.studentName}
                readOnly
              />
            </div>

            <div className="form-group">
              <label>Mobile Number</label>

              <input
                value={formData.mobileNumber}
                readOnly
              />
            </div>

            <div className="form-group">
              <label>Class</label>

              <input
                value={formData.classInterested}
                readOnly
              />
            </div>

            <div className="form-group">
              <label>Follow-up Date *</label>

              <input
                type="date"
                name="followUpDate"
                value={formData.followUpDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Follow-up Type *</label>

              <select
                name="followUpType"
                value={formData.followUpType}
                onChange={handleChange}
              >
                <option value="">Select Type</option>

                {followUpTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Next Follow-up Date</label>

              <input
                type="date"
                name="nextFollowUpDate"
                value={formData.nextFollowUpDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Follow-up Status *</label>

              <select
                name="followUpStatus"
                value={formData.followUpStatus}
                onChange={handleChange}
              >
                {followUpStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group full-width">
              <label>Discussion Notes</label>

              <textarea
                name="discussionNotes"
                value={formData.discussionNotes}
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
              <h2>Follow-up Details</h2>

              <button
                className="popup-close-btn"
                onClick={() => setViewData(null)}
              >
                ×
              </button>
            </div>

            <div className="view-grid">
              <p>
                <strong>Student:</strong> {viewData.studentName
                }
              </p>

              <p>
                <strong>Mobile:</strong> {viewData.mobileNumber}
              </p>

              <p>
                <strong>Class:</strong> {viewData.classInterested}
              </p>

              <p>
                <strong>Follow-up Date:</strong> {viewData.followUpDate}
              </p>

              <p>
                <strong>Follow-up Type:</strong> {viewData.followUpType}
              </p>

              <p>
                <strong>Next Follow-up:</strong>{" "}
                {viewData.nextFollowUpDate || "-"}
              </p>

              <p>
                <strong>Status:</strong> {viewData.followUpStatus}
              </p>

              <p>
                <strong>Discussion Notes:</strong>{" "}
                {viewData.discussionNotes || "-"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FollowUpManagement;