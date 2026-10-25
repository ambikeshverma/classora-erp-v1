import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./houseAllocation.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { studentHubService } from "../services/api";

function HouseAllocation() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [allocating, setAllocating] = useState(false);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [houses, setHouses] = useState([]);
  const [students, setStudents] = useState([]);

  const [selectedIds, setSelectedIds] = useState([]);

  const [searchText, setSearchText] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [houseFilter, setHouseFilter] = useState("");
  const [selectedHouse, setSelectedHouse] = useState("");

  const loadMetaAndStudents = async () => {
    try {
      setLoading(true);
      const [metaRes, studRes] = await Promise.all([
        studentHubService.getMeta(),
        studentHubService.getHouseAllocations({}),
      ]);

      if (metaRes.data?.success) {
        setClasses(metaRes.data.data.classes || []);
        setSections(metaRes.data.data.sections || []);
        setHouses(metaRes.data.data.houses || []);
      }

      if (studRes.data?.success) {
        setStudents(studRes.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load house allocations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetaAndStudents();
  }, []);

  const handleSearch = async () => {
    try {
      setLoading(true);
      const params = {};
      if (classFilter) params.className = classFilter;
      if (sectionFilter) params.section = sectionFilter;
      if (houseFilter) params.houseName = houseFilter;
      if (searchText) params.search = searchText;

      const res = await studentHubService.getHouseAllocations(params);
      if (res.data?.success) {
        setStudents(res.data.data || []);
      }
      setSelectedIds([]);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAllocateHouse = async () => {
    if (!selectedHouse) {
      alert("Please select a house to allocate");
      return;
    }

    if (selectedIds.length === 0) {
      alert("Please select at least one student");
      return;
    }

    const matchedHouse = houses.find((h) => h.houseName === selectedHouse);

    try {
      setAllocating(true);
      const res = await studentHubService.bulkAllocateHouse({
        studentIds: selectedIds,
        houseName: selectedHouse,
        houseId: matchedHouse?._id || null,
      });

      if (res.data?.success) {
        alert(res.data.message || "House allocated successfully");
        setSelectedIds([]);
        setSelectedHouse("");
        handleSearch();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to allocate house");
    } finally {
      setAllocating(false);
    }
  };

  const handleRemoveAllocation = async () => {
    if (selectedIds.length === 0) {
      alert("Please select at least one student");
      return;
    }

    const ok = window.confirm(`Remove house allocation from ${selectedIds.length} student(s)?`);
    if (!ok) return;

    try {
      setAllocating(true);
      const res = await studentHubService.bulkAllocateHouse({
        studentIds: selectedIds,
        houseName: "",
        houseId: null,
      });

      if (res.data?.success) {
        alert("House allocation removed successfully");
        setSelectedIds([]);
        handleSearch();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to remove house allocation");
    } finally {
      setAllocating(false);
    }
  };


  // Filter sections by selected class if any
  const availableSections = classFilter
    ? sections.filter((s) => s.className === classFilter)
    : sections;

  return (
    <div className="house-allocation-page">
      <div className="common-page-header">
        <AppButton type="back" onClick={() => navigate("/student-hub")}>
          ←
        </AppButton>

        <div>
          <h1>House Allocation</h1>
          <p>Assign students to houses individually or in bulk</p>
        </div>
      </div>

      <div className="common-card">
        <div className="filter-grid">
          <div className="form-group">
            <label>Class</label>
            <select
              value={classFilter}
              onChange={(e) => {
                setClassFilter(e.target.value);
                setSectionFilter("");
              }}
            >
              <option value="">All Classes</option>
              {classes.map((item) => (
                <option key={item._id || item.className} value={item.className}>
                  {item.className}
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
              <option value="">All Sections</option>
              {availableSections.map((item) => (
                <option key={item._id || item.sectionName} value={item.sectionName}>
                  Section {item.sectionName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>House Status</label>
            <select
              value={houseFilter}
              onChange={(e) => setHouseFilter(e.target.value)}
            >
              <option value="">All Houses</option>
              {houses.map((item) => (
                <option key={item._id || item.houseName} value={item.houseName}>
                  {item.houseName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search by student name or admission no..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
        </div>

        <div className="search-btn-row">
          <AppButton type="primary" onClick={handleSearch}>
            Search
          </AppButton>
        </div>
      </div>

      <div className="common-card">
        <div className="allocation-action-row">
          <div className="bulk-box">
            <label>Assign Selected to House:</label>
            <select
              value={selectedHouse}
              onChange={(e) => setSelectedHouse(e.target.value)}
            >
              <option value="">Select House</option>
              {houses.map((item) => (
                <option key={item._id || item.houseName} value={item.houseName}>
                  {item.houseName}
                </option>
              ))}
            </select>

            <AppButton
              type="primary"
              onClick={handleAllocateHouse}
              disabled={allocating || selectedIds.length === 0}
            >
              {allocating ? "Allocating..." : "Allocate House"}
            </AppButton>

            <AppButton
              type="delete"
              onClick={handleRemoveAllocation}
              disabled={allocating || selectedIds.length === 0}
            >
              Remove House
            </AppButton>
          </div>

          <div className="selected-count-badge">
            {selectedIds.length} of {students.length} selected
          </div>
        </div>

        <div className="table-wrap">
          {loading ? (
            <SkeletonTable rows={6} columns={6} />
          ) : (
            <table>
              <thead>
                <tr>
                  <th style={{ width: "40px" }}>
                    <input
                      type="checkbox"
                      checked={
                        students.length > 0 &&
                        selectedIds.length === students.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(students.map((item) => item._id || item.id));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                    />
                  </th>
                  <th>S.No</th>
                  <th>Admission No</th>
                  <th>Student Name</th>
                  <th>Class & Section</th>
                  <th>House</th>
                </tr>
              </thead>

              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-row">
                      No students found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  students.map((item, index) => {
                    const itemId = item._id || item.id;
                    const houseObj = houses.find((h) => h.houseName === item.house);
                    return (
                      <tr key={itemId}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(itemId)}
                            onChange={() => {
                              setSelectedIds((prev) =>
                                prev.includes(itemId)
                                  ? prev.filter((id) => id !== itemId)
                                  : [...prev, itemId]
                              );
                            }}
                          />
                        </td>
                        <td>{index + 1}</td>
                        <td><span className="badge-code">{item.admissionNo || item.srNo || "—"}</span></td>
                        <td><strong>{item.studentName}</strong></td>
                        <td>{item.className} {item.section ? `(${item.section})` : ""}</td>
                        <td>
                          {item.house ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "4px 10px",
                                borderRadius: "12px",
                                backgroundColor: houseObj?.color ? `${houseObj.color}22` : "#e0e7ff",
                                color: houseObj?.color || "#4338ca",
                                fontWeight: "600",
                                fontSize: "12px",
                              }}
                            >
                              <span
                                style={{
                                  width: "8px",
                                  height: "8px",
                                  borderRadius: "50%",
                                  backgroundColor: houseObj?.color || "#4338ca",
                                }}
                              />
                              {item.house}
                            </span>
                          ) : (
                            <span style={{ color: "#9ca3af", fontStyle: "italic", fontSize: "13px" }}>
                              Not Allocated
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default HouseAllocation;