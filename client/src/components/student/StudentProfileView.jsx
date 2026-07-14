import React, { useMemo, useState } from "react";
import "./StudentProfileView.css";
import AppButton from "../AppButton";

function StudentProfileView({ studentId = 1, onClose }) {
  const schoolId = localStorage.getItem("schoolId") || "SCH001";

  const [activeTab, setActiveTab] = useState("profile");
  const [openMenu, setOpenMenu] = useState(false);
  const [editPopup, setEditPopup] = useState(null);
  const [editForm, setEditForm] = useState({});

  const studentsDemo = [
    {
      id: 1,
      schoolId: "SCH001",
      studentName: "Anurag Yadav",
      admissionNo: "2526/CSIC/S/221",
      className: "Class 6",
      sectionName: "A",
      medium: "English Medium",
      studentStatus: "Active",
      photo: "",
      routeName: "Girdharipur",
      vehicleName: "",
      feePaid: 0,

      session: "2026-2027",
      erpAdmissionNo: "2526/CSIC/S/221",
      schoolAdmissionNo: "",
      apaarId: "",
      udisePenNo: "",
      admissionDate: "2026-04-07",
      gender: "Male",
      srNo: "484",
      dob: "2018-06-12",
      fatherName: "Sanjay",
      motherName: "Sangeeta Devi",
      mobile: "8127778571",
      altMobile: "",
      email: "",
      aadhar: "752615040908",

      classTeacher: "Sakshi Maurya",
      classTeacherMobile: "6393248633",
      feePlan: "6EM",
      concessionPlan: "RTE Concession Plan",
      house: "Not Assigned",
      hostelRoomNo: "",

      studentNameRL: "",
      fatherNameRL: "",
      motherNameRL: "",

      fatherOccupation: "Farmer",
      fatherEducation: "",
      fatherAadhar: "638814843565",
      familyIncome: "54000",
      motherOccupation: "House Wife",
      motherEducation: "",
      motherAadhar: "751660780091",

      permanentAddress: "Rasauli",
      permanentAddress1: "",
      permanentCity: "Barabanki",
      permanentState: "Uttar Pradesh",
      permanentPin: "225001",

      localAddress: "Rasauli",
      localAddress1: "",
      localCity: "Barabanki",
      localState: "Uttar Pradesh",
      localPin: "225001",

      lastSchool: "",
      lastClass: "",
      height: "116",
      weight: "19.0",
      bloodGroup: "",
      religion: "Hindu",
      community: "OBC",
      caste: "Aheer",

      subjects: ["Hindi", "English", "Math", "Science", "SST"],
      uploadedDocuments: ["Student Image", "Student Aadhaar Card"],
    },
  ];

  const [students, setStudents] = useState(studentsDemo);

  const student = students.find(
    (item) => item.id === studentId && item.schoolId === schoolId
  );

  const classOptions = ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6"];
  const sectionOptions = ["A", "B", "C", "D"];
  const mediumOptions = ["Hindi Medium", "English Medium"];
  const feePlanOptions = ["6HM", "6EM", "7HM", "7EM"];
  const concessionOptions = ["No Concession Plan", "RTE Concession Plan", "Staff Child", "Sibling Concession"];
  const routeOptions = ["Not Assigned", "Girdharipur", "Rasauli Route", "Lucknow Route"];
  const vehicleOptions = ["Not Assigned", "UP32AB1234 - Bus 1", "UP41CD5678 - Van 1"];
  const houseOptions = ["Not Assigned", "Red House", "Blue House", "Green House"];
  const subjectOptions = ["Hindi", "English", "Math", "Science", "SST", "Computer", "Sanskrit"];

  const documentTypes = [
    "Admission Form",
    "Student Image",
    "Student Aadhaar Card",
    "Father Aadhaar Card",
    "Mother Aadhaar Card",
    "Birth Certificate",
    "Previous School TC",
    "Caste Certificate",
    "Income Certificate",
    "Other",
  ];

  const attendanceRows = [
    { month: "April", present: 1, absent: 0, leave: 0 },
    { month: "May", present: 13, absent: 4, leave: 0 },
    { month: "June", present: 0, absent: 0, leave: 0 },
    { month: "July", present: 0, absent: 0, leave: 0 },
    { month: "August", present: 0, absent: 0, leave: 0 },
    { month: "September", present: 0, absent: 0, leave: 0 },
    { month: "October", present: 0, absent: 0, leave: 0 },
    { month: "November", present: 0, absent: 0, leave: 0 },
    { month: "December", present: 0, absent: 0, leave: 0 },
    { month: "January", present: 0, absent: 0, leave: 0 },
    { month: "February", present: 0, absent: 0, leave: 0 },
    { month: "March", present: 0, absent: 0, leave: 0 },
  ];

  const resultRows = [
    { subject: "Hindi", ut1: 18, ut2: 17, halfYearly: 82, ut3: 19, annual: 86 },
    { subject: "English", ut1: 17, ut2: 16, halfYearly: 78, ut3: 18, annual: 82 },
    { subject: "Math", ut1: 19, ut2: 18, halfYearly: 88, ut3: 20, annual: 91 },
    { subject: "Science", ut1: 18, ut2: 17, halfYearly: 84, ut3: 19, annual: 88 },
    { subject: "SST", ut1: 18, ut2: 18, halfYearly: 80, ut3: 18, annual: 84 },
  ];

  const siblings = [
    { id: 2, studentName: "Rohit Yadav", admissionNo: "ADM002", className: "Class 4", sectionName: "B" },
  ];

  const statusClass = `status-${(student?.studentStatus || "Active").toLowerCase()}`;
  const hasTransport =
    student?.routeName &&
    student.routeName !== "Not Assigned" ||
    student?.vehicleName &&
    student.vehicleName !== "Not Assigned";

  const updateStudent = (updatedData) => {
    setStudents((prev) =>
      prev.map((item) =>
        item.id === student.id ? { ...item, ...updatedData } : item
      )
    );
  };

  const openEdit = (type) => {
    setEditPopup(type);
    setOpenMenu(false);

    if (type === "class") {
      setEditForm({ className: student.className, feePlan: student.feePlan });
    } else {
      setEditForm({ ...student });
    }
  };

  const handleUpdate = () => {
    if (editPopup === "class") {
      if (!editForm.className || !editForm.feePlan) {
        alert("Please select both Class and Fee Plan.");
        return;
      }

      if (Number(student.feePaid || 0) > 0) {
        alert("Class and fee plan cannot be changed because fee has already been collected.");
        return;
      }

      updateStudent({
        className: editForm.className,
        feePlan: editForm.feePlan,
      });

      setEditPopup(null);
      return;
    }

    if (editPopup === "section" && !editForm.sectionName) {
      alert("Please select section.");
      return;
    }

    if (editPopup === "medium" && !editForm.medium) {
      alert("Please select medium.");
      return;
    }

    if (editPopup === "feePlan" && !editForm.feePlan) {
      alert("Please select fee plan.");
      return;
    }

    if (editPopup === "concessionPlan" && !editForm.concessionPlan) {
      alert("Please select concession plan.");
      return;
    }

    updateStudent(editForm);
    setEditPopup(null);
  };

  const markInactive = () => {
    const reason = window.prompt("Enter inactive reason:");
    if (!reason) return;
    updateStudent({ studentStatus: "Inactive", inactiveReason: reason });
  };

  const deleteStudent = () => {
    const ok = window.confirm(
      "This will remove student and related data from ERP. Continue?"
    );
    if (!ok) return;
    setStudents((prev) => prev.filter((item) => item.id !== student.id));
    onClose?.();
  };

  const attendanceTotal = useMemo(() => {
    const present = attendanceRows.reduce((sum, row) => sum + row.present, 0);
    const absent = attendanceRows.reduce((sum, row) => sum + row.absent, 0);
    const leave = attendanceRows.reduce((sum, row) => sum + row.leave, 0);
    const totalDays = present + absent + leave;
    const percent = totalDays ? ((present / totalDays) * 100).toFixed(2) : "0.00";

    return { present, absent, leave, totalDays, percent };
  }, []);

  if (!student) {
    return (
      <div className="student-profile-overlay">
        <div className="student-profile-popup">
          <div className="popup-head">
            <h2>Student Profile</h2>
            <button className="popup-close-btn" onClick={onClose}>×</button>
          </div>
          <div className="empty-row">Student not found</div>
        </div>
      </div>
    );
  }

  const FieldRow = ({ label, value, editType }) => (
    <div className="profile-field-row">
      <span>{label}</span>
      <strong>{value || "-"}</strong>
      {editType && (
        <button className="field-edit-btn" onClick={() => openEdit(editType)}>
          📝
        </button>
      )}
    </div>
  );

  return (
    <div className="student-profile-overlay">
      <div className="student-profile-popup">
        <div className="popup-head">
          <h2>Student Profile</h2>
          <button className="popup-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="student-profile-body">
          <div className="student-summary-card">
            <div className="student-photo-box">
              {student.photo ? <img src={student.photo} alt="Student" /> : <span>👤</span>}
            </div>

            <div className="student-summary-details">
              <h2 className={statusClass}>
                {student.studentName} {hasTransport && <span>🚌</span>}
              </h2>
              <p>{student.admissionNo}</p>
              <p>{student.className} | {student.sectionName} | {student.medium}</p>
            </div>

            <div className="profile-action-menu-wrap">
              <button
                className="profile-action-menu-btn"
                onClick={() => setOpenMenu(!openMenu)}
              >
                What do you want? ▼
              </button>

              {openMenu && (
                <div className="profile-action-dropdown">
                  <button onClick={() => setActiveTab("profile")}>View Profile</button>
                  <button onClick={() => alert("Open Session Ledger")}>Open Session Ledger</button>
                  <button onClick={() => alert("Open Deposit Fee")}>Deposit Fee</button>
                  <button onClick={markInactive}>Mark In-Active</button>
                  <button onClick={deleteStudent}>Delete Student</button>
                </div>
              )}
            </div>
          </div>

          <div className="profile-tabs">
            {[
              ["profile", "Profile"],
              ["document", "Document"],
              ["attendance", "Attendance"],
              ["result", "Result"],
              ["message", "Message Log"],
            ].map(([key, label]) => (
              <button
                key={key}
                className={activeTab === key ? "active" : ""}
                onClick={() => setActiveTab(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === "profile" && (
            <>
              <ProfileSection title="Primary Details" onEdit={() => openEdit("primary")}>
                <FieldRow label="Session" value={student.session} />
                <FieldRow label="ERP Admission No" value={student.erpAdmissionNo} />
                <FieldRow label="School Admission No" value={student.schoolAdmissionNo} />
                <FieldRow label="APAAR ID" value={student.apaarId} />
                <FieldRow label="UDISE PEN No" value={student.udisePenNo} />
                <FieldRow label="Admission Date" value={student.admissionDate} />
                <FieldRow label="Gender" value={student.gender} />
                <FieldRow label="SR No" value={student.srNo} />
                <FieldRow label="DOB" value={student.dob} />
                <FieldRow label="Student Name" value={student.studentName} />
                <FieldRow label="Father Name" value={student.fatherName} />
                <FieldRow label="Mother Name" value={student.motherName} />
                <FieldRow label="Mobile" value={student.mobile} />
                <FieldRow label="Alt Mobile" value={student.altMobile} />
                <FieldRow label="Email" value={student.email} />
                <FieldRow label="Aadhaar No" value={student.aadhar} />
              </ProfileSection>

              <div className="common-card profile-section-card">
                <h3>Current Academic Details</h3>
                <div className="profile-field-grid">
                  <FieldRow label="Class Teacher" value={student.classTeacher} />
                  <FieldRow label="Class Teacher Mobile" value={student.classTeacherMobile} />
                  <FieldRow label="Class" value={student.className} editType="class" />
                  <FieldRow label="Section" value={student.sectionName} editType="section" />
                  <FieldRow label="Medium" value={student.medium} editType="medium" />
                  <FieldRow label="Fee Plan" value={student.feePlan} editType="feePlan" />
                  <FieldRow label="Concession Plan" value={student.concessionPlan} editType="concessionPlan" />
                  <FieldRow label="Route Name" value={student.routeName} editType="route" />
                  <FieldRow label="Vehicle Name" value={student.vehicleName} editType="vehicle" />
                  <FieldRow label="House" value={student.house} editType="house" />
                  <FieldRow label="Hostel Room No" value={student.hostelRoomNo} editType="hostel" />
                </div>
              </div>

              <ProfileSection title="Hindi/RL Details" onEdit={() => openEdit("rl")}>
                <FieldRow label="Student Name RL" value={student.studentNameRL} />
                <FieldRow label="Father Name RL" value={student.fatherNameRL} />
                <FieldRow label="Mother Name RL" value={student.motherNameRL} />
              </ProfileSection>

              <ProfileSection title="Parent Details" onEdit={() => openEdit("parent")}>
                <FieldRow label="Father Occupation" value={student.fatherOccupation} />
                <FieldRow label="Father Education" value={student.fatherEducation} />
                <FieldRow label="Father Aadhaar" value={student.fatherAadhar} />
                <FieldRow label="Family Income" value={student.familyIncome} />
                <FieldRow label="Mother Occupation" value={student.motherOccupation} />
                <FieldRow label="Mother Education" value={student.motherEducation} />
                <FieldRow label="Mother Aadhaar" value={student.motherAadhar} />
              </ProfileSection>

              <ProfileSection title="Permanent Address" onEdit={() => openEdit("permanentAddress")}>
                <FieldRow label="Address" value={student.permanentAddress} />
                <FieldRow label="Address1" value={student.permanentAddress1} />
                <FieldRow label="City" value={student.permanentCity} />
                <FieldRow label="State" value={student.permanentState} />
                <FieldRow label="Pin Code" value={student.permanentPin} />
              </ProfileSection>

              <ProfileSection title="Local Address" onEdit={() => openEdit("localAddress")}>
                <FieldRow label="Address" value={student.localAddress} />
                <FieldRow label="Address1" value={student.localAddress1} />
                <FieldRow label="City" value={student.localCity} />
                <FieldRow label="State" value={student.localState} />
                <FieldRow label="Pin Code" value={student.localPin} />
              </ProfileSection>

              <ProfileSection title="Other Details" onEdit={() => openEdit("other")}>
                <FieldRow label="Last School Joined" value={student.lastSchool} />
                <FieldRow label="Last Class Joined" value={student.lastClass} />
                <FieldRow label="Height" value={student.height} />
                <FieldRow label="Weight" value={student.weight} />
                <FieldRow label="Blood Group" value={student.bloodGroup} />
                <FieldRow label="Religion" value={student.religion} />
                <FieldRow label="Community" value={student.community} />
                <FieldRow label="Caste" value={student.caste} />
              </ProfileSection>

              <ProfileSection title="Subjects" onEdit={() => openEdit("subjects")}>
                <div className="subject-chip-wrap">
                  {student.subjects.map((subject) => (
                    <span className="subject-chip" key={subject}>{subject}</span>
                  ))}
                </div>
              </ProfileSection>

              <div className="common-card profile-section-card">
                <h3>Sibling Details</h3>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>S.No</th>
                        <th>Sibling Name</th>
                        <th>Admission No</th>
                        <th>Class</th>
                        <th>Section</th>
                      </tr>
                    </thead>
                    <tbody>
                      {siblings.map((sib, index) => (
                        <tr key={sib.id}>
                          <td>{index + 1}</td>
                          <td>{sib.studentName}</td>
                          <td>{sib.admissionNo}</td>
                          <td>{sib.className}</td>
                          <td>{sib.sectionName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === "document" && (
            <DocumentTab
              student={student}
              documentTypes={documentTypes}
              updateStudent={updateStudent}
            />
          )}

          {activeTab === "attendance" && (
            <AttendanceTab rows={attendanceRows} total={attendanceTotal} />
          )}

          {activeTab === "result" && (
            <ResultTab rows={resultRows} />
          )}

          {activeTab === "message" && (
            <div className="common-card">
              <div className="empty-row">
                Message Log will be available after Bulk SMS module setup.
              </div>
            </div>
          )}
        </div>

        {editPopup && (
          <EditPopup
            type={editPopup}
            form={editForm}
            setForm={setEditForm}
            onClose={() => setEditPopup(null)}
            onUpdate={handleUpdate}
            options={{
              classOptions,
              sectionOptions,
              mediumOptions,
              feePlanOptions,
              concessionOptions,
              routeOptions,
              vehicleOptions,
              houseOptions,
              subjectOptions,
            }}
            student={student}
          />
        )}
      </div>
    </div>
  );
}

function ProfileSection({ title, onEdit, children }) {
  return (
    <div className="common-card profile-section-card">
      <div className="profile-section-head">
        <h3>{title}</h3>
        <button className="section-edit-btn" onClick={onEdit}>📝</button>
      </div>
      <div className="profile-field-grid">{children}</div>
    </div>
  );
}

function EditPopup({ type, form, setForm, onClose, onUpdate, options, student }) {
  const input = (label, name, inputType = "text") => (
    <div className="form-group">
      <label>{label}</label>
      <input
        type={inputType}
        value={form[name] || ""}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
      />
    </div>
  );

  const select = (label, name, items) => (
    <div className="form-group">
      <label>{label}</label>
      <select
        value={form[name] || ""}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
      >
        <option value="">{"< Select >"}</option>
        {items.map((item) => (
          <option key={item} value={item}>{item}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="popup-overlay nested-popup">
      <div className="student-edit-popup">
        <div className="popup-head">
          <h2>{getPopupTitle(type)}</h2>
          <button className="popup-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="student-edit-content">
          {type === "class" && (
            <>
              {select("Select Class", "className", options.classOptions)}
              {select("Select Fee Plan", "feePlan", options.feePlanOptions)}
              <div className="profile-note-card">
                Only students whose total fee paid amount is ₹0 can be moved to another class or assigned a different fee plan.
              </div>
            </>
          )}

          {type === "section" && select("Section", "sectionName", options.sectionOptions)}
          {type === "medium" && select("Medium", "medium", options.mediumOptions)}
          {type === "feePlan" && select("Change Fee Plan", "feePlan", options.feePlanOptions)}
          {type === "concessionPlan" && select("Concession Plan", "concessionPlan", options.concessionOptions)}
          {type === "vehicle" && select("Vehicle", "vehicleName", options.vehicleOptions)}
          {type === "house" && select("House", "house", options.houseOptions)}
          {type === "hostel" && input("Hostel Room No", "hostelRoomNo")}

          {type === "route" && (
            <TransportEdit form={form} setForm={setForm} routes={options.routeOptions} student={student} />
          )}

          {type === "primary" && (
            <>
              {input("Student Name", "studentName")}
              {input("Father Name", "fatherName")}
              {input("Mother Name", "motherName")}
              {input("Mobile", "mobile")}
              {input("Alt Mobile", "altMobile")}
              {input("Email", "email", "email")}
              {input("Aadhaar No", "aadhar")}
              {input("DOB", "dob", "date")}
            </>
          )}

          {type === "rl" && (
            <>
              {input("Student Name RL", "studentNameRL")}
              {input("Father Name RL", "fatherNameRL")}
              {input("Mother Name RL", "motherNameRL")}
            </>
          )}

          {type === "parent" && (
            <>
              {input("Father Occupation", "fatherOccupation")}
              {input("Father Education", "fatherEducation")}
              {input("Father Aadhaar", "fatherAadhar")}
              {input("Family Income", "familyIncome")}
              {input("Mother Occupation", "motherOccupation")}
              {input("Mother Education", "motherEducation")}
              {input("Mother Aadhaar", "motherAadhar")}
            </>
          )}

          {type === "permanentAddress" && (
            <>
              {input("Address", "permanentAddress")}
              {input("Address1", "permanentAddress1")}
              {input("City", "permanentCity")}
              {input("State", "permanentState")}
              {input("Pin Code", "permanentPin")}
            </>
          )}

          {type === "localAddress" && (
            <>
              {input("Address", "localAddress")}
              {input("Address1", "localAddress1")}
              {input("City", "localCity")}
              {input("State", "localState")}
              {input("Pin Code", "localPin")}
            </>
          )}

          {type === "other" && (
            <>
              {input("Last School Joined", "lastSchool")}
              {input("Last Class Joined", "lastClass")}
              {input("Height", "height")}
              {input("Weight", "weight")}
              {select("Blood Group", "bloodGroup", ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"])}
              {select("Religion", "religion", ["Hindu", "Muslim", "Sikh", "Christian", "Other"])}
              {select("Community", "community", ["General", "OBC", "SC", "ST", "Minority", "Other"])}
              {input("Caste", "caste")}
            </>
          )}

          {type === "subjects" && (
            <div className="subject-check-grid">
              {options.subjectOptions.map((subject) => (
                <label key={subject} className="subject-check-item">
                  <input
                    type="checkbox"
                    checked={(form.subjects || []).includes(subject)}
                    onChange={() => {
                      const prev = form.subjects || [];
                      setForm({
                        ...form,
                        subjects: prev.includes(subject)
                          ? prev.filter((item) => item !== subject)
                          : [...prev, subject],
                      });
                    }}
                  />
                  {subject}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="student-edit-actions">
          <AppButton type="primary" onClick={onUpdate}>Update</AppButton>
        </div>
      </div>
    </div>
  );
}

function TransportEdit({ form, setForm, routes, student }) {
  const months = ["APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC", "JAN", "FEB", "MAR"];
  const assigned = student.routeName && student.routeName !== "Not Assigned";
  const [activeMonths, setActiveMonths] = useState(months);

  return (
    <div className="transport-edit-box">
      <h3>Route : {assigned ? `${student.routeName} (Rs. 525 / Month)` : "Not Applicable"}</h3>

      {assigned && (
        <AppButton
          type="delete"
          onClick={() => {
            setForm({ ...form, routeName: "Not Assigned", vehicleName: "Not Assigned" });
          }}
        >
          Stop Transport
        </AppButton>
      )}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Apply</th>
              <th>Fee Schedule</th>
              <th>Fee</th>
              <th>Paid</th>
            </tr>
          </thead>
          <tbody>
            {months.map((month) => (
              <tr key={month}>
                <td>
                  <input
                    type="checkbox"
                    checked={activeMonths.includes(month)}
                    onChange={() => {
                      setActiveMonths((prev) =>
                        prev.includes(month)
                          ? prev.filter((item) => item !== month)
                          : [...prev, month]
                      );
                    }}
                  />
                </td>
                <td>{month} ({form.routeName || student.routeName || "-"})</td>
                <td>{activeMonths.includes(month) ? 525 : 0}</td>
                <td>0</td>
              </tr>
            ))}
            <tr className="total-row">
              <td colSpan="2">Total</td>
              <td>{activeMonths.length * 525}</td>
              <td>0</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="form-group">
        <label>Change Route</label>
        <select
          value={form.routeName || ""}
          onChange={(e) => setForm({ ...form, routeName: e.target.value })}
        >
          <option value="">Select Route</option>
          {routes.map((route) => (
            <option key={route} value={route}>{route}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function DocumentTab({ student, documentTypes, updateStudent }) {
  const [documentType, setDocumentType] = useState("");
  const [showMissingOnly, setShowMissingOnly] = useState(true);
  const [showUploadPopup, setShowUploadPopup] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const missingCount = documentTypes.length - student.uploadedDocuments.length;
  const uploadedCount = student.uploadedDocuments.length;

  const handleUpload = () => {
    if (!documentType) {
      alert("Select document type");
      return;
    }

    if (!selectedFile) {
      alert("Select file");
      return;
    }

    const alreadyUploaded = student.uploadedDocuments.includes(documentType);

    if (alreadyUploaded) {
      const ok = window.confirm("Document already uploaded. Do you want to replace it?");
      if (!ok) return;
    }

    updateStudent({
      uploadedDocuments: alreadyUploaded
        ? student.uploadedDocuments
        : [...student.uploadedDocuments, documentType],
    });

    setSelectedFile(null);
    setShowUploadPopup(false);
    alert("Document uploaded successfully");
  };

  return (
    <>
      <div className="common-card">
        <div className="filter-grid">
          <div className="form-group">
            <label>Document Type</label>
            <select value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
              <option value="">Select Document</option>
              {documentTypes.map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
        </div>

        <div className="document-bottom-row">
          <label className="missing-checkbox">
            <input
              type="checkbox"
              checked={showMissingOnly}
              onChange={(e) => setShowMissingOnly(e.target.checked)}
            />
            Show Missing Only
          </label>

          <AppButton type="primary" onClick={() => setShowUploadPopup(true)}>Upload</AppButton>
          <AppButton type="primary" onClick={() => alert("Document download started")}>Download</AppButton>
        </div>
      </div>

      <div className="common-card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Student Name</th>
                <th>Class</th>
                <th>Section</th>
                <th>Missing</th>
                <th>Uploaded</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>{student.studentName}</td>
                <td>{student.className}</td>
                <td>{student.sectionName}</td>
                <td>{missingCount}</td>
                <td>{uploadedCount}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {showUploadPopup && (
        <div className="popup-overlay nested-popup">
          <div className="student-edit-popup">
            <div className="popup-head">
              <h2>Upload Document</h2>
              <button className="popup-close-btn" onClick={() => setShowUploadPopup(false)}>×</button>
            </div>

            <div className="student-edit-content">
              <div className="form-group">
                <label>Choose File</label>
                <input type="file" accept="image/*,.pdf" onChange={(e) => setSelectedFile(e.target.files[0])} />
              </div>

              <div className="form-group">
                <label>Open Camera</label>
                <input type="file" accept="image/*" capture="environment" onChange={(e) => setSelectedFile(e.target.files[0])} />
              </div>

              {selectedFile && <p>Selected: {selectedFile.name}</p>}
            </div>

            <div className="student-edit-actions">
              <AppButton type="primary" onClick={handleUpload}>Upload</AppButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function AttendanceTab({ rows, total }) {
  return (
    <div className="common-card">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Month</th>
              <th>Present</th>
              <th>Absent</th>
              <th>Leave</th>
              <th>Total Days</th>
              <th>(%) Presence</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const totalDays = row.present + row.absent + row.leave;
              const percent = totalDays ? ((row.present / totalDays) * 100).toFixed(2) : "";

              return (
                <tr key={row.month}>
                  <td>{index + 1}</td>
                  <td>{row.month}</td>
                  <td>{row.present || ""}</td>
                  <td>{row.absent || ""}</td>
                  <td>{row.leave || ""}</td>
                  <td>{totalDays || ""}</td>
                  <td>{percent ? `${percent}%` : ""}</td>
                </tr>
              );
            })}

            <tr className="total-row">
              <td colSpan="2">Total</td>
              <td>{total.present}</td>
              <td>{total.absent}</td>
              <td>{total.leave}</td>
              <td>{total.totalDays}</td>
              <td>{total.percent}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ResultTab({ rows }) {
  return (
    <div className="common-card">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Subject</th>
              <th>UT-1</th>
              <th>UT-2</th>
              <th>Half Yearly</th>
              <th>UT-3</th>
              <th>Annual</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.subject}>
                <td>{row.subject}</td>
                <td>{row.ut1}</td>
                <td>{row.ut2}</td>
                <td>{row.halfYearly}</td>
                <td>{row.ut3}</td>
                <td>{row.annual}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="profile-print-row">
        <AppButton type="primary" onClick={() => window.print()}>
          Print Result
        </AppButton>
      </div>
    </div>
  );
}

function getPopupTitle(type) {
  const titles = {
    class: "Modify Class",
    section: "Modify Section",
    medium: "Modify Medium",
    feePlan: "Modify Fee Plan",
    concessionPlan: "Modify Concession Plan",
    route: "Transport Fee",
    vehicle: "Modify Vehicle",
    house: "Modify House",
    hostel: "Modify Hostel Room No",
    primary: "Modify Primary Details",
    rl: "Modify Hindi/RL Details",
    parent: "Modify Parent Details",
    permanentAddress: "Modify Permanent Address",
    localAddress: "Modify Local Address",
    other: "Modify Secondary Details",
    subjects: "Modify Subjects",
  };

  return titles[type] || "Modify Details";
}

export default StudentProfileView;