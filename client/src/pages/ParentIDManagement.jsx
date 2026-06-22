import React, { useState } from "react";
import "./parentIDManagement.css";
import AppButton from "../components/AppButton";

function ParentIDManagement() {
  const demoTemplates = [
    {
      id: 1,
      name: "Parent ID Landscape Template",
      cardOrientation: "Horizontal",
    },
    {
      id: 2,
      name: "Parent ID Classic Template",
      cardOrientation: "Horizontal",
    },
  ];

  const demoStudents = [
    {
      id: 1,
      schoolId: "SCH001",
      admissionNo: "ADM001",
      studentName: "Aditya Maurya",
      className: "3",
      section: "A",
      fatherName: "Satish Kumar",
      motherName: "Rekha Maurya",
      guardianName: "",
      mobile: "8299121531",
      address: "Rasauli Barabanki Uttar Pradesh",
      studentPhoto: "YES",
      fatherPhoto: "YES",
      motherPhoto: "YES",
      guardianPhoto: "NO",
      parentIdStatus: "NOT ISSUED",
    },
    {
      id: 2,
      schoolId: "SCH001",
      admissionNo: "ADM002",
      studentName: "Aarav Soni",
      className: "1",
      section: "A",
      fatherName: "Mahesh",
      motherName: "Suman",
      guardianName: "",
      mobile: "9026525114",
      address: "Pratapganj Barabanki Uttar Pradesh",
      studentPhoto: "YES",
      fatherPhoto: "NO",
      motherPhoto: "YES",
      guardianPhoto: "NO",
      parentIdStatus: "ISSUED",
    },
  ];

  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [idStatus, setIdStatus] = useState("");
  const [templateId, setTemplateId] = useState("");

  const [students, setStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const [isSearched, setIsSearched] = useState(false);

  const [appliedFilters, setAppliedFilters] = useState({
    className: "",
    section: "",
    idStatus: "",
    templateId: "",
  });

  const handleSearch = () => {

    if (
      !className ||
      !section ||
      !idStatus ||
      !templateId
    ) {
      alert("Please select all fields");
      return;
    }

    setStudents(demoStudents);
    setSelectedIds([]);
    setIsSearched(true);

    setAppliedFilters({
      className,
      section,
      idStatus,
      templateId,
    });

  };

  const filteredStudents = students.filter(
    (item) => {

      const classMatch =
        appliedFilters.className === "ALL"
          ? true
          : item.className ===
            appliedFilters.className;

      const sectionMatch =
        appliedFilters.section === "ALL"
          ? true
          : item.section ===
            appliedFilters.section;

      const idMatch =
        appliedFilters.idStatus === "ALL"
          ? true
          : item.parentIdStatus ===
            appliedFilters.idStatus;

      return (
        classMatch &&
        sectionMatch &&
        idMatch
      );

    }
  );

  const selectedStudents = students.filter(
    (item) =>
      selectedIds.includes(item.id)
  );

  const selectedTemplate =
    demoTemplates.find(
      (item) =>
        String(item.id) ===
        String(templateId)
    );

  const handlePrint = () => {

    if (!isSearched) {
      alert(
        "Please search student list first"
      );
      return;
    }

    if (!templateId) {
      alert("Please select template");
      return;
    }

    if (selectedIds.length === 0) {
      alert("Please select students");
      return;
    }

    setStudents(
      students.map((item) =>
        selectedIds.includes(item.id)
          ? {
              ...item,
              parentIdStatus: "ISSUED",
            }
          : item
      )
    );

    alert("Parent ID print ready");

  };

  return (
    <div className="parent-id-page">

      <div className="common-page-header">

        <AppButton
          type="back"
          onClick={() => {
            window.location.href =
              "/reception-desk";
          }}
        >
          ←
        </AppButton>

        <div>

          <h1>
            Parent ID Management
          </h1>

          <p>
            Generate, preview, print and
            reprint parent ID cards
          </p>

        </div>

      </div>
      <div className="common-card">

        <div className="filter-grid">

          <div className="form-group">

            <label>
              Class
            </label>

            <select
              value={className}
              onChange={(e) => {
                setClassName(
                  e.target.value
                );
                setIsSearched(false);
              }}
            >
              <option value="">
                Select Class
              </option>

              <option value="ALL">
                All Classes
              </option>

              <option value="1">
                Class 1
              </option>

              <option value="2">
                Class 2
              </option>

              <option value="3">
                Class 3
              </option>

            </select>

          </div>
          <div className="form-group">

            <label>
              Section
            </label>

            <select
              value={section}
              onChange={(e) => {
                setSection(
                  e.target.value
                );
                setIsSearched(false);
              }}
            >
              <option value="">
                Select Section
              </option>

              <option value="ALL">
                All Sections
              </option>

              <option value="A">
                A
              </option>

              <option value="B">
                B
              </option>

            </select>

          </div>

          <div className="form-group">

            <label>
              ID Status
            </label>

            <select
              value={idStatus}
              onChange={(e) => {
                setIdStatus(
                  e.target.value
                );
                setIsSearched(false);
              }}
            >
              <option value="">
                Select ID Status
              </option>

              <option value="ALL">
                All
              </option>

              <option value="ISSUED">
                Issued
              </option>

              <option value="NOT ISSUED">
                Not Issued
              </option>

            </select>

          </div>

          <div className="form-group">

            <label>
              Assigned Template
            </label>

            <select
              value={templateId}
              onChange={(e) => {
                setTemplateId(
                  e.target.value
                );
                setIsSearched(false);
              }}
            >
              <option value="">
                Select Template
              </option>

              {demoTemplates.map(
                (template) => (
                  <option
                    key={template.id}
                    value={template.id}
                  >
                    {template.name}
                  </option>
                )
              )}

            </select>

          </div>

        </div>
<div className="form-actions search-action-row">

  <AppButton
    type="primary"
    onClick={handleSearch}
  >
    Search
  </AppButton>

</div>
      </div>
      <div className="common-card">
        <div className="list-header">
          <h2>Parent ID List</h2>

          <div className="list-action-buttons">
            <AppButton
              type="primary"
              onClick={() => {
                if (selectedStudents.length === 0) {
                  alert("Please select students");
                  return;
                }
                setPreviewData(selectedStudents);
              }}
            >
              Preview
            </AppButton>

            <AppButton
  type="primary"
  onClick={handlePrint}
>
  {selectedStudents.some(
    (item) =>
      item.parentIdStatus === "ISSUED"
  )
    ? "Reprint"
    : "Print"}
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
      filteredStudents.length > 0 &&
      selectedIds.length === filteredStudents.length
    }
    onChange={(e) => {
      if (e.target.checked) {
        setSelectedIds(filteredStudents.map((item) => item.id));
      } else {
        setSelectedIds([]);
      }
    }}
  />
</th>
                <th>S.No</th>
                <th>Student</th>
                <th>Class</th>
                <th>Section</th>
                <th>Father</th>
                <th>Mother</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {!isSearched ? (
                <tr>
                  <td colSpan="8" className="empty-row">
                    Please select filters and click Search
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-row">
                    No student found
                  </td>
                </tr>
              ) : (
                filteredStudents.map((item, index) => (
  <tr key={item.id}>

    <td>
      <input
        type="checkbox"
        checked={selectedIds.includes(item.id)}
        onChange={() => {

          setSelectedIds((prev) =>

            prev.includes(item.id)

              ? prev.filter(
                  (id) => id !== item.id
                )

              : [
                  ...prev,
                  item.id,
                ]

          );

        }}
      />
    </td>

    <td>
      {index + 1}
    </td>

    <td>
      {item.studentName}
    </td>

    <td>
      {item.className}
    </td>

    <td>
      {item.section}
    </td>

    <td>
      {item.fatherName}
    </td>

    <td>
      {item.motherName}
    </td>

    <td>
      {item.parentIdStatus}
    </td>

  </tr>
))
              )}

            </tbody>

          </table>

        </div>
{previewData && (

  <div className="popup-overlay">

    <div className="preview-popup">

      <div className="popup-head">

        <h2>
          Parent ID Preview
        </h2>

        <button
          className="popup-close-btn"
          onClick={() =>
            setPreviewData(null)
          }
        >
          ×
        </button>

      </div>

      <p className="template-info">

        Template:
        {" "}
        {selectedTemplate?.name}

      </p>

      <div className="parent-id-preview-grid">

        {previewData.map((student) => (

          <div
            key={student.id}
            className="parent-id-card"
          >

            <div className="parent-id-top">

              <div className="school-logo">
                LOGO
              </div>

              <div>

                <h3>
                  CHANDRA SHEKHAR AZAD
                  INTER COLLEGE
                </h3>

                <p>
                  Rasauli Barabanki
                </p>

              </div>

            </div>

            <div className="parent-photo-section">

              <div className="parent-photo">
                Father
              </div>

              <div className="student-photo">
                Student
              </div>

              <div className="parent-photo">
                Mother
              </div>

            </div>

            <div className="parent-id-details">

              <p>
                <strong>
                  Student:
                </strong>
                {" "}
                {student.studentName}
              </p>

              <p>
                <strong>
                  Class:
                </strong>
                {" "}
                {student.className}
                {" - "}
                {student.section}
              </p>

              <p>
                <strong>
                  Father:
                </strong>
                {" "}
                {student.fatherName}
              </p>

              <p>
                <strong>
                  Mother:
                </strong>
                {" "}
                {student.motherName}
              </p>

              <p>
                <strong>
                  Mobile:
                </strong>
                {" "}
                {student.mobile}
              </p>

              <p>
                <strong>
                  Address:
                </strong>
                {" "}
                {student.address}
              </p>

            </div>

          </div>

        ))}

      </div>

    </div>

  </div>

)}
      </div>
      </div>
  );
}

export default ParentIDManagement;