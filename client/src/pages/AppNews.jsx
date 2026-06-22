import React, { useState } from "react";
import "./appNews.css";
import AppButton from "../components/AppButton";

function AppNews() {
  const classOptions = [
    "All",
    "Class 1",
    "Class 2",
    "Class 3",
    "Class 4",
    "Class 5",
    "Class 6",
  ];

  const sectionOptions = ["All", "A", "B", "C", "D"];

  const newsTypes = [
    "General",
    "Achievement",
    "Event",
    "Sports",
    "Cultural",
    "Admission",
    "Announcement",
  ];

  const showToOptions = ["Students", "Teachers", "All"];

  const [searchText, setSearchText] = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [sectionFilter, setSectionFilter] = useState("All");

  const [appliedFilters, setAppliedFilters] = useState({
    searchText: "",
    classFilter: "All",
    sectionFilter: "All",
  });

  const [showPopup, setShowPopup] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewNews, setViewNews] = useState(null);
  const [viewAttachment, setViewAttachment] = useState(null);

  const [formData, setFormData] = useState({
    className: "All",
    sectionName: "All",
    title: "",
    newsType: "General",
    newsDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
    description: "",
    attachment: null,
    showTo: "Students",
  });

  const [newsList, setNewsList] = useState([
    {
      id: 1,
      schoolId: "SCH001",
      className: "All",
      sectionName: "All",
      title: "Annual Function Highlights",
      newsType: "Event",
      newsDate: "2026-06-10",
      expiryDate: "2026-06-20",
      description:
        "Our school annual function was successfully organized with cultural performances and award distribution.",
      attachmentName: "annual-function.jpg",
      attachmentUrl: "",
      attachmentType: "image/jpeg",
      showTo: "Students",
    },
  ]);

  const resetForm = () => {
    setFormData({
      className: "All",
      sectionName: "All",
      title: "",
      newsType: "General",
      newsDate: new Date().toISOString().split("T")[0],
      expiryDate: "",
      description: "",
      attachment: null,
      showTo: "Students",
    });
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "attachment") {
      setFormData({
        ...formData,
        attachment: files[0] || null,
      });
      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSearch = () => {
    setAppliedFilters({
      searchText,
      classFilter,
      sectionFilter,
    });
  };

  const filteredNews = newsList.filter((item) => {
    const searchMatch = appliedFilters.searchText
      ? item.title
          .toLowerCase()
          .includes(appliedFilters.searchText.toLowerCase()) ||
        item.description
          .toLowerCase()
          .includes(appliedFilters.searchText.toLowerCase()) ||
        item.newsType
          .toLowerCase()
          .includes(appliedFilters.searchText.toLowerCase())
      : true;

    const classMatch =
      appliedFilters.classFilter === "All"
        ? true
        : item.className === appliedFilters.classFilter;

    const sectionMatch =
      appliedFilters.sectionFilter === "All"
        ? true
        : item.sectionName === appliedFilters.sectionFilter;

    return searchMatch && classMatch && sectionMatch;
  });

  const handleSaveNews = () => {
    if (
      !formData.title ||
      !formData.description ||
      !formData.newsDate ||
      !formData.expiryDate
    ) {
      alert("Please fill required fields");
      return;
    }

    if (formData.expiryDate < formData.newsDate) {
      alert("Expiry date cannot be before news date");
      return;
    }

    const newNews = {
      id: Date.now(),
      schoolId: "SCH001",
      className: formData.className,
      sectionName: formData.sectionName,
      title: formData.title,
      newsType: formData.newsType,
      newsDate: formData.newsDate,
      expiryDate: formData.expiryDate,
      description: formData.description,
      attachmentName: formData.attachment ? formData.attachment.name : "",
      attachmentUrl: formData.attachment
        ? URL.createObjectURL(formData.attachment)
        : "",
      attachmentType: formData.attachment ? formData.attachment.type : "",
      showTo: formData.showTo,
    };

    setNewsList([...newsList, newNews]);
    resetForm();
    setShowPopup(false);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) {
      alert("Select news to delete");
      return;
    }

    const ok = window.confirm("Delete selected news?");
    if (!ok) return;

    setNewsList(newsList.filter((item) => !selectedIds.includes(item.id)));
    setSelectedIds([]);
  };
  return (
    <div className="app-news-page">
      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => (window.location.href = "/student-app-access")}
        >
          ←
        </AppButton>

        <div>
          <h1>App News</h1>
          <p>Manage student app news and updates</p>
        </div>
      </div>

      <div className="common-card">
        <div className="news-filter-grid">
          <div className="form-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search by title, description or type"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Class</label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
            >
              {classOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Section</label>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
            >
              {sectionOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="news-filter-actions">
            <AppButton type="primary" onClick={handleSearch}>
              Search
            </AppButton>

            <AppButton type="primary" onClick={() => setShowPopup(true)}>
              + Add News
            </AppButton>
          </div>
        </div>
      </div>

      <div className="common-card">
        <div className="list-header">
          <h2>Uploaded News</h2>

          <div className="list-action-buttons">
            <AppButton
              type="view"
              onClick={() => {
                if (selectedIds.length !== 1) {
                  alert("Select one news");
                  return;
                }

                const selected = newsList.find(
                  (item) => item.id === selectedIds[0]
                );

                setViewNews(selected);
              }}
            >
              View
            </AppButton>

            <AppButton type="delete" onClick={handleDeleteSelected}>
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
                      filteredNews.length > 0 &&
                      selectedIds.length === filteredNews.length
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(filteredNews.map((item) => item.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                  />
                </th>
                <th>S.No</th>
                <th>Class</th>
                <th>Section</th>
                <th>News Title</th>
                <th>Type</th>
                <th>News Date</th>
                <th>Expiry Date</th>
                <th>Show To</th>
                <th>Attachment</th>
              </tr>
            </thead>

            <tbody>
              {filteredNews.length === 0 ? (
                <tr>
                  <td colSpan="10" className="empty-row">
                    No news found
                  </td>
                </tr>
              ) : (
                filteredNews.map((news, index) => (
                  <tr key={news.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(news.id)}
                        onChange={() => {
                          setSelectedIds((prev) =>
                            prev.includes(news.id)
                              ? prev.filter((id) => id !== news.id)
                              : [...prev, news.id]
                          );
                        }}
                      />
                    </td>

                    <td>{index + 1}</td>
                    <td>{news.className}</td>
                    <td>{news.sectionName}</td>
                    <td>{news.title}</td>

                    <td>
                      <span className="news-type-badge">
                        {news.newsType}
                      </span>
                    </td>

                    <td>{news.newsDate}</td>
                    <td>{news.expiryDate}</td>
                    <td>{news.showTo}</td>

                    <td>
                      {news.attachmentName ? (
                        <button
                          className="simple-view-btn"
                          onClick={() => setViewAttachment(news)}
                        >
                          📎
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showPopup && (
        <div className="popup-overlay">
          <div className="view-popup news-popup">
            <div className="popup-head">
              <h2>Add News</h2>

              <button
                className="popup-close-btn"
                onClick={() => {
                  resetForm();
                  setShowPopup(false);
                }}
              >
                ×
              </button>
            </div>

            <div className="news-popup-grid">
              <div className="form-group">
                <label>Select Class</label>
                <select
                  name="className"
                  value={formData.className}
                  onChange={handleChange}
                >
                  {classOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Select Section</label>
                <select
                  name="sectionName"
                  value={formData.sectionName}
                  onChange={handleChange}
                >
                  {sectionOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>News Title *</label>
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter news title"
                />
              </div>

              <div className="form-group">
                <label>News Type</label>
                <select
                  name="newsType"
                  value={formData.newsType}
                  onChange={handleChange}
                >
                  {newsTypes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>News Date *</label>
                <input
                  type="date"
                  name="newsDate"
                  value={formData.newsDate}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Expiry Date *</label>
                <input
                  type="date"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label>Show To</label>
                <select
                  name="showTo"
                  value={formData.showTo}
                  onChange={handleChange}
                >
                  {showToOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group news-description-box">
                <label>News Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Type full news description here..."
                ></textarea>
              </div>

              <div className="form-group">
                <label>Attachment</label>
                <input
                  type="file"
                  name="attachment"
                  accept="image/*,.pdf"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-actions">
              <AppButton type="primary" onClick={handleSaveNews}>
                Save
              </AppButton>

              <AppButton
                type="secondary"
                onClick={() => {
                  resetForm();
                  setShowPopup(false);
                }}
              >
                Close
              </AppButton>
            </div>
          </div>
        </div>
      )}

      {viewNews && (
        <div className="popup-overlay">
          <div className="view-popup">
            <div className="popup-head">
              <h2>News Details</h2>

              <button
                className="popup-close-btn"
                onClick={() => setViewNews(null)}
              >
                ×
              </button>
            </div>

            <div className="news-view-box">
              <p>
                <strong>Class:</strong> {viewNews.className}
              </p>

              <p>
                <strong>Section:</strong> {viewNews.sectionName}
              </p>

              <p>
                <strong>Title:</strong> {viewNews.title}
              </p>

              <p>
                <strong>Type:</strong> {viewNews.newsType}
              </p>

              <p>
                <strong>News Date:</strong> {viewNews.newsDate}
              </p>

              <p>
                <strong>Expiry Date:</strong> {viewNews.expiryDate}
              </p>

              <p>
                <strong>Show To:</strong> {viewNews.showTo}
              </p>

              <p className="news-full-description">
                <strong>Description:</strong>
                <br />
                {viewNews.description}
              </p>
            </div>
          </div>
        </div>
      )}

      {viewAttachment && (
        <div className="popup-overlay">
          <div className="view-popup">
            <div className="popup-head">
              <h2>Attachment Preview</h2>

              <button
                className="popup-close-btn"
                onClick={() => setViewAttachment(null)}
              >
                ×
              </button>
            </div>

            {viewAttachment.attachmentUrl ? (
              viewAttachment.attachmentType?.includes("image") ? (
                <img
                  className="attachment-preview-image"
                  src={viewAttachment.attachmentUrl}
                  alt="Attachment"
                />
              ) : (
                <iframe
                  className="attachment-preview-frame"
                  src={viewAttachment.attachmentUrl}
                  title="Attachment Preview"
                />
              )
            ) : (
              <div className="empty-row">Attachment preview not available</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AppNews;