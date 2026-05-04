import React, { useState } from "react";
import axios from "axios";
import "./newAdmission.css";

const statesOfIndia = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi",
  "Jammu & Kashmir", "Ladakh", "Puducherry", "Chandigarh",
  "Andaman and Nicobar Islands", "Dadra and Nagar Haveli and Daman and Diu",
  "Lakshadweep"
];

const classSubjects = {
  Nursery: ["English", "Hindi", "Math", "Drawing"],
  "Class 1": ["English", "Hindi", "Math", "EVS", "Computer"],
  "Class 2": ["English", "Hindi", "Math", "EVS", "Computer"],
  "Class 3": ["English", "Hindi", "Math", "Science", "SST", "Computer"],
  "Class 4": ["English", "Hindi", "Math", "Science", "SST", "Computer"],
  "Class 5": ["English", "Hindi", "Math", "Science", "SST", "Computer"],
  "Class 6": ["English", "Hindi", "Math", "Science", "SST", "Computer", "Sanskrit"],
  "Class 7": ["English", "Hindi", "Math", "Science", "SST", "Computer", "Sanskrit"],
  "Class 8": ["English", "Hindi", "Math", "Science", "SST", "Computer", "Sanskrit"],
  "Class 9": ["English", "Hindi", "Math", "Science", "SST"],
  "Class 10": ["English", "Hindi", "Math", "Science", "SST"],
  "Class 11": ["English", "Hindi", "Physics", "Chemistry", "Math", "Biology"],
  "Class 12": ["English", "Hindi", "Physics", "Chemistry", "Math", "Biology"]
};

function NewAdmission() {
  const currentSession = "2026-2027";

  const [form, setForm] = useState({
    className: "", feePlan: "", section: "", admissionDate: "", gender: "",
    studentName: "", fatherName: "", motherName: "", dob: "", mobile: "",
    altMobile: "", aadhar: "", srNo: "", email: "", medium: "",

    siblingGroup: "No Siblings", concessionPlan: "No Concession Plan",
    routeName: "Not Assigned", vehicleName: "Not Assigned",
    udisePenNo: "", apaarId: "", schoolAdmissionNo: "",
    hostelRoomNo: "", house: "Not Assigned",

    studentNameRL: "", fatherNameRL: "", motherNameRL: "",

    permanentAddress: "", permanentAddress1: "", permanentCity: "",
    permanentState: "", permanentPin: "",

    localAddress: "", localAddress1: "", localCity: "",
    localState: "", localPin: "",

    fatherOccupation: "", fatherEducation: "", fatherAadhar: "",
    familyIncome: "", motherOccupation: "", motherEducation: "",
    motherAadhar: "",

    lastSchool: "", lastClass: "", height: "", weight: "",
    bloodGroup: "", religion: "", community: "", caste: ""
  });

  const [sameAddress, setSameAddress] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState([]);

  const subjects = classSubjects[form.className] || [];

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));

    if (name === "className") {
      setSelectedSubjects([]);
    }
  };

  const handleSameAddress = (e) => {
    const checked = e.target.checked;
    setSameAddress(checked);

    if (checked) {
      setForm((prev) => ({
        ...prev,
        localAddress: prev.permanentAddress,
        localAddress1: prev.permanentAddress1,
        localCity: prev.permanentCity,
        localState: prev.permanentState,
        localPin: prev.permanentPin
      }));
    }
  };

  const toggleSubject = (subject) => {
    setSelectedSubjects((prev) =>
      prev.includes(subject)
        ? prev.filter((s) => s !== subject)
        : [...prev, subject]
    );
  };

  const toggleSelectAll = () => {
    if (selectedSubjects.length === subjects.length) {
      setSelectedSubjects([]);
    } else {
      setSelectedSubjects(subjects);
    }
  };

  const validateForm = () => {
    const requiredFields = [
      "className", "feePlan", "section", "admissionDate", "gender",
      "studentName", "fatherName", "motherName", "dob", "mobile", "medium"
    ];

    for (let field of requiredFields) {
      if (!form[field]) {
        alert("Please fill all mandatory fields marked with *");
        return false;
      }
    }

    if (selectedSubjects.length === 0) {
      alert("Please select at least one subject");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Login expired. Please login again.");
        window.location.href = "/";
        return;
      }

      const finalData = {
        ...form,
        session: currentSession,
        subjects: selectedSubjects
      };

      const res = await axios.post(
        "http://localhost:5000/api/admissions/add",
        finalData,
        {
          headers: {
            Authorization: token
          }
        }
      );

      alert(res.data.msg || "Admission saved successfully ✅");
      window.location.href = "/admission";
    } catch (err) {
      alert(err.response?.data?.msg || "Admission save failed ❌");
    }
  };

  const field = (label, name, type = "text", required = false, placeholder = "") => (
    <div className="form-group" key={name}>
      <label>{label} {required && <span>*</span>}</label>
      <input
        type={type}
        name={name}
        value={form[name]}
        placeholder={placeholder || label}
        onChange={handleChange}
      />
    </div>
  );

  const select = (label, name, options, required = false) => (
    <div className="form-group" key={name}>
      <label>{label} {required && <span>*</span>}</label>
      <select name={name} value={form[name]} onChange={handleChange}>
        <option value="">{"< Select >"}</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="admission-form-page">
      <div className="form-header">
        <button className="back-btn" onClick={() => window.location.href = "/admission"}>←</button>
        <div>
          <h1>+ New Student Admission</h1>
          <p>Complete student admission with class-wise subject selection</p>
        </div>
        <div className="session-badge">{currentSession}</div>
      </div>

      <section className="form-section">
        <h2>Student Details</h2>
        <div className="form-grid">
          {select("Class Name", "className", Object.keys(classSubjects), true)}
          {select("Fee Plan", "feePlan", ["Monthly", "Quarterly", "Half Yearly", "Yearly"], true)}
          {select("Section", "section", ["A", "B", "C", "Hindi Medium", "English Medium"], true)}
          {field("Admission Date", "admissionDate", "date", true)}
          {select("Gender", "gender", ["Male", "Female", "Other"], true)}
          {field("Student Name", "studentName", "text", true)}
          {field("Father Name", "fatherName", "text", true)}
          {field("Mother Name", "motherName", "text", true)}
          {field("DOB", "dob", "date", true)}
          {field("Mobile #", "mobile", "text", true)}
          {field("Alt. Mobile #", "altMobile")}
          {field("Aadhar #", "aadhar")}
          {field("SR No.", "srNo")}
          <div className="form-group" key="studentImage">
            <label>Student Image</label>
            <input type="file" />
          </div>
          {field("Email", "email", "email")}
          {select("Medium", "medium", ["Hindi Medium", "English Medium"], true)}
        </div>
      </section>

      <section className="form-section">
        <h2>Office Details</h2>
        <div className="form-grid">
          {select("Sibling Group", "siblingGroup", ["No Siblings", "Sibling Group 1", "Sibling Group 2"])}
          {select("Concession Plan", "concessionPlan", ["No Concession Plan", "Staff Child", "Scholarship", "Special Discount"])}
          {select("Route Name", "routeName", ["Not Assigned", "Route 1", "Route 2", "Route 3"])}
          {select("Vehicle Name", "vehicleName", ["Not Assigned", "Bus 1", "Bus 2", "Van 1"])}
          {field("UDISE PEN No", "udisePenNo")}
          {field("APAAR Id", "apaarId")}
          {field("School Admission No", "schoolAdmissionNo")}
          {field("Hostel/Room No", "hostelRoomNo")}
          {select("House", "house", ["Not Assigned", "Red House", "Blue House", "Green House", "Yellow House"])}
        </div>
      </section>

      <section className="form-section">
        <h2>Student Details (RL/Hindi)</h2>
        <div className="form-grid">
          {field("Student Name (RL/Hindi)", "studentNameRL")}
          {field("Father Name (RL/Hindi)", "fatherNameRL")}
          {field("Mother Name (RL/Hindi)", "motherNameRL")}
        </div>
      </section>

      <section className="form-section">
        <h2>Permanent Address</h2>
        <div className="form-grid">
          {field("Address", "permanentAddress", "text", false, "House No / Flat No / Village")}
          {field("Address1", "permanentAddress1", "text", false, "Locality / Landmark / Post")}
          {field("City", "permanentCity")}
          {select("State", "permanentState", statesOfIndia)}
          {field("Pin Code", "permanentPin")}
        </div>
      </section>

      <section className="form-section">
        <div className="section-title-line">
          <h2>Local Address</h2>
          <label className="same-check">
            <input type="checkbox" checked={sameAddress} onChange={handleSameAddress} />
            Same as Permanent
          </label>
        </div>
        <div className="form-grid">
          {field("Address", "localAddress", "text", false, "House No / Flat No / Village")}
          {field("Address1", "localAddress1", "text", false, "Locality / Landmark / Post")}
          {field("City", "localCity")}
          {select("State", "localState", statesOfIndia)}
          {field("Pin Code", "localPin")}
        </div>
      </section>

      <section className="form-section">
        <h2>Parents Details</h2>
        <div className="form-grid">
          {field("Father Occupation", "fatherOccupation")}
          {field("Father Education", "fatherEducation")}
          {field("Father Aadhar No", "fatherAadhar")}
          {field("Family Yearly Income (₹)", "familyIncome")}
          {field("Mother Occupation", "motherOccupation")}
          {field("Mother Education", "motherEducation")}
          {field("Mother Aadhar No", "motherAadhar")}
        </div>
      </section>

      <section className="form-section">
        <h2>Other Details</h2>
        <div className="form-grid">
          {field("Last School Joined", "lastSchool")}
          {field("Last Class Joined", "lastClass")}
          {field("Height (CM)", "height")}
          {field("Weight (KG)", "weight")}
          {select("Blood Group", "bloodGroup", ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"])}
          {select("Religion", "religion", ["Hindu", "Muslim", "Sikh", "Christian", "Other"])}
          {select("Community", "community", ["General", "OBC", "SC", "ST", "Other"])}
          {field("Caste", "caste")}
        </div>
      </section>

      <section className="form-section">
        <h2>Subjects</h2>
        {!form.className ? (
          <p className="subject-note">Please select class first to load subjects.</p>
        ) : (
          <>
            <label className="select-all">
              <input
                type="checkbox"
                checked={subjects.length > 0 && selectedSubjects.length === subjects.length}
                onChange={toggleSelectAll}
              />
              Select All
            </label>

            <div className="subject-grid">
              {subjects.map((subject) => (
                <label className="subject-item" key={subject}>
                  <input
                    type="checkbox"
                    checked={selectedSubjects.includes(subject)}
                    onChange={() => toggleSubject(subject)}
                  />
                  {subject}
                </label>
              ))}
            </div>
          </>
        )}
      </section>

      <div className="form-actions">
        <button className="save-btn" onClick={handleSave}>Save</button>
        <button className="back-action-btn" onClick={() => window.location.href = "/admission"}>
          Go Back
        </button>
      </div>
    </div>
  );
}

export default NewAdmission;