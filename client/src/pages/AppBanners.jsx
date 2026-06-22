import React, { useState } from "react";
import "./appBanners.css";
import AppButton from "../components/AppButton";

function AppBanners() {
  const [showPopup, setShowPopup] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  const [banners, setBanners] = useState([]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      alert("Only PNG, JPG and WEBP files are allowed");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("File size must be less than 2 MB");
      return;
    }

    setSelectedFile(file);
  };

  const handleSaveBanner = () => {
    if (!selectedFile) {
      alert("Please select banner image");
      return;
    }

    const newBanner = {
      id: Date.now(),
      schoolId: "SCH001",
      imageUrl: URL.createObjectURL(selectedFile),
    };

    setBanners([...banners, newBanner]);
    setSelectedFile(null);
    setShowPopup(false);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) {
      alert("Select banner to delete");
      return;
    }

    const ok = window.confirm("Delete selected banner?");
    if (!ok) return;

    setBanners(banners.filter((item) => !selectedIds.includes(item.id)));
    setSelectedIds([]);
  };

  return (
    <div className="app-banners-page">
      <div className="common-page-header">
        <AppButton type="back" onClick={() => (window.location.href = "/student-app-access")}>
          ←
        </AppButton>

        <div>
          <h1>App Banners</h1>
          <p>Manage student app slider banners</p>
        </div>
      </div>

      <div className="top-action-bar">
        <AppButton type="primary" onClick={() => setShowPopup(true)}>
          Upload Banner
        </AppButton>
      </div>

      <div className="common-card">
        <div className="list-header">
          <h2>Uploaded Banners</h2>

          <div className="list-action-buttons">
            <AppButton type="delete" onClick={handleDeleteSelected}>
              Delete
            </AppButton>
          </div>
        </div>

        {banners.length === 0 ? (
          <div className="empty-banner-box">No banner uploaded</div>
        ) : (
          <div className="banner-grid">
            {banners.map((banner) => (
              <div className="banner-card" key={banner.id}>
                <input
                  className="banner-checkbox"
                  type="checkbox"
                  checked={selectedIds.includes(banner.id)}
                  onChange={() => {
                    setSelectedIds((prev) =>
                      prev.includes(banner.id)
                        ? prev.filter((id) => id !== banner.id)
                        : [...prev, banner.id]
                    );
                  }}
                />

                <img src={banner.imageUrl} alt="App Banner" />
              </div>
            ))}
          </div>
        )}
      </div>

      {showPopup && (
        <div className="popup-overlay">
          <div className="view-popup">
            <div className="popup-head">
              <h2>Upload Banner</h2>

              <button
                className="popup-close-btn"
                onClick={() => {
                  setShowPopup(false);
                  setSelectedFile(null);
                }}
              >
                ×
              </button>
            </div>

            <div className="form-group">
              <label>Select Banner Image</label>
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} />
            </div>

            <div className="banner-upload-info">
              <p>
                Recommended Size: <strong>1200 × 500 px</strong>
              </p>
              <p>
                Supported Formats: <strong>PNG, JPG, WEBP</strong>
              </p>
              <p>
                Max File Size: <strong>2 MB</strong>
              </p>
            </div>

            <div className="form-actions">
              <AppButton type="primary" onClick={handleSaveBanner}>
                Save
              </AppButton>

              <AppButton
                type="secondary"
                onClick={() => {
                  setShowPopup(false);
                  setSelectedFile(null);
                }}
              >
                Close
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppBanners;