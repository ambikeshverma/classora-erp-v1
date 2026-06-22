import React from "react";

function ReportFooter({
  mode = "print",
  userName = "User",
  dateTime = "",
}) {
  const byText =
    mode === "export"
      ? "Exported By"
      : "Printed By";

  const onText =
    mode === "export"
      ? "Exported On"
      : "Printed On";

  return (
    <div className="report-footer">
      <span>Page No: 1</span>

      <span>
        {byText}: {userName} | {onText}: {dateTime}
      </span>
    </div>
  );
}

export default ReportFooter;