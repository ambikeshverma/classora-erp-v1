import React, { useEffect, useState } from "react";
import "./newAdmission.css";
import AppButton from "../components/AppButton";
import { admissionService } from "../services/api";

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

const defaultClassOptions = [
  "Nursery", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
  "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
  "Class 11", "Class 12"
];

const defaultSectionOptions = ["A", "B", "C", "Hindi Medium", "English Medium"];

const defaultMediumOptions = ["Hindi Medium", "English Medium"];

const defaultFeePlans = [
  { id: 1, className: "Class 6", planName: "6HM", medium: "Hindi Medium", totalFee: 18500 },
  { id: 2, className: "Class 6", planName: "6EM", medium: "English Medium", totalFee: 22500 },
  { id: 3, className: "Class 7", planName: "7HM", medium: "Hindi Medium", totalFee: 19500 },
  { id: 4, className: "Class 7", planName: "7EM", medium: "English Medium", totalFee: 23500 },
];

const defaultSiblingGroups = [
  "No Siblings",
  "Rahul Kumar Group",
  "Priya Singh Group",
  "Aman Verma Group",
];

const defaultConcessionPlans = [
  "No Concession Plan",
  "Staff Child",
  "Sibling Concession",
  "Scholarship",
];

const routeOptions = [
  "Not Assigned",
  "Rasauli Route",
  "Lucknow Route",
  "Madaran Route",
];

const vehicleOptions = [
  "Not Assigned",
  "UP32AB1234 - Bus 1",
  "UP41CD5678 - Van 1",
];

const houseOptions = [
  "Not Assigned",
  "Red House",
  "Blue House",
  "Green House",
  "Yellow House",
];

const classSubjectMappings = {
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
  const currentSession =
    localStorage.getItem("currentSession") || "2026-2027";

  const [classOptions, setClassOptions] = useState(defaultClassOptions);
  const [classSections, setClassSections] = useState({});
  const [feePlans, setFeePlans] = useState(defaultFeePlans);
  const [concessionPlans, setConcessionPlans] = useState(defaultConcessionPlans);
  const [siblingGroups, setSiblingGroups] = useState(defaultSiblingGroups);
  const [mediumOptions, setMediumOptions] = useState(defaultMediumOptions);
  const [allSubjects, setAllSubjects] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    admissionService
      .getMeta()
      .then((res) => {
        if (res.data?.data) {
          const { classes, feePlans: fps, concessions, siblingGroups: sgs, mediums: meds, subjects: subs } = res.data.data;
          if (classes && classes.length > 0) {
            setClassOptions(classes.map((c) => c.className));
            const secMap = {};
            classes.forEach((c) => {
              if (c.sections && c.sections.length > 0) {
                secMap[c.className] = c.sections;
              }
            });
            setClassSections(secMap);
          }
          if (fps && fps.length > 0) {
            setFeePlans(fps.map((f) => ({
              id: f._id,
              className: f.className,
              planName: f.feePlanName,
              totalFee: f.newTotal || f.oldTotal || 0,
            })));
          }
          if (concessions && concessions.length > 0) {
            setConcessionPlans(["No Concession Plan", ...concessions.map((c) => c.concessionName)]);
          }
          if (sgs && sgs.length > 0) {
            setSiblingGroups(["No Siblings", ...sgs.map((s) => s.groupName)]);
          }
          if (meds && meds.length > 0) {
            setMediumOptions(meds.map((m) => m.mediumName));
          }
          if (subs && subs.length > 0) {
            setAllSubjects(subs.map((s) => s.subjectName));
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load admissions meta:", err);
      });
  }, []);

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
  const [studentImagePreview, setStudentImagePreview] = useState("");

  const subjects =
    allSubjects.length > 0
      ? allSubjects
      : classSubjectMappings[form.className] || [];

  const sectionOptions =
    form.className && classSections[form.className] && classSections[form.className].length > 0
      ? classSections[form.className]
      : defaultSectionOptions;

  const availableFeePlans = feePlans.filter(
    (item) => item.className === form.className
  );

  const selectedFeePlan = feePlans.find(
    (item) => item.planName === form.feePlan
  );

  useEffect(() => {
    if (mediumOptions.length === 1 && !form.medium) {
      setForm((prev) => ({
        ...prev,
        medium: mediumOptions[0],
      }));
    }
  }, [form.medium, mediumOptions]);

  useEffect(() => {
    if (availableFeePlans.length === 1) {
      setForm((prev) => ({
        ...prev,
        feePlan: availableFeePlans[0].planName,
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.className, feePlans]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));

    if (name === "className") {
      setSelectedSubjects([]);
      setForm((prev) => ({
        ...prev,
        className: value,
        feePlan: "",
      }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setStudentImagePreview(URL.createObjectURL(file));
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
        subjects: selectedSubjects,
        totalFee: selectedFeePlan?.totalFee || 0
      };

      setSubmitting(true);
      const res = await admissionService.createAdmission(finalData);

      alert(res.data.msg || "Admission saved successfully ✅");
      window.location.href = "/admissions";
    } catch (err) {
      alert(err.response?.data?.msg || err.response?.data?.message || "Admission save failed ❌");
    } finally {
      setSubmitting(false);
    }
  };
  const field = (
    label,
    name,
    type = "text",
    required = false,
    placeholder = ""
  ) => (
    <div className="form-group" key={name}>
      <label>
        {label} {required && <span>*</span>}
      </label>

      <input
        type={type}
        name={name}
        value={form[name]}
        placeholder={placeholder || label}
        onChange={handleChange}
      />
    </div>
  );

  const select = (
  label,
  name,
  options,
  required = false
) => (
  <div className="form-group" key={name}>
    <label>
      {label} {required && <span>*</span>}
    </label>

    <select
      name={name}
      value={form[name]}
      onChange={handleChange}
    >
      <option value="">
        {"< Select >"}
      </option>

      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);

  return (
    <div className="admission-form-page">
      <div className="form-header">
        <button
          className="back-btn"
          onClick={() =>
            (window.location.href = "/admissions")
          }
        >
          ←
        </button>

        <div>
          <h1>+ New Student Admission</h1>
          <p>
            Complete student admission with class-wise subject selection
          </p>
        </div>

        {selectedFeePlan && (
          <div className="total-fee-note">
            Total Fee: ₹{selectedFeePlan.totalFee}
          </div>
        )}

        <div className="session-badge">
          {currentSession}
        </div>
      </div>

      <section className="form-section">
        <h2>Student Details</h2>

        <div className="form-grid">
          {select("Class Name", "className", classOptions, true)}

          {select(
            "Fee Plan",
            "feePlan",
            availableFeePlans.map((item) => item.planName),
            true
          )}

          {select("Section", "section", sectionOptions, true)}

          {field("Admission Date", "admissionDate", "date", true)}

          {select("Gender", "gender", ["Male", "Female", "Transgender"], true)}

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

            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageChange}
            />

            {studentImagePreview && (
              <div className="student-image-preview">
                <img src={studentImagePreview} alt="Student preview" />
              </div>
            )}
          </div>

          {field("Email", "email", "email")}

          {select("Medium", "medium", mediumOptions, true)}
        </div>
      </section>

      <section className="form-section">
        <h2>Office Details</h2>

        <div className="form-grid">
          {select("Sibling Group", "siblingGroup", siblingGroups)}

          {select("Concession Plan", "concessionPlan", concessionPlans)}

          {select("Route Name", "routeName", routeOptions)}

          {select("Vehicle Name", "vehicleName", vehicleOptions)}

          {field("UDISE PEN No", "udisePenNo")}

          {field("APAAR Id", "apaarId")}

          {field("School Admission No", "schoolAdmissionNo")}

          {field("Hostel/Room No", "hostelRoomNo")}

          {select("House", "house", houseOptions)}
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
          {field(
            "Address",
            "permanentAddress",
            "text",
            false,
            "House No / Flat No / Village"
          )}

          {field(
            "Address1",
            "permanentAddress1",
            "text",
            false,
            "Locality / Landmark / Post"
          )}

          {field("City", "permanentCity")}

          {select("State", "permanentState", statesOfIndia)}

          {field("Pin Code", "permanentPin")}
        </div>
      </section>

      <section className="form-section">
        <div className="section-title-line">
          <h2>Local Address</h2>

          <label className="same-check">
            <input
              type="checkbox"
              checked={sameAddress}
              onChange={handleSameAddress}
            />
            Same as Permanent
          </label>
        </div>

        <div className="form-grid">
          {field(
            "Address",
            "localAddress",
            "text",
            false,
            "House No / Flat No / Village"
          )}

          {field(
            "Address1",
            "localAddress1",
            "text",
            false,
            "Locality / Landmark / Post"
          )}

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

          {select("Blood Group", "bloodGroup", [
            "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-",
          ])}

          {select("Religion", "religion", [
            "Hindu", "Muslim", "Sikh", "Christian", "Other",
          ])}

          {select("Community", "community", [
            "General", "OBC", "SC", "ST", "Minority", "Other",
          ])}

          {field("Caste", "caste")}
        </div>
      </section>

      <section className="form-section">
        <h2>Subjects</h2>

        {!form.className ? (
          <p className="subject-note">
            Please select class first to load subjects.
          </p>
        ) : (
          <>
            <label className="select-all">
              <input
                type="checkbox"
                checked={
                  subjects.length > 0 &&
                  selectedSubjects.length === subjects.length
                }
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
        <AppButton type="primary" onClick={handleSave} disabled={submitting}>
          {submitting ? "Saving..." : "Save"}
        </AppButton>

        <AppButton
          type="secondary"
          onClick={() => (window.location.href = "/admissions")}
        >
          Go Back
        </AppButton>
      </div>
    </div>
  );
}

export default NewAdmission;