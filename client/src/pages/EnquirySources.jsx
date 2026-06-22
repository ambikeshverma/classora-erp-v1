import React, { useState } from "react";
import "./enquirySources.css";
import AppButton from "../components/AppButton";

function EnquirySources() {
  const [showForm, setShowForm] = useState(false);

  const [sources, setSources] = useState([
    {
      id: 1,
      schoolId: "SCH001",
      sourceName: "Walk-in",
      description: "Direct school visit enquiry",
      isUsed: true,
    },
    {
      id: 2,
      schoolId: "SCH001",
      sourceName: "WhatsApp",
      description: "Enquiry received from WhatsApp",
      isUsed: false,
    },
  ]);

  const [editId, setEditId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const [formData, setFormData] = useState({
    sourceName: "",
    description: "",
  });

  const resetForm = () => {
    setFormData({
      sourceName: "",
      description: "",
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
    if (!formData.sourceName) {
      alert("Please enter source name");
      return;
    }

    if (editId) {
      setSources(
        sources.map((item) =>
          item.id === editId
            ? {
                ...item,
                ...formData,
              }
            : item
        )
      );

      alert("Enquiry source updated successfully");
    } else {
      const newSource = {
        id: Date.now(),
        schoolId: "SCH001",
        ...formData,
        isUsed: false,
      };

      setSources([...sources, newSource]);

      alert("Enquiry source added successfully");
    }

    resetForm();
    setShowForm(false);
    setSelectedIds([]);
  };

  const handleEdit = (item) => {
    if (!item) return;

    if (item.isUsed) {
      alert("This enquiry source is already used in enquiry records");
      return;
    }

    setEditId(item.id);

    setFormData({
      sourceName: item.sourceName,
      description: item.description,
    });

    setShowForm(true);
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) {
      alert("Select source");
      return;
    }

    const usedSource = sources.find(
      (item) => selectedIds.includes(item.id) && item.isUsed
    );

    if (usedSource) {
      alert("This enquiry source is already used in enquiry records");
      return;
    }

    const confirmDelete = window.confirm("Delete selected enquiry source?");

    if (!confirmDelete) return;

    setSources(
      sources.filter((item) => !selectedIds.includes(item.id))
    );

    setSelectedIds([]);
  };

  return (
    <div className="enquiry-sources-page">
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
            {showForm
              ? "Add / Edit Enquiry Source"
              : "Enquiry Sources"}
          </h1>

          <p>Manage enquiry source master records</p>
        </div>
      </div>

      {!showForm && (
        <>
          <div className="top-action-bar">
            <AppButton
              type="primary"
              onClick={() => setShowForm(true)}
            >
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
                    if (selectedIds.length !== 1) {
                      alert("Select one source");
                      return;
                    }

                    const selected = sources.find(
                      (item) => item.id === selectedIds[0]
                    );

                    handleEdit(selected);
                  }}
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
                          sources.length > 0 &&
                          selectedIds.length === sources.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(sources.map((item) => item.id));
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                      />
                    </th>
                    <th>S.No</th>
                    <th>Source Name</th>
                    <th>Description</th>
                  </tr>
                </thead>

                <tbody>
                  {sources.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="empty-row">
                        No enquiry source found
                      </td>
                    </tr>
                  ) : (
                    sources.map((item, index) => (
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
                        <td>{item.sourceName}</td>
                        <td>{item.description || "-"}</td>
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
          <div className="source-form-grid">
            <div className="form-group">
              <label>Source Name</label>

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
              ></textarea>
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
    </div>
  );
}

export default EnquirySources;