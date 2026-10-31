import React, { useEffect, useState } from "react";
import "./FeeStudentProfile.css";
import { Skeleton } from "../Skeleton";
import { feeService } from "../../services/api";
import { formatDate } from "../../utils/feeUtils";

const isAssigned = (value) => value && value !== "Not Assigned" && value !== "No Concession Plan";

function FeeStudentProfile({ studentId, onClose }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    feeService
      .getStudentProfile(studentId)
      .then((res) => {
        if (active) setStudent(res.data?.data || null);
      })
      .catch((err) => {
        if (active) setError(err.response?.data?.message || "Failed to load student profile");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [studentId]);

  const address = student
    ? [student.permanentAddress, student.permanentCity, student.permanentState, student.permanentPin]
        .filter(Boolean)
        .join(", ")
    : "";

  const fields = student
    ? [
        ["Session", student.session],
        ["Class / Section", [student.className, student.section].filter(Boolean).join(" - ")],
        ["Medium", student.medium],
        ["Fee Plan", student.feePlan],
        ["Concession Plan", isAssigned(student.concessionPlan) ? student.concessionPlan : ""],
        ["Route", isAssigned(student.routeName) ? student.routeName : ""],
        ["Vehicle", isAssigned(student.vehicleName) ? student.vehicleName : ""],
        ["House", isAssigned(student.house) ? student.house : ""],
        ["Admission Date", formatDate(student.admissionDate)],
        ["SR No", student.srNo],
        ["Admission No", student.schoolAdmissionNo],
        ["Gender", student.gender],
        ["Date of Birth", formatDate(student.dob)],
        ["Father", student.fatherName],
        ["Mother", student.motherName],
        ["Mobile", student.mobile],
        ["Alt Mobile", student.altMobile],
        ["Email", student.email],
        ["Address", address],
      ]
    : [];

  return (
    <div className="fc-popup-overlay">
      <div className="fc-popup fee-profile-popup">
        <div className="fc-popup-head">
          <h2>Student Profile</h2>
          <button className="fc-popup-close" onClick={onClose}>
            ×
          </button>
        </div>

        {loading ? (
          <div className="fee-profile-body">
            <Skeleton variant="circular" width={84} height={84} />
            <div className="fee-profile-skeleton-lines">
              <Skeleton variant="text" count={6} height={16} />
            </div>
          </div>
        ) : error || !student ? (
          <div className="fc-empty-row fee-profile-empty">{error || "Student not found"}</div>
        ) : (
          <div className="fee-profile-content">
            <div className="fee-profile-top">
              <div className="fee-profile-photo">
                {student.studentImage ? <img src={student.studentImage} alt="Student" /> : <span>👤</span>}
              </div>

              <div>
                <h3>{student.studentName}</h3>
                <p>Status: {student.status || "-"}</p>
              </div>
            </div>

            <div className="fee-profile-grid">
              {fields.map(([label, value]) => (
                <div className="fee-profile-field" key={label}>
                  <span>{label}</span>
                  <strong>{value || "-"}</strong>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FeeStudentProfile;
