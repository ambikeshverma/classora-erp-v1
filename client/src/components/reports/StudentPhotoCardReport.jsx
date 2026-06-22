import React from "react";
import "./StudentPhotoCardReport.css";

function StudentPhotoCardReport({ data = [] }) {
  if (!data || data.length === 0) {
    return <div className="no-record-box">No Records Found</div>;
  }

  const showValue = (value) => value || "--";

  return (
    <div className="student-photo-card-report">
      {data.map((student, index) => (
        <div className="student-profile-card" key={student.id || index}>
          <div className="student-photo-box">
            {student.photo ? (
              <img src={student.photo} alt={student.studentName} />
            ) : (
              <div className="no-photo">Photo</div>
            )}
          </div>

          <div className="student-card-columns">
            <div className="student-card-column">
              <h4>Student Details</h4>

              <p><strong>Student Name:</strong> {showValue(student.studentName)}</p>
              <p><strong>Father Name:</strong> {showValue(student.fatherName)}</p>
              <p><strong>Mother Name:</strong> {showValue(student.motherName)}</p>
              <p><strong>DOB:</strong> {showValue(student.dob)}</p>
              <p><strong>Gender:</strong> {showValue(student.gender)}</p>
              <p><strong>Religion:</strong> {showValue(student.religion)}</p>
              <p><strong>Community:</strong> {showValue(student.community)}</p>
              <p><strong>Caste:</strong> {showValue(student.caste)}</p>
              <p><strong>Blood Group:</strong> {showValue(student.bloodGroup)}</p>
              <p><strong>Height (CM):</strong> {showValue(student.heightCm)}</p>
              <p><strong>Weight (KG):</strong> {showValue(student.weightKg)}</p>
            </div>

            <div className="student-card-column">
              <h4>Academic Details</h4>

              <p><strong>School Admission No:</strong> {showValue(student.schoolAdmissionNo)}</p>
              <p><strong>SR No:</strong> {showValue(student.srNo)}</p>
              <p><strong>Roll No:</strong> {showValue(student.rollNo)}</p>
              <p><strong>Class & Section:</strong> {showValue(student.classSection)}</p>
              <p><strong>Medium:</strong> {showValue(student.medium)}</p>
              <p><strong>Admission Date:</strong> {showValue(student.admissionDate)}</p>
              <p><strong>UDISE PEN No:</strong> {showValue(student.udisePenNo)}</p>
              <p><strong>APAAR ID:</strong> {showValue(student.apaarId)}</p>
              <p><strong>Hostel/Room No:</strong> {showValue(student.hostelRoomNo)}</p>
            </div>

            <div className="student-card-column">
              <h4>Contact & Address</h4>

              <p><strong>Mobile Number:</strong> {showValue(student.mobileNumber)}</p>
              <p><strong>Alternate Mobile:</strong> {showValue(student.alternateMobileNumber)}</p>
              <p><strong>Local Address:</strong> {showValue(student.localAddress)}</p>
              <p><strong>Permanent Address:</strong> {showValue(student.permanentAddress)}</p>

              <h4>Subjects</h4>
              <p>{showValue(student.assignedSubjects)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default StudentPhotoCardReport;