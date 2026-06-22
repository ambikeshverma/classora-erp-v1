import React from "react";

function ReportHeader({
  schoolInfo = {},
  title = "",
}) {
  const contactItems = [
    schoolInfo.email
      ? `Email: ${schoolInfo.email}`
      : "",

    schoolInfo.website
      ? `Website: ${schoolInfo.website}`
      : "",

    schoolInfo.phone
      ? `Phone: ${schoolInfo.phone}`
      : "",
  ].filter(Boolean);

  return (
    <div className="report-header">
      <div className="report-logo-box">
        {schoolInfo.logo ? (
          <img
            src={schoolInfo.logo}
            alt="School Logo"
          />
        ) : (
          <span>Logo</span>
        )}
      </div>

      <div className="report-school-info">
        <h2>
          {schoolInfo.schoolName ||
            "School Name"}
        </h2>

        <p>
          {schoolInfo.address ||
            "School Address"}
        </p>

        <p>
          {contactItems.join(" | ")}
        </p>
      </div>

      <h1>{title}</h1>
    </div>
  );
}

export default ReportHeader;