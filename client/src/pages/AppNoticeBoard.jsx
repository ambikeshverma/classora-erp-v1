import React, { useState } from "react";
import "./appNoticeBoard.css";
import AppButton from "../components/AppButton";

function AppNoticeBoard() {
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

  const noticeTypes = [
    "General",
    "Holiday",
    "Exam",
    "Emergency",
    "Event",
    "Result",
    "Transport",
  ];

  const priorities = ["Normal", "Important", "Urgent"];
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
  const [viewNotice, setViewNotice] = useState(null);
  const [viewAttachment, setViewAttachment] = useState(null);

  const [formData, setFormData] = useState({
    className: "All",
    sectionName: "All",
    title: "",
    noticeType: "General",
    priority: "Normal",
    noticeDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
    message: "",
    attachment: null,
    showTo: "Students",
  });

  const [notices, setNotices] = useState([
    {
      id: 1,
      schoolId: "SCH001",
      className: "Class 6",
      sectionName: "A",
      title: "Tomorrow Holiday Notice",
      noticeType: "Holiday",
      priority: "Urgent",
      noticeDate: "2026-06-10",
      expiryDate: "2026-06-11",
      message: "School will remain closed tomorrow due to heavy rainfall.",
      attachmentName: "holiday-notice.pdf",
      attachmentUrl: "",
      attachmentType: "application/pdf",
      showTo: "Students",
    },
  ]);

  const resetForm = () => {
    setFormData({
      className: "All",
      sectionName: "All",
      title: "",
      noticeType: "General",
      priority: "Normal",
      noticeDate: new Date().toISOString().split("T")[0],
      expiryDate: "",
      message: "",
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

  const filteredNotices = notices.filter((item) => {
    const searchMatch = appliedFilters.searchText
      ? item.title
          .toLowerCase()
          .includes(appliedFilters.searchText.toLowerCase()) ||
        item.message
          .toLowerCase()
          .includes(appliedFilters.searchText.toLowerCase()) ||
        item.noticeType
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

  const handleSaveNotice = () => {
    if (
      !formData.title ||
      !formData.message ||
      !formData.noticeDate ||
      !formData.expiryDate
    ) {
      alert("Please fill required fields");
      return;
    }

    if (formData.expiryDate < formData.noticeDate) {
      alert("Expiry date cannot be before notice date");
      return;
    }

    const newNotice = {
      id: Date.now(),
      schoolId: "SCH001",
      className: formData.className,
      sectionName: formData.sectionName,
      title: formData.title,
      noticeType: formData.noticeType,
      priority: formData.priority,
      noticeDate: formData.noticeDate,
      expiryDate: formData.expiryDate,
      message: formData.message,
      attachmentName: formData.attachment ? formData.attachment.name : "",
      attachmentUrl: formData.attachment
        ? URL.createObjectURL(formData.attachment)
        : "",
      attachmentType: formData.attachment ? formData.attachment.type : "",
      showTo: formData.showTo,
    };

    setNotices([...notices, newNotice]);
    resetForm();
    setShowPopup(false);
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) {
      alert("Select notice to delete");
      return;
    }

    const ok = window.confirm("Delete selected notice?");
    if (!ok) return;

    setNotices(notices.filter((item) => !selectedIds.includes(item.id)));
    setSelectedIds([]);
  };

  return (
    <div className="app-notice-page">
      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => (window.location.href = "/student-app-access")}
        >
          ←
        </AppButton>

        <div>
          <h1>App Notice Board</h1>
          <p>Manage student app notice board updates</p>
        </div>
      </div>

      <div className="common-card">
        <div className="notice-filter-grid">
          <div className="form-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search by title, message or type"
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

          <div className="notice-filter-actions">
            <AppButton type="primary" onClick={handleSearch}>
              Search
            </AppButton>

            <AppButton type="primary" onClick={() => setShowPopup(true)}>
              + Add Notice
            </AppButton>
          </div>
        </div>
      </div>

      <div className="common-card">
        <div className="list-header">
          <h2>Uploaded Notices</h2>
              <div className="list-action-buttons">
  <AppButton
    type="primary"
    onClick={() => {
      if (selectedIds.length !== 1) {
        alert("Select one notice");
        return;
      }

      const selected = notices.find(
        (item) => item.id === selectedIds[0]
      );

      setViewNotice(selected);
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
                      filteredNotices.length > 0 &&
                      selectedIds.length === filteredNotices.length
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(filteredNotices.map((item) => item.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                  />
                </th>
                <th>S.No</th>
                <th>Class</th>
                <th>Section</th>
                <th className="notice-title-column">Notice Title</th>
                <th>Type</th>
                <th>Priority</th>
                <th>Notice Date</th>
                <th>Expiry Date</th>
                <th>Show To</th>
                <th>Attachment</th>
              </tr>
            </thead>

            <tbody>
              {filteredNotices.length === 0 ? (
                <tr>
                  <td colSpan="11" className="empty-row">
                    No notice found
                  </td>
                </tr>
              ) : (
                filteredNotices.map((notice, index) => (
                  <tr key={notice.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(notice.id)}
                        onChange={() => {
                          setSelectedIds((prev) =>
                            prev.includes(notice.id)
                              ? prev.filter((id) => id !== notice.id)
                              : [...prev, notice.id]
                          );
                        }}
                      />
                    </td>

                    <td>{index + 1}</td>
                    <td>{notice.className}</td>
                    <td>{notice.sectionName}</td>
                    <td className="notice-title-column">{notice.title}</td>

                    <td>
                      <span className="notice-type-badge">
                        {notice.noticeType}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`priority-badge priority-${notice.priority.toLowerCase()}`}
                      >
                        {notice.priority}
                      </span>
                    </td>

                    <td>{notice.noticeDate}</td>
                    <td>{notice.expiryDate}</td>
                    <td>{notice.showTo}</td>

                    <td>
                      {notice.attachmentName ? (
                        <button
                          className="simple-view-btn"
                          onClick={() => setViewAttachment(notice)}
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
          <div className="view-popup notice-popup">
            <div className="popup-head">
              <h2>Add Notice</h2>

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

            <div className="notice-popup-grid">
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
                <label>Notice Title *</label>
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter notice title"
                />
              </div>

              <div className="form-group">
                <label>Notice Type</label>
                <select
                  name="noticeType"
                  value={formData.noticeType}
                  onChange={handleChange}
                >
                  {noticeTypes.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Notice Priority</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  {priorities.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Notice Date *</label>
                <input
                  type="date"
                  name="noticeDate"
                  value={formData.noticeDate}
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

              <div className="form-group notice-message-box">
                <label>Message *</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Type full notice message here..."
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
              <AppButton type="primary" onClick={handleSaveNotice}>
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

      {viewNotice && (
        <div className="popup-overlay">
          <div className="view-popup">
            <div className="popup-head">
              <h2>Notice Details</h2>

              <button
                className="popup-close-btn"
                onClick={() => setViewNotice(null)}
              >
                ×
              </button>
            </div>

            <div className="notice-view-box">
              <p>
                <strong>Class:</strong> {viewNotice.className}
              </p>

              <p>
                <strong>Section:</strong> {viewNotice.sectionName}
              </p>

              <p>
                <strong>Title:</strong> {viewNotice.title}
              </p>

              <p>
                <strong>Type:</strong> {viewNotice.noticeType}
              </p>

              <p>
                <strong>Priority:</strong> {viewNotice.priority}
              </p>

              <p>
                <strong>Notice Date:</strong> {viewNotice.noticeDate}
              </p>

              <p>
                <strong>Expiry Date:</strong> {viewNotice.expiryDate}
              </p>

              <p>
                <strong>Show To:</strong> {viewNotice.showTo}
              </p>

              <p className="notice-full-message">
                <strong>Message:</strong>
                <br />
                {viewNotice.message}
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

export default AppNoticeBoard;