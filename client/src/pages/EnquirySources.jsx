import React, { useState, useEffect, useCallback } from "react";
import "./enquirySources.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { receptionService } from "../services/api";

function EnquirySources() {
  const [showForm, setShowForm] = useState(false);
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [toast, setToast] = useState("");

  const [formData, setFormData] = useState({ sourceName: "", description: "" });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const fetchSources = useCallback(async () => {
    try {
      setLoading(true);
      const res = await receptionService.getEnquirySources();
      setSources(res.data?.data || []);
    } catch {
      showToast("Failed to load enquiry sources");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSources(); }, [fetchSources]);

  const resetForm = () => {
    setFormData({ sourceName: "", description: "" });
    setEditId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!formData.sourceName.trim()) {
      showToast("Please enter source name");
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await receptionService.updateEnquirySource(editId, formData);
        showToast("Enquiry source updated successfully");
      } else {
        await receptionService.createEnquirySource(formData);
        showToast("Enquiry source added successfully");
      }
      resetForm();
      setShowForm(false);
      setSelectedIds([]);
      fetchSources();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to save enquiry source");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    if (!item) return;
    if (item.isUsed) {
      showToast("This enquiry source is already used in enquiry records");
      return;
    }
    setEditId(item._id);
    setFormData({ sourceName: item.sourceName, description: item.description || "" });
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      showToast("Select at least one source to delete");
      return;
    }
    const usedSource = sources.find((item) => selectedIds.includes(item._id) && item.isUsed);
    if (usedSource) {
      showToast("Cannot delete: source is already in use");
      return;
    }
    if (!window.confirm("Delete selected enquiry source(s)?")) return;
    try {
      await Promise.all(selectedIds.map((id) => receptionService.deleteEnquirySource(id)));
      showToast("Enquiry source(s) deleted successfully");
      setSelectedIds([]);
      fetchSources();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete enquiry source");
    }
  };

  return (
    <div className="enquiry-sources-page">
      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => {
            if (showForm) { resetForm(); setShowForm(false); }
            else window.location.href = "/reception-desk";
          }}
        >
          ←
        </AppButton>
        <div>
          <h1>{showForm ? "Add / Edit Enquiry Source" : "Enquiry Sources"}</h1>
          <p>Manage enquiry source master records</p>
        </div>
      </div>

      {!showForm && (
        <>
          <div className="top-action-bar">
            <AppButton type="primary" onClick={() => { resetForm(); setShowForm(true); }}>
              + Add Source
            </AppButton>
          </div>

          <div className="common-card">
            <div className="list-header">
              <h2>Enquiry Source List</h2>
              <div className="list-action-buttons">
                <AppButton
                  type="primary"
                  onClick={() => {
                    if (selectedIds.length !== 1) { showToast("Select exactly one source to edit"); return; }
                    const item = sources.find((s) => s._id === selectedIds[0]);
                    handleEdit(item);
                  }}
                >
                  Edit
                </AppButton>
                <AppButton type="delete" onClick={handleDelete}>Delete</AppButton>
              </div>
            </div>

            <div className="table-wrap">
              {loading ? (
                <SkeletonTable columns={4} rows={5} />
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={sources.length > 0 && selectedIds.length === sources.length}
                          onChange={(e) => setSelectedIds(e.target.checked ? sources.map((s) => s._id) : [])}
                        />
                      </th>
                      <th>S.No</th>
                      <th>Source Name</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sources.length === 0 ? (
                      <tr><td colSpan="4" className="empty-row">No enquiry source found</td></tr>
                    ) : (
                      sources.map((item, index) => (
                        <tr key={item._id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(item._id)}
                              onChange={() =>
                                setSelectedIds((prev) =>
                                  prev.includes(item._id)
                                    ? prev.filter((id) => id !== item._id)
                                    : [...prev, item._id]
                                )
                              }
                            />
                          </td>
                          <td>{index + 1}</td>
                          <td>{item.sourceName}</td>
                          <td>{item.description || "-"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {showForm && (
        <div className="common-card">
          <div className="source-form-grid">
            <div className="form-group">
              <label>Source Name *</label>
              <input
                type="text"
                name="sourceName"
                placeholder="Enter source name"
                value={formData.sourceName}
                onChange={handleChange}
              />
            </div>
            <div className="form-group full-width">
              <label>Description</label>
              <textarea
                name="description"
                placeholder="Enter description"
                value={formData.description}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="form-actions">
            <AppButton type="primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : editId ? "Update" : "Save"}
            </AppButton>
            <AppButton type="secondary" onClick={() => { resetForm(); setShowForm(false); }}>
              Go Back
            </AppButton>
          </div>
        </div>
      )}

      {toast && <div className="submodule-toast-banner">{toast}</div>}
    </div>
  );
}

export default EnquirySources;

