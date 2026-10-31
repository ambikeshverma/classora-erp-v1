import React, { useState, useEffect } from "react";
import "./staffManagement.css";
import AppButton from "../components/AppButton";
import { SkeletonTable } from "../components/Skeleton";
import { hrService } from "../services/api";

const MAX_PHOTO_BYTES = 1024 * 1024;
const MAX_DOCUMENT_BYTES = 6 * 1024 * 1024;

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });

const formatDocumentDate = (value) => (value ? String(value).slice(0, 10).split("-").reverse().join("-") : "-");

function StaffManagement() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoChanged, setPhotoChanged] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [staffList, setStaffList] = useState([]);

  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
    "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
    "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh",
    "Puducherry", "Chandigarh", "Andaman and Nicobar Islands",
    "Dadra and Nagar Haveli and Daman and Diu", "Lakshadweep"
  ];

  const documentTypes = [
    "Employee Photo", "Signature", "Aadhaar Card", "PAN Card", "Voter ID",
    "Driving License", "Passport", "10th Marksheet", "12th Marksheet",
    "Graduation Certificate", "Post Graduation Certificate",
    "B.Ed / D.El.Ed / BTC", "Professional Certificates", "Training Certificates",
    "Resume / CV", "Joining Letter", "Appointment Letter", "Offer Letter",
    "Relieving Letter", "Experience Letter", "Promotion Letter", "Transfer Letter",
    "Bank Passbook", "Cancelled Cheque", "Salary Agreement", "PF Details",
    "ESIC Details", "Police Verification", "Medical Certificate",
    "Character Certificate", "Background Verification", "ID Card Copy",
    "Contract Copy", "NDA / Staff Agreement", "Warning Letters",
    "Performance Reports", "Other Documents", "Custom Upload"
  ];

  const emptyForm = {
    employeePhoto: "",
    employeeName: "",
    gender: "",
    mobile: "",
    email: "",
    dob: "",
    aadhaar: "",
    pan: "",
    religion: "",
    community: "",
    caste: "",
    bloodGroup: "",
    highestEducation: "",
    erpEmployeeCode: "",
    schoolEmployeeCode: "",
    departmentId: "",
    positionId: "",
    biometricId: "",
    teachingStaff: "",
    joiningDate: "",
    resignationNoticeDate: "",
    lastWorkingDate: "",
    localAddress: "",
    state: "",
    city: "",
    postalCode: "",
    permanentAddress: "",
    bankName: "",
    branchName: "",
    accountNumber: "",
    ifscCode: "",
  };

  const [showForm, setShowForm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activeProfileTab, setActiveProfileTab] = useState("Profile");
  const [selectedIds, setSelectedIds] = useState([]);
  const [editId, setEditId] = useState(null);
  const [profileData, setProfileData] = useState(null);

  const [filterData, setFilterData] = useState({
    departmentId: "",
    positionId: "",
  });

  const [appliedFilters, setAppliedFilters] = useState({
    departmentId: "",
    positionId: "",
  });

  const [formData, setFormData] = useState(emptyForm);

  /* ===============================
     Fetch Initial Data (Optimized: single call on mount)
  =============================== */
  const fetchData = async () => {
    try {
      setLoading(true);
      const [depRes, posRes, staffRes] = await Promise.all([
        hrService.getDepartments(),
        hrService.getPositions(),
        hrService.getStaff(),
      ]);
      if (depRes.data?.success) setDepartments(depRes.data.data || []);
      if (posRes.data?.success) setPositions(posRes.data.data || []);
      if (staffRes.data?.success) setStaffList(staffRes.data.data || []);
    } catch (err) {
      console.error("Failed to load staff data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [missingOnly, setMissingOnly] = useState(false);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState([]);

  const [documentForm, setDocumentForm] = useState({
    documentName: "",
    file: null,
  });

  const schoolDepartments = departments;

  const filteredPositions = positions.filter(
    (item) =>
      !formData.departmentId ||
      (item.departmentId?._id || item.departmentId) === formData.departmentId
  );

  const filterPositions = positions.filter(
    (item) =>
      !filterData.departmentId ||
      (item.departmentId?._id || item.departmentId) === filterData.departmentId
  );

  const activeStaff = staffList.filter(
    (item) =>
      item.isActive !== false &&
      (!appliedFilters.departmentId ||
        (item.departmentId?._id || item.departmentId) === appliedFilters.departmentId) &&
      (!appliedFilters.positionId ||
        (item.positionId?._id || item.positionId) === appliedFilters.positionId)
  );


  const resetForm = () => {
    setFormData(emptyForm);
    setEditId(null);
    setPhotoChanged(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
      ...(name === "departmentId" ? { positionId: "" } : {}),
    });
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (file.size > MAX_PHOTO_BYTES) {
      alert("Photo must be smaller than 1 MB");
      e.target.value = "";
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setFormData((prev) => ({ ...prev, employeePhoto: dataUrl }));
      setPhotoChanged(true);
    } catch {
      alert("Failed to read photo");
    }
  };

  const validateForm = () => {
    if (
      !formData.employeeName.trim() ||
      !formData.gender ||
      !formData.mobile.trim() ||
      !formData.email.trim() ||
      !formData.departmentId ||
      !formData.positionId ||
      !formData.teachingStaff ||
      !formData.joiningDate ||
      !formData.localAddress.trim() ||
      !formData.state
    ) {
      alert("Please fill all required fields");
      return false;
    }

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);

    if (!emailOk) {
      alert("Enter valid email address");
      return false;
    }
    if (!/^[0-9]{10}$/.test(formData.mobile)) {
  alert("Enter valid 10 digit mobile number");
  return false;
}

if (
  formData.aadhaar &&
  !/^[0-9]{12}$/.test(formData.aadhaar)
) {
  alert("Enter valid Aadhaar number");
  return false;
}

if (
  formData.pan &&
  !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(
    formData.pan.toUpperCase()
  )
) {
  alert("Enter valid PAN number");
  return false;
}

    // Duplicate mobile / email are checked on the server for the whole school
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    // The photo is only sent when a new one was chosen so an existing photo is never wiped
    const payload = { ...formData };
    if (!photoChanged) delete payload.employeePhoto;

    try {
      setSaving(true);

      if (editId) {
        const res = await hrService.updateStaff(editId, payload);
        if (res.data?.success) {
          alert("Staff updated successfully");
          setStaffList((prev) =>
            prev.map((item) => ((item._id || item.id) === editId ? res.data.data : item))
          );
        }
      } else {
        const res = await hrService.createStaff(payload);
        if (res.data?.success) {
          alert("Staff added successfully");
          setStaffList((prev) => [...prev, res.data.data]);
        }
      }

      resetForm();
      setShowForm(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save staff");
    } finally {
      setSaving(false);
    }
  };

  const handleSearch = () => {
    setAppliedFilters(filterData);
    setSelectedIds([]);
  };

  const handleEdit = () => {
    if (selectedIds.length !== 1) {
      alert("Select one staff");
      return;
    }

    const selected = staffList.find((item) => (item._id || item.id) === selectedIds[0]);
    if (!selected) return;

    setEditId(selected._id || selected.id);
    setFormData({
      ...emptyForm,
      ...selected,
      departmentId: selected.departmentId?._id || selected.departmentId || "",
      positionId: selected.positionId?._id || selected.positionId || "",
    });

    setShowForm(true);
  };

  const handleDelete = async () => {
    if (selectedIds.length === 0) {
      alert("Select staff to delete");
      return;
    }

    const ok = window.confirm(`Delete ${selectedIds.length} selected staff member(s)?`);
    if (!ok) return;

    try {
      for (const id of selectedIds) {
        await hrService.deleteStaff(id);
      }
      setStaffList((prev) => prev.filter((item) => !selectedIds.includes(item._id || item.id)));
      setSelectedIds([]);
      alert("Staff deleted successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete staff");
    }
  };

  const handleProfileOpen = async () => {
    if (selectedIds.length !== 1) {
      alert("Select one staff");
      return;
    }

    try {
      setSaving(true);
      // Photo is not part of the list response, so the full record is loaded here
      const res = await hrService.getStaffById(selectedIds[0]);
      if (!res.data?.data) return;

      setProfileData(res.data.data);
      setActiveProfileTab("Profile");
      setShowProfile(true);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to load staff profile");
    } finally {
      setSaving(false);
    }
  };

  const uploadedDocumentNames =
    profileData?.documents?.map((doc) => doc.documentName) || [];

  const availableDocumentTypes = missingOnly
    ? documentTypes.filter((doc) => !uploadedDocumentNames.includes(doc))
    : documentTypes;
  const profileStaffId = profileData?._id || profileData?.id;

  const handleUploadDocument = async () => {
    if (!documentForm.documentName || !documentForm.file) {
      alert("Select document type and file");
      return;
    }

    if (documentForm.file.size > MAX_DOCUMENT_BYTES) {
      alert("File must be smaller than 6 MB");
      return;
    }

    try {
      setSaving(true);
      const fileUrl = await readFileAsDataUrl(documentForm.file);

      const res = await hrService.uploadStaffDocument(profileStaffId, {
        documentName: documentForm.documentName,
        fileName: documentForm.file.name,
        fileUrl,
      });

      setProfileData((prev) => ({ ...prev, documents: res.data?.data || [] }));
      setDocumentForm({ documentName: "", file: null });
      setMissingOnly(false);
      setShowUploadPopup(false);

      alert("Document uploaded successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to upload document");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadDocument = async () => {
    if (selectedDocumentIds.length !== 1) {
      alert("Select one document");
      return;
    }

    try {
      setSaving(true);
      const res = await hrService.getStaffDocument(profileStaffId, selectedDocumentIds[0]);
      const file = res.data?.data;
      if (!file?.fileUrl) {
        alert("Document file not found");
        return;
      }

      const link = document.createElement("a");
      link.href = file.fileUrl;
      link.download = file.fileName || "document";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to download document");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (selectedDocumentIds.length === 0) {
      alert("Select document");
      return;
    }

    if (!window.confirm("Delete selected document?")) return;

    try {
      setSaving(true);

      let remaining = profileData.documents;
      for (const docId of selectedDocumentIds) {
        const res = await hrService.deleteStaffDocument(profileStaffId, docId);
        remaining = res.data?.data || remaining;
      }

      setProfileData((prev) => ({ ...prev, documents: remaining }));
      setSelectedDocumentIds([]);

      alert("Document deleted successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete document");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="staff-management-page">

      <div className="common-page-header">

        <AppButton
          type="back"
          onClick={() => {

            if (
              showForm ||
              showProfile
            ) {

              resetForm();

              setShowForm(false);

              setShowProfile(false);

            } else {

              window.location.href =
                "/staff-control";
            }
          }}
        >
          ←
        </AppButton>

        <div>

          <h1>

            {showForm
              ? "Add / Edit Staff"
              : showProfile
              ? "Employee Profile"
              : "Staff Management"}

          </h1>

          <p>
            Add and manage school staff
          </p>

        </div>

      </div>

      {!showForm && !showProfile && (
        <>

          <div className="common-card">

            <div className="staff-filter-grid">

              <div className="form-group">

                <label>
                  Department
                </label>

                <select
                  name="departmentId"
                  value={
                    filterData.departmentId
                  }
                  onChange={(e) =>
                    setFilterData({
                      ...filterData,
                      departmentId:
                        e.target.value,
                      positionId: "",
                    })
                  }
                >

                  <option value="">
                    All Department
                  </option>

                  {schoolDepartments.map(
                    (item) => (

                      <option
                        key={item.id}
                        value={
                          item.id
                        }
                      >
                        {
                          item.departmentName
                        }
                      </option>

                    )
                  )}

                </select>

              </div>

              <div className="form-group">

                <label>
                  Position
                </label>

                <select
                  name="positionId"
                  value={
                    filterData.positionId
                  }
                  onChange={(e) =>
                    setFilterData({
                      ...filterData,
                      positionId:
                        e.target.value,
                    })
                  }
                >

                  <option value="">
                    All Position
                  </option>

                  {filterPositions.map(
                    (item) => (

                      <option
                        key={item.id}
                        value={
                          item.id
                        }
                      >
                        {
                          item.positionName
                        }
                      </option>

                    )
                  )}

                </select>

              </div>

            </div>

            <div className="staff-search-actions">

  <AppButton
    type="primary"
    onClick={handleSearch}
  >
    Search
  </AppButton>

  <AppButton
    type="primary"
    onClick={() => {

      resetForm();

      setShowForm(true);
    }}
  >
    + Add New Staff
  </AppButton>

</div>

          </div>

          <div className="common-card">

            <div className="list-header">

              <h2>
                Staff List
              </h2>
              <div className="list-action-buttons">
                <AppButton
                  type="primary"
                  onClick={handleProfileOpen}
                >
                  Profile
                </AppButton>

                <AppButton
                  type="primary"
                  onClick={handleEdit}
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
                          activeStaff.length > 0 &&
                          selectedIds.length === activeStaff.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds(
                              activeStaff.map((item) => item._id || item.id)
                            );
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                      />
                    </th>

                    <th>S.No</th>
                    <th>Department</th>
                    <th>Position</th>
                    <th>Employee Code</th>
                    <th>Employee Name</th>
                    <th>Mobile</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" style={{ padding: "4px 0", border: "none" }}>
                        <SkeletonTable rows={5} columns={7} />
                      </td>
                    </tr>
                  ) : activeStaff.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="empty-row">
                        No staff found
                      </td>
                    </tr>
                  ) : (
                    activeStaff.map((item, index) => {
                      const itemId = item._id || item.id;
                      const deptName =
                        item.departmentId?.departmentName ||
                        schoolDepartments.find(
                          (dept) => (dept._id || dept.id) === item.departmentId
                        )?.departmentName ||
                        "-";
                      const posName =
                        item.positionId?.positionName ||
                        positions.find(
                          (pos) => (pos._id || pos.id) === item.positionId
                        )?.positionName ||
                        "-";

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
                          <td>{deptName}</td>
                          <td>{posName}</td>
                          <td>{item.employeeCode}</td>
                          <td>{item.employeeName}</td>
                          <td>{item.mobile}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </>
      )}
      {showForm && (

        <div className="common-card">

          <h2 className="form-section-title">
            Primary Details
          </h2>

          <div className="staff-form-grid">

            <div className="form-group">

              <label>
                Employee Photo
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={
                  handlePhotoChange
                }
              />

            </div>

            <div className="form-group">

              <label>
                Employee Name *
              </label>

              <input
                name="employeeName"
                value={
                  formData.employeeName
                }
                onChange={
                  handleFormChange
                }
              />

            </div>

            <div className="form-group">

              <label>
                Gender *
              </label>

              <select
                name="gender"
                value={formData.gender}
                onChange={
                  handleFormChange
                }
              >

                <option value="">
                  Select Gender
                </option>

                <option>
                  Male
                </option>

                <option>
                  Female
                </option>

                <option>
                  Other
                </option>

              </select>

            </div>

            <div className="form-group">

              <label>
                Mobile Number *
              </label>

              <input
                name="mobile"
                value={formData.mobile}
                onChange={
                  handleFormChange
                }
              />

            </div>

            <div className="form-group">

              <label>
                Email ID *
              </label>

              <input
                name="email"
                value={formData.email}
                onChange={
                  handleFormChange
                }
              />

            </div>

            <div className="form-group">

              <label>
                DOB
              </label>

              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={
                  handleFormChange
                }
              />

            </div>

            <div className="form-group">

              <label>
                Aadhaar Number
              </label>

              <input
                name="aadhaar"
                value={formData.aadhaar}
                onChange={
                  handleFormChange
                }
              />

            </div>

            <div className="form-group">

              <label>
                PAN Number
              </label>

              <input
                name="pan"
                value={formData.pan}
                onChange={
                  handleFormChange
                }
              />

            </div>

            <div className="form-group">

              <label>
                Religion
              </label>

              <input
                name="religion"
                value={formData.religion}
                onChange={
                  handleFormChange
                }
              />

            </div>

            <div className="form-group">

              <label>
                Community
              </label>

              <input
                name="community"
                value={formData.community}
                onChange={
                  handleFormChange
                }
              />

            </div>

            <div className="form-group">

              <label>
                Caste
              </label>

              <input
                name="caste"
                value={formData.caste}
                onChange={
                  handleFormChange
                }
              />

            </div>

            <div className="form-group">

              <label>
                Blood Group
              </label>

              <input
                name="bloodGroup"
                value={
                  formData.bloodGroup
                }
                onChange={
                  handleFormChange
                }
              />

            </div>

            <div className="form-group">

              <label>
                Highest Education
              </label>

              <input
                name="highestEducation"
                value={
                  formData.highestEducation
                }
                onChange={
                  handleFormChange
                }
              />

            </div>

          </div>

          <h2 className="form-section-title">
            Office Details
          </h2>

          <div className="staff-form-grid">

            <div className="form-group">

              <label>
                ERP Employee Code
              </label>

              <input
                value={
                  editId
                    ? formData.employeeCode
                    : "Auto Generated"
                }
                readOnly
              />

            </div>

            <div className="form-group">

              <label>
                School Employee Code
              </label>

              <input
                name="schoolEmployeeCode"
                value={
                  formData.schoolEmployeeCode
                }
                onChange={
                  handleFormChange
                }
              />

            </div>

            <div className="form-group">

              <label>
                Department *
              </label>

              <select
                name="departmentId"
                value={
                  formData.departmentId
                }
                onChange={
                  handleFormChange
                }
              >

                <option value="">
                  Select Department
                </option>

                {schoolDepartments.map(
                  (item) => (

                    <option
                      key={item.id}
                      value={
                        item.id
                      }
                    >
                      {
                        item.departmentName
                      }
                    </option>

                  )
                )}

              </select>

            </div>

            <div className="form-group">

              <label>
                Position *
              </label>

              <select
                name="positionId"
                value={
                  formData.positionId
                }
                onChange={
                  handleFormChange
                }
              >

                <option value="">
                  Select Position
                </option>

                {filteredPositions.map(
                  (item) => (

                    <option
                      key={item.id}
                      value={
                        item.id
                      }
                    >
                      {
                        item.positionName
                      }
                    </option>

                  )
                )}

              </select>

            </div>
            <div className="form-group">
              <label>
                Biometric ID
              </label>

              <input
                name="biometricId"
                value={
                  formData.biometricId
                }
                onChange={
                  handleFormChange
                }
              />
            </div>

            <div className="form-group">
              <label>
                Teaching Staff *
              </label>

              <select
                name="teachingStaff"
                value={
                  formData.teachingStaff
                }
                onChange={
                  handleFormChange
                }
              >
                <option value="">
                  Select
                </option>

                <option>
                  Yes
                </option>

                <option>
                  No
                </option>
              </select>
            </div>

            <div className="form-group">
              <label>
                Joining Date *
              </label>

              <input
                type="date"
                name="joiningDate"
                value={
                  formData.joiningDate
                }
                onChange={
                  handleFormChange
                }
              />
            </div>

            <div className="form-group">
              <label>
                Resignation Notice Date
              </label>

              <input
                type="date"
                name="resignationNoticeDate"
                value={
                  formData.resignationNoticeDate
                }
                onChange={
                  handleFormChange
                }
              />
            </div>

            <div className="form-group">
              <label>
                Last Working Date
              </label>

              <input
                type="date"
                name="lastWorkingDate"
                value={
                  formData.lastWorkingDate
                }
                onChange={
                  handleFormChange
                }
              />
            </div>

          </div>

          <h2 className="form-section-title">
            Address Details
          </h2>

          <div className="staff-form-grid">

            <div className="form-group full-width">
              <label>
                Local Address *
              </label>

              <textarea
                name="localAddress"
                value={
                  formData.localAddress
                }
                onChange={
                  handleFormChange
                }
              ></textarea>
            </div>

            <div className="form-group">
              <label>
                State *
              </label>

              <select
                name="state"
                value={
                  formData.state
                }
                onChange={
                  handleFormChange
                }
              >
                <option value="">
                  Select State
                </option>

                {indianStates.map(
                  (state) => (
                    <option key={state}>
                      {state}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="form-group">
              <label>
                City
              </label>

              <input
                name="city"
                value={formData.city}
                onChange={
                  handleFormChange
                }
              />
            </div>

            <div className="form-group">
              <label>
                Postal Code
              </label>

              <input
                name="postalCode"
                value={
                  formData.postalCode
                }
                onChange={
                  handleFormChange
                }
              />
            </div>

            <div className="form-group full-width">
              <label>
                Permanent Address
              </label>

              <textarea
                name="permanentAddress"
                value={
                  formData.permanentAddress
                }
                onChange={
                  handleFormChange
                }
              ></textarea>
            </div>

          </div>

          <h2 className="form-section-title">
            Bank Details
          </h2>

          <div className="staff-form-grid">

            <div className="form-group">
              <label>
                Bank Name
              </label>

              <input
                name="bankName"
                value={
                  formData.bankName
                }
                onChange={
                  handleFormChange
                }
              />
            </div>

            <div className="form-group">
              <label>
                Branch Name
              </label>

              <input
                name="branchName"
                value={
                  formData.branchName
                }
                onChange={
                  handleFormChange
                }
              />
            </div>

            <div className="form-group">
              <label>
                Account Number
              </label>

              <input
                name="accountNumber"
                value={
                  formData.accountNumber
                }
                onChange={
                  handleFormChange
                }
              />
            </div>

            <div className="form-group">
              <label>
                IFSC Code
              </label>

              <input
                name="ifscCode"
                value={
                  formData.ifscCode
                }
                onChange={
                  handleFormChange
                }
              />
            </div>

          </div>

          <div className="form-actions">
            <AppButton
              type="primary"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : editId ? "Update" : "Save"}
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
      {showProfile && profileData && (
        <div className="common-card">

          <div className="staff-profile-head">

            <div className="staff-photo-box">
              {profileData.employeePhoto ? (
                <img
                  src={profileData.employeePhoto}
                  alt="Staff"
                />
              ) : (
                <span>👨‍🏫</span>
              )}
            </div>

            <div>
              <h2>
                {profileData.employeeName}
              </h2>

              <p>
                {profileData.employeeCode}
              </p>

             <p>
  {profileData.departmentId?.departmentName || "-"}
  {" - "}
  {profileData.positionId?.positionName || "-"}
</p>
            </div>

          </div>

          <div className="profile-tabs">

            <button
              className={
                activeProfileTab === "Profile"
                  ? "active-profile-tab"
                  : ""
              }
              onClick={() =>
                setActiveProfileTab("Profile")
              }
            >
              Profile
            </button>

            <button
              className={
                activeProfileTab === "Documents"
                  ? "active-profile-tab"
                  : ""
              }
              onClick={() =>
                setActiveProfileTab("Documents")
              }
            >
              Documents
            </button>

          </div>

          {activeProfileTab === "Profile" && (
            <div className="profile-detail-grid">

              <p>
                <strong>Mobile:</strong> {profileData.mobile}
              </p>

              <p>
                <strong>Email:</strong> {profileData.email}
              </p>

              <p>
                <strong>Gender:</strong> {profileData.gender}
              </p>

              <p>
                <strong>Teaching Staff:</strong> {profileData.teachingStaff}
              </p>

              <p>
                <strong>Joining Date:</strong> {profileData.joiningDate}
              </p>

              <p>
                <strong>Address:</strong> {profileData.localAddress}
              </p>

              <p>
                <strong>State:</strong> {profileData.state}
              </p>

              <p>
                <strong>Bank:</strong> {profileData.bankName || "-"}
              </p>

            </div>
          )}

          {activeProfileTab === "Documents" && (
            <>

              <div className="top-action-bar">

                <AppButton
                  type="primary"
                  onClick={() => {
                    setShowUploadPopup(true);
                    setSelectedDocumentIds([]);
                  }}
                >
                  Upload Document
                </AppButton>

              </div>

              <div className="list-header">

                <h2>
                  Documents
                </h2>

                <div className="list-action-buttons">

                  <AppButton
                    type="primary"
                    onClick={handleDownloadDocument}
                  >
                    Download
                  </AppButton>

                  <AppButton
                    type="delete"
                    onClick={handleDeleteDocument}
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
                            profileData.documents?.length > 0 &&
                            selectedDocumentIds.length ===
                              profileData.documents.length
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDocumentIds(
                                profileData.documents.map(
                                  (doc) => doc._id
                                )
                              );
                            } else {
                              setSelectedDocumentIds([]);
                            }
                          }}
                        />
                      </th>

                      <th>S.No</th>

                      <th>Document Name</th>

                      <th>Upload Date</th>

                      <th>Uploaded By</th>

                    </tr>

                  </thead>

                  <tbody>

                    {!profileData.documents ||
                    profileData.documents.length === 0 ? (

                      <tr>
                        <td
                          colSpan="5"
                          className="empty-row"
                        >
                          No document uploaded
                        </td>
                      </tr>

                    ) : (

                      profileData.documents.map(
                        (doc, index) => (

                          <tr key={doc._id}>

                            <td>
                              <input
                                type="checkbox"
                                checked={selectedDocumentIds.includes(
                                  doc._id
                                )}
                                onChange={() => {
                                  setSelectedDocumentIds(
                                    (prev) =>
                                      prev.includes(doc._id)
                                        ? prev.filter(
                                            (id) => id !== doc._id
                                          )
                                        : [...prev, doc._id]
                                  );
                                }}
                              />
                            </td>

                            <td>
                              {index + 1}
                            </td>

                            <td>
                              {doc.documentName}
                            </td>

                            <td>
                              {formatDocumentDate(doc.uploadedAt)}
                            </td>

                            <td>
                              {doc.uploadedBy}
                            </td>

                          </tr>

                        )
                      )

                    )}

                  </tbody>

                </table>

              </div>

            </>
          )}

        </div>
      )}
      {showUploadPopup && (
        <div className="popup-overlay">

          <div className="view-popup">

            <div className="popup-head">

              <h2>
                Upload Document
              </h2>

              <button
                className="popup-close-btn"
                onClick={() =>
                  setShowUploadPopup(false)
                }
              >
                ×
              </button>

            </div>

            <div className="missing-only-row">

              <label>
                <input
                  type="checkbox"
                  checked={missingOnly}
                  onChange={(e) => {
                    setMissingOnly(
                      e.target.checked
                    );

                    setDocumentForm({
                      ...documentForm,
                      documentName: "",
                    });
                  }}
                />

                Missing Only
              </label>

            </div>

            <div className="form-group">

              <label>
                Document Type *
              </label>

              <select
                value={
                  documentForm.documentName
                }
                onChange={(e) =>
                  setDocumentForm({
                    ...documentForm,
                    documentName:
                      e.target.value,
                  })
                }
              >

                <option value="">
                  Select Document
                </option>

                {availableDocumentTypes.map(
                  (doc) => (

                    <option
                      key={doc}
                      value={doc}
                    >
                      {doc}
                    </option>

                  )
                )}

              </select>

            </div>

            <div className="form-group">

              <label>
                Choose File *
              </label>

              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) =>
                  setDocumentForm({
                    ...documentForm,
                    file:
                      e.target.files[0],
                  })
                }
              />

            </div>

            <div className="form-actions">

              <AppButton
                type="primary"
                onClick={
                  handleUploadDocument
                }
              >
                Upload
              </AppButton>

              <AppButton
                type="secondary"
                onClick={() =>
                  setShowUploadPopup(false)
                }
              >
                Cancel
              </AppButton>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default StaffManagement;