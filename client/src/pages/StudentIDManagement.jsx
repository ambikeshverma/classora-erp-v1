import React, { useState } from "react";
import "./studentIDManagement.css";
import AppButton from "../components/AppButton";

function StudentIDManagement() {
  const demoTemplates = [
    { id: 1, name: "CSAIC Blue Template", orientation: "Vertical" },
    { id: 2, name: "Classic Horizontal Template", orientation: "Horizontal" },
  ];

  const demoStudents = [
    {
      id: 1,
      schoolId: "SCH001",
      admissionNo: "ADM001",
      studentName: "Aman Verma",
      className: "9",
      section: "A",
      rollNo: "12",
      fatherName: "Rajesh Verma",
      mobile: "9876543210",
      dob: "2011-05-12",
      photo: "YES",
      idStatus: "NOT ISSUED",
    },
    {
      id: 2,
      schoolId: "SCH001",
      admissionNo: "ADM002",
      studentName: "Riya Singh",
      className: "9",
      section: "A",
      rollNo: "15",
      fatherName: "Amit Singh",
      mobile: "9876543211",
      dob: "2011-08-20",
      photo: "NO",
      idStatus: "ISSUED",
    },
  ];

  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [photoFilter, setPhotoFilter] = useState("");
  const [idFilter, setIdFilter] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [mirrorPrint, setMirrorPrint] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const [isSearched, setIsSearched] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({
  className: "",
  section: "",
  photoFilter: "",
  idFilter: "",
  templateId: "",
});
  const filteredStudents = students.filter((item) => {

    const classMatch =
  appliedFilters.className === "ALL"
    ? true
    : appliedFilters.className
      ? item.className === appliedFilters.className
      : true;

    const sectionMatch =
      appliedFilters.section
        ? item.section === appliedFilters.section
        : true;
    const photoMatch = 
    appliedFilters.photoFilter
    ? item.photo === appliedFilters.photoFilter
    : true;
    const idMatch = 
    appliedFilters.idFilter 
    ? item.idStatus === appliedFilters.idFilter
    : true;
    return (
      classMatch &&
      sectionMatch &&
      photoMatch &&
      idMatch
    );
  });

  const selectedStudents = students.filter((item) =>
    selectedIds.includes(item.id)
  );

  const selectedTemplate = demoTemplates.find(
    (item) =>
      String(item.id) === String(templateId)
  );
  const allIssued =
  selectedStudents.length > 0 &&
  selectedStudents.every(
    (item) => item.idStatus === "ISSUED"
  );
const handleSearch = () => {
  if (
    !className ||
    !section ||
    !photoFilter ||
    !idFilter ||
    !templateId
  ) {
    alert("Please select all fields");
    return;
  }
  setAppliedFilters({
  className,
  section,
  photoFilter,
  idFilter,
  templateId,
});
  setStudents(demoStudents);
  setSelectedIds([]);
  setIsSearched(true);
};
  const handlePrint = () => {

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
              idStatus: "ISSUED",
            }
          : item
      )
    );

    alert(
      mirrorPrint
        ? "Mirror print ready"
        : "Print ready"
    );
  };

  return (
    <div className="student-id-page">

      <div className="common-page-header">

        <AppButton
          type="back"
          onClick={() =>
            (window.location.href =
              "/reception-desk")
          }
        >
          ←
        </AppButton>

        <div>
          <h1>
            Student ID Management
          </h1>

          <p>
            Generate, preview, print and
            reprint student ID cards
          </p>
        </div>

      </div>
      <div className="common-card">

        <div className="filter-grid">

          <div className="form-group">
            <label>Class</label>

            <select
              value={className}
              onChange={(e) =>
                setClassName(e.target.value)
              }
            >
              <option value="">
                Select Class
              </option>
              <option value="ALL">All Classes</option>
              <option value="9">
                Class 9
              </option>

              <option value="10">
                Class 10
              </option>
            </select>
          </div>

          <div className="form-group">
            <label>Section</label>

            <select
              value={section}
              onChange={(e) =>
                setSection(e.target.value)
              }
            >
              <option value="">
                Select Section
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
              Photo Status
            </label>

            <select
              value={photoFilter}
              onChange={(e) =>
                setPhotoFilter(e.target.value)
              }
            >
              <option value="">
              Select Photo status
              </option>

              <option value="YES">
                With Photo
              </option>

              <option value="NO">
                Without Photo
              </option>
            </select>
          </div>

          <div className="form-group">
            <label>
              ID Status
            </label>

            <select
              value={idFilter}
              onChange={(e) =>
                setIdFilter(e.target.value)
              }
            >
              <option value="">
                Select ID Status
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
              onChange={(e) =>
                setTemplateId(e.target.value)
              }
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
                    {" "}
                    (
                    {template.orientation}
                    )
                  </option>
                )
              )}
            </select>
          </div>

        </div>
              <div className="form-actions search-action-row">

  <label className="mirror-option">
    <input
      type="checkbox"
      checked={mirrorPrint}
      onChange={(e) =>
        setMirrorPrint(e.target.checked)
      }
    />
    Mirror Printing
  </label>

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

          <h2>
            Student ID List
          </h2>

          <div className="list-action-buttons">

            <AppButton
              type="primary"
              onClick={() => {

                if (
                  selectedStudents.length === 0
                ) {
                  alert(
                    "Please select students"
                  );
                  return;
                }

                setPreviewData(
                  selectedStudents
                );

              }}
            >
              Preview
            </AppButton>

            <AppButton
  type="primary"
  onClick={handlePrint}
>
  {
    allIssued
      ? "Reprint"
      : "Print"
  }
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
                      selectedIds.length ===
                        filteredStudents.length
                    }
                    onChange={(e) => {

                      if (e.target.checked) {

                        setSelectedIds(
                          filteredStudents.map(
                            (item) => item.id
                          )
                        );

                      } else {

                        setSelectedIds([]);

                      }

                    }}
                  />

                </th>

                <th>S.No</th>
                <th>Name</th>
                <th>Class</th>
                <th>Sec</th>
                <th>Roll</th>
                <th>Photo</th>
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
                          checked={selectedIds.includes(
                            item.id
                          )}
                          onChange={() => {

                            setSelectedIds(
                              (prev) =>

                                prev.includes(item.id)

                                  ? prev.filter(
                                      (id) =>
                                        id !== item.id
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
                        {item.rollNo}
                      </td>

                      <td>
                        {item.photo}
                      </td>

                      <td>
                        {item.idStatus}
                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>
      {previewData && (

        <div className="popup-overlay">

          <div className="preview-popup">

            <div className="popup-head">

              <h2>
                ID Card Preview
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
              {
                selectedTemplate?.name ||
                "Not Selected"
              }

              {" "}
              |

              {" "}
              Mirror:
              {" "}

              {
                mirrorPrint
                  ? "Yes"
                  : "No"
              }

            </p>

            <div className="id-preview-grid">

              {previewData.map(
                (student) => (

                  <div
                    key={student.id}
                    className={
                      selectedTemplate?.orientation ===
                      "Horizontal"

                        ? "id-card horizontal"

                        : "id-card vertical"
                    }
                  >

                    <h3>
                      CHANDRA SHEKHAR
                      AZAD INTER COLLEGE
                    </h3>

                    <div className="student-photo">

                      {
                        student.photo === "YES"

                          ? "Photo"

                          : "No Photo"
                      }

                    </div>

                    <p>
                      {student.studentName}
                    </p>

                    <p>
                      Class:
                      {" "}
                      {student.className}
                      {" "}
                      -
                      {" "}
                      {student.section}
                    </p>

                    <p>
                      Roll No:
                      {" "}
                      {student.rollNo}
                    </p>

                    <p>
                      Father:
                      {" "}
                      {student.fatherName}
                    </p>

                    <p>
                      Adm No:
                      {" "}
                      {student.admissionNo}
                    </p>

                    <p>
                      Mobile:
                      {" "}
                      {student.mobile}
                    </p>

                  </div>

                )
              )}

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default StudentIDManagement;