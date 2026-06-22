import React, { useState } from "react";
import "./studentTransportAllocation.css";
import AppButton from "../components/AppButton";

function StudentTransportAllocation() {
  const schoolId = localStorage.getItem("schoolId") || "SCH001";

  // Future API source:
  // Student Hub -> Class Management
  const classOptions = [
    "Class 1",
    "Class 2",
    "Class 3",
    "Class 4",
    "Class 5",
    "Class 6",
  ];

  // Future API source:
  // Student Hub -> Section Management
  const sectionOptions = ["A", "B", "C", "D"];

  const monthOptions = [
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
    "January",
    "February",
    "March",
  ];

  // Future API source:
  // Transport System -> Route Management
  const demoRoutes = [
    {
      id: 1,
      schoolId: "SCH001",
      routeName: "Rasauli Route",
      monthlyFee: 500,
    },
    {
      id: 2,
      schoolId: "SCH001",
      routeName: "Lucknow Route",
      monthlyFee: 800,
    },
    {
      id: 3,
      schoolId: "SCH001",
      routeName: "Barabanki Route",
      monthlyFee: 400,
    },
  ];

  // Future API source:
  // Transport System -> Vehicle Management
  const demoVehicles = [
    {
      id: 1,
      schoolId: "SCH001",
      vehicleNo: "UP32AB1234",
      vehicleName: "Bus 1",
    },
    {
      id: 2,
      schoolId: "SCH001",
      vehicleNo: "UP41CD5678",
      vehicleName: "Van 1",
    },
    {
      id: 3,
      schoolId: "SCH001",
      vehicleNo: "UP32XX0000",
      vehicleName: "Old Bus",
    },
  ];

  // Future API source:
  // Student Profile
  const demoStudents = [
    {
      id: 1,
      schoolId: "SCH001",
      studentName: "Rahul Kumar",
      fatherName: "Sunil Kumar",
      admissionNo: "ADM001",
      className: "Class 6",
      sectionName: "A",
      mobile: "9876543210",
      status: "Active",
      routeId: "",
      routeName: "",
      vehicleId: "",
      vehicleNo: "",
      transportFee: "",
      removedMonths: [],
    },
    {
      id: 2,
      schoolId: "SCH001",
      studentName: "Priya Singh",
      fatherName: "Dinesh Singh",
      admissionNo: "ADM002",
      className: "Class 6",
      sectionName: "A",
      mobile: "9876543211",
      status: "Active",
      routeId: 1,
      routeName: "Rasauli Route",
      vehicleId: 1,
      vehicleNo: "UP32AB1234",
      transportFee: 500,
      removedMonths: ["April", "May"],
    },
    {
      id: 3,
      schoolId: "SCH001",
      studentName: "Aman Verma",
      fatherName: "Rakesh Verma",
      admissionNo: "ADM003",
      className: "Class 7",
      sectionName: "B",
      mobile: "9876543212",
      status: "Inactive",
      routeId: "",
      routeName: "",
      vehicleId: "",
      vehicleNo: "",
      transportFee: "",
      removedMonths: [],
    },
  ];

  const [students, setStudents] = useState(demoStudents);
  const [selectedIds, setSelectedIds] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [showRemovePopup, setShowRemovePopup] = useState(false);

  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [searchText, setSearchText] = useState("");

  const [isSearched, setIsSearched] = useState(false);

  const [removeType, setRemoveType] = useState("Full");
  const [selectedMonths, setSelectedMonths] = useState([]);

  const [appliedFilters, setAppliedFilters] = useState({
    classFilter: "",
    sectionFilter: "",
    searchText: "",
  });

  const [formData, setFormData] = useState({
    routeId: "",
    vehicleId: "",
  });

  const availableRoutes = demoRoutes
    .filter((item) => item.schoolId === schoolId)
    .sort((a, b) => a.routeName.localeCompare(b.routeName));

  const availableVehicles = demoVehicles
    .filter((item) => item.schoolId === schoolId)
    .sort((a, b) =>
      String(a.vehicleName || "").localeCompare(String(b.vehicleName || ""))
    );

  const getFilteredStudents = (filters) => {
    return students
      .filter((item) => {
        const schoolMatch = item.schoolId === schoolId;
        const activeMatch = item.status === "Active";

        const classMatch = filters.classFilter
          ? item.className === filters.classFilter
          : true;

        const sectionMatch = filters.sectionFilter
          ? item.sectionName === filters.sectionFilter
          : true;

        const searchMatch = filters.searchText
          ? item.studentName
              .toLowerCase()
              .includes(filters.searchText.toLowerCase()) ||
            item.fatherName
              .toLowerCase()
              .includes(filters.searchText.toLowerCase()) ||
            item.admissionNo
              .toLowerCase()
              .includes(filters.searchText.toLowerCase()) ||
            item.mobile.includes(filters.searchText)
          : true;

        return (
          schoolMatch &&
          activeMatch &&
          classMatch &&
          sectionMatch &&
          searchMatch
        );
      })
      .sort((a, b) => a.studentName.localeCompare(b.studentName));
  };

  const handleSearch = () => {
    const filters = {
      classFilter,
      sectionFilter,
      searchText,
    };

    setAppliedFilters(filters);

    const result = getFilteredStudents(filters);

    if (result.length === 0) {
      alert("No active student found");
    }

    setIsSearched(true);
    setSelectedIds([]);
  };

  const filteredStudents = getFilteredStudents(appliedFilters);

  const selectedStudents = students.filter((item) =>
    selectedIds.includes(item.id)
  );

  const selectedSingle =
    selectedStudents.length === 1 ? selectedStudents[0] : null;
const selectedAllocatedCount =
  selectedStudents.filter(
    (item) =>
      item.routeName &&
      item.vehicleNo
  ).length;

const allocateButtonText =
  selectedIds.length > 0 &&
  selectedAllocatedCount ===
    selectedIds.length
    ? "Update Transport"
    : "Allocate Transport";

  const validateSelectedStudents = () => {
    if (selectedIds.length === 0) {
      alert("Select student");
      return false;
    }

    return true;
  };

  const validateSingleStudent = () => {
    if (selectedIds.length === 0) {
      alert("Select one student");
      return false;
    }

    if (selectedIds.length > 1) {
      alert("Select only one student");
      return false;
    }

    return true;
  };

  const handleAllocateOpen = () => {
    if (!validateSelectedStudents()) return;

    setFormData({
      routeId: "",
      vehicleId: "",
    });

    setShowForm(true);
  };

  const handleSaveAllocation = () => {
    if (!formData.routeId || !formData.vehicleId) {
      alert("Select route and vehicle");
      return;
    }

    const selectedRoute = availableRoutes.find(
      (item) => item.id === Number(formData.routeId)
    );

    const selectedVehicle = availableVehicles.find(
      (item) => item.id === Number(formData.vehicleId)
    );

    if (!selectedRoute || !selectedVehicle) {
      alert("Invalid route or vehicle");
      return;
    }

    setStudents((prev) =>
      prev.map((student) =>
        selectedIds.includes(student.id)
          ? {
              ...student,
              routeId: selectedRoute.id,
              routeName: selectedRoute.routeName,
              vehicleId: selectedVehicle.id,
              vehicleNo: selectedVehicle.vehicleNo,
              transportFee: selectedRoute.monthlyFee,
              removedMonths: [],
            }
          : student
      )
    );

    alert("Transport allocated successfully");

    setSelectedIds([]);
    setShowForm(false);
    setFormData({
      routeId: "",
      vehicleId: "",
    });
  };

  const handleRemoveTransportOpen = () => {
    if (!validateSingleStudent()) return;

    if (!selectedSingle.routeName || !selectedSingle.vehicleNo) {
      alert("Transport is not allocated to this student");
      return;
    }

    setRemoveType("Months");
    setSelectedMonths(selectedSingle.removedMonths || []);
    setShowRemovePopup(true);
  };

  const handleMonthToggle = (month) => {
    setSelectedMonths((prev) =>
      prev.includes(month)
        ? prev.filter((item) => item !== month)
        : [...prev, month]
    );
  };

  const handleSaveRemoveTransport = () => {
    if (removeType === "Months" && selectedMonths.length === 0) {
      alert("Select at least one month");
      return;
    }

    if (removeType === "Full") {
      const ok = window.confirm("Remove full transport from selected student?");
      if (!ok) return;

      setStudents((prev) =>
        prev.map((student) =>
          student.id === selectedSingle.id
            ? {
                ...student,
                routeId: "",
                routeName: "",
                vehicleId: "",
                vehicleNo: "",
                transportFee: "",
                removedMonths: [],
              }
            : student
        )
      );

      alert("Full transport removed successfully");
    } else {
      setStudents((prev) =>
        prev.map((student) =>
          student.id === selectedSingle.id
            ? {
                ...student,
                removedMonths: selectedMonths,
              }
            : student
        )
      );

      alert("Selected months transport fee removed successfully");
    }

    setSelectedIds([]);
    setSelectedMonths([]);
    setShowRemovePopup(false);
  };

  return (
    <div className="student-transport-page">
      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => {
            if (showForm) {
              setShowForm(false);
            } else {
              window.location.href = "/transport-system";
            }
          }}
        >
          ←
        </AppButton>

        <div>
          <h1>Student Transport Allocation</h1>
          <p>Allocate route and vehicle to active students</p>
        </div>
      </div>

      {!showForm && (
        <>
          <div className="common-card">
            <div className="filter-grid">
              <div className="form-group">
                <label>Class</label>
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                >
                  <option value="">All</option>
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
                  <option value="">All</option>
                  {sectionOptions.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group search-full">
                <label>Search Student</label>
                <input
                  type="text"
                  placeholder="Name, father name, admission no or mobile"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>
            </div>

            <div className="search-btn-row transport-actions">
              <AppButton type="primary" onClick={handleSearch}>
                Search
              </AppButton>
            </div>
          </div>

          <div className="common-card">
            <div className="list-header">
              <h2>Student Transport List</h2>

              <div className="list-action-buttons">
                <AppButton
  type="primary"
  onClick={handleAllocateOpen}
>
  {allocateButtonText}
</AppButton>

                <AppButton type="delete" onClick={handleRemoveTransportOpen}>
                  Remove Transport
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
                          isSearched &&
                          filteredStudents.length > 0 &&
                          selectedIds.length === filteredStudents.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(
                              filteredStudents.map((item) => item.id)
                            );
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                      />
                    </th>
                    <th>Class</th>
                    <th>Section</th>
                    <th>Student Name</th>
                    <th>Father Name</th>
                    <th>Mobile</th>
                    <th>Route</th>
                    <th>Vehicle</th>
                  </tr>
                </thead>

                <tbody>
                  {!isSearched ? (
                    <tr>
                      <td colSpan="8" className="empty-row">
                        Please click Search
                      </td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="empty-row">
                        No active student found
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <tr key={student.id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(student.id)}
                            onChange={() => {
                              setSelectedIds((prev) =>
                                prev.includes(student.id)
                                  ? prev.filter((id) => id !== student.id)
                                  : [...prev, student.id]
                              );
                            }}
                          />
                        </td>

                        <td>{student.className}</td>
                        <td>{student.sectionName}</td>
                        <td>{student.studentName}</td>
                        <td>{student.fatherName}</td>
                        <td>{student.mobile}</td>
                        <td>{student.routeName || "-"}</td>
                        <td>{student.vehicleNo || "-"}</td>
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
              <label>Selected Students</label>
              <input
                type="text"
                value={`${selectedIds.length} student selected`}
                readOnly
              />
            </div>

            <div className="form-group">
              <label>Route</label>
              <select
                value={formData.routeId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    routeId: e.target.value,
                  })
                }
              >
                <option value="">Select Route</option>
                {availableRoutes.map((route) => (
                  <option key={route.id} value={route.id}>
                    {route.routeName} - ₹{route.monthlyFee}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Vehicle</label>
              <select
                value={formData.vehicleId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    vehicleId: e.target.value,
                  })
                }
              >
                <option value="">Select Vehicle</option>
                {availableVehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.vehicleNo}{" "}
                    {vehicle.vehicleName ? `- ${vehicle.vehicleName}` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-actions">
            <AppButton type="primary" onClick={handleSaveAllocation}>
              Save
            </AppButton>

            <AppButton
              type="secondary"
              onClick={() => {
                setShowForm(false);
                setFormData({
                  routeId: "",
                  vehicleId: "",
                });
              }}
            >
              Go Back
            </AppButton>
          </div>
        </div>
      )}

      {showRemovePopup && (
        <div className="popup-overlay">
          <div className="view-popup">
            <div className="popup-head">
              <h2>Remove Transport</h2>

              <button
                className="popup-close-btn"
                onClick={() => setShowRemovePopup(false)}
              >
                ×
              </button>
            </div>

            <div className="remove-options">
              <label>
                <input
                  type="radio"
                  name="removeType"
                  checked={removeType === "Full"}
                  onChange={() => setRemoveType("Full")}
                />
                Remove Full Transport
              </label>

              <label>
                <input
                  type="radio"
                  name="removeType"
                  checked={removeType === "Months"}
                  onChange={() => setRemoveType("Months")}
                />
                Remove Selected Months
              </label>
            </div>

            {removeType === "Months" && (
              <div className="month-grid">
                {monthOptions.map((month) => (
                  <label key={month}>
                    <input
                      type="checkbox"
                      checked={selectedMonths.includes(month)}
                      onChange={() => handleMonthToggle(month)}
                    />
                    {month}
                  </label>
                ))}
              </div>
            )}

            <div className="form-actions">
              <AppButton type="primary" onClick={handleSaveRemoveTransport}>
                Save
              </AppButton>

              <AppButton
                type="secondary"
                onClick={() => setShowRemovePopup(false)}
              >
                Go Back
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentTransportAllocation;