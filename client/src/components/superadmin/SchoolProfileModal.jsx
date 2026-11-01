import React, { useState } from "react";
import { superAdminService } from "../../services/api";
import { Modal, apiError } from "./ui";

// Edit a school's profile and the login email of its School Admin (uses the existing update endpoint)
const SchoolProfileModal = ({ school, onClose, onSaved, notify }) => {
  const [form, setForm] = useState({
    schoolName: school.schoolName || "",
    principalName: school.principalName || "",
    email: school.email || "",
    contactNo: school.contactNo || "",
    address: school.address || "",
    website: school.website || "",
  });
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const save = async () => {
    if (!form.schoolName.trim() || !form.principalName.trim() || !form.contactNo.trim() || !form.address.trim() || !form.email.trim()) {
      return notify("Fill all required fields", "error");
    }
    setSaving(true);
    try {
      await superAdminService.updateSchool(school._id, form);
      notify("School profile updated");
      onSaved();
      onClose();
    } catch (err) {
      notify(apiError(err, "Failed to update the school"), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`Profile · ${school.campusId}`}
      onClose={onClose}
      footer={
        <>
          <button className="sa2-btn" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="sa2-btn primary" onClick={save} disabled={saving}>
            {saving ? "Saving..." : "Save profile"}
          </button>
        </>
      }
    >
      <div className="sa2-form-grid">
        <div className="sa2-field">
          <label htmlFor="sp-name">School name *</label>
          <input id="sp-name" className="sa2-input" value={form.schoolName} onChange={set("schoolName")} />
        </div>
        <div className="sa2-field">
          <label htmlFor="sp-principal">Principal *</label>
          <input id="sp-principal" className="sa2-input" value={form.principalName} onChange={set("principalName")} />
        </div>
        <div className="sa2-field">
          <label htmlFor="sp-email">School Admin login email *</label>
          <input id="sp-email" type="email" className="sa2-input" value={form.email} onChange={set("email")} />
        </div>
        <div className="sa2-field">
          <label htmlFor="sp-contact">Contact number *</label>
          <input id="sp-contact" className="sa2-input" value={form.contactNo} onChange={set("contactNo")} />
        </div>
      </div>
      <div className="sa2-field">
        <label htmlFor="sp-address">Address *</label>
        <textarea id="sp-address" className="sa2-textarea" value={form.address} onChange={set("address")} />
      </div>
      <div className="sa2-field">
        <label htmlFor="sp-web">Website</label>
        <input id="sp-web" className="sa2-input" value={form.website} onChange={set("website")} />
      </div>
      <p className="sa2-muted">Changing the login email signs the School Admin out so they must log in again with the new email.</p>
    </Modal>
  );
};

export default SchoolProfileModal;
