import React, { useMemo, useState } from "react";
import "./MasterReport.css";
import AppButton from "../AppButton";
import ColumnSetupPopup from "./ColumnSetupPopup";
import ExportPopup from "./ExportPopup";
import ReportHeader from "./ReportHeader";
import ReportFooter from "./ReportFooter";
import ReportTable from "./ReportTable";
import { exportPDF, exportExcel } from "./reportExportUtils";
import StudentPhotoCardReport from "./StudentPhotoCardReport";

function MasterReport({
  moduleTitle = "Analytics & Reports",
  reports = [],
  schoolProfiles = [],
  currentUser = {},
}) {
  const schoolId = localStorage.getItem("schoolId") || "SCH001";

  const schoolInfo =
    schoolProfiles.find((school) => school.schoolId === schoolId) || {};

  const [selectedReport, setSelectedReport] = useState(null);
  const [filterData, setFilterData] = useState({});
  const [appliedFilters, setAppliedFilters] = useState({});
  const [viewClicked, setViewClicked] = useState(false);

  const [showColumnPopup, setShowColumnPopup] = useState(false);
  const [showExportPopup, setShowExportPopup] = useState(false);

  const [selectedColumns, setSelectedColumns] = useState([]);

  const printedBy =
    currentUser?.name || localStorage.getItem("userName") || "User";

  const availableReports = reports.filter(
    (report) => !report.schoolId || report.schoolId === schoolId
  );

  const activeReport = selectedReport;
  const allColumns = activeReport?.columns || [];

  const reportData = useMemo(() => {
    if (!activeReport) return [];

    if (typeof activeReport.getData === "function") {
      return activeReport.getData({
        schoolId,
        filters: appliedFilters,
      });
    }

    return activeReport.data || [];
  }, [activeReport, appliedFilters, schoolId]);

  const filteredData = reportData.filter(
    (item) => !item.schoolId || item.schoolId === schoolId
  );

  const handleReportClick = (report) => {
    setSelectedReport(report);
    setFilterData(report.defaultFilters || {});
    setAppliedFilters(report.defaultFilters || {});
    setSelectedColumns(report.defaultColumns || report.columns || []);
    setViewClicked(false);
  };

  const handleView = () => {
    if (!activeReport) return;

    if (selectedColumns.length === 0) {
      alert("At least one column is required in the report.");
      return;
    }

    setAppliedFilters(filterData);
    setViewClicked(true);
  };

  const handlePrint = () => {
    if (!viewClicked || filteredData.length === 0) {
      alert("No records found to print.");
      return;
    }

    exportPDF({
      schoolInfo,
      title: activeReport?.title || "Report",
      columns: selectedColumns,
      data: filteredData,
      userName: printedBy,
      mode: "print",
    });
  };

  const handleExport = (type) => {
    if (!viewClicked || filteredData.length === 0) {
      alert("No records found to export.");
      return;
    }

    const reportName = activeReport?.title || "Report";

    if (type === "pdf") {
      exportPDF({
        schoolInfo,
        title: reportName,
        columns: selectedColumns,
        data: filteredData,
        userName: printedBy,
        mode: "export",
      });
    }

    if (type === "excel") {
      exportExcel({
        schoolInfo,
        title: reportName,
        columns: selectedColumns,
        data: filteredData,
        userName: printedBy,
      });
    }

    setShowExportPopup(false);
  };

  if (!selectedReport) {
    return (
      <div className="master-report-page">
        <div className="common-page-header">
          <AppButton
            type="back"
            onClick={() => {
              window.history.back();
            }}
          >
            ←
          </AppButton>

          <div>
            <h1>{moduleTitle}</h1>
            <p>Select a report to view, print or export</p>
          </div>
        </div>

        <div className="common-card">
          <h2>Reports List</h2>

          <div className="report-list-grid">
            {availableReports.map((report) => (
              <button
                type="button"
                className="report-list-item"
                key={report.id}
                onClick={() => handleReportClick(report)}
              >
                <span>{report.icon || "📄"}</span>

                <div>
                  <strong>{report.title}</strong>
                  <p>{report.description}</p>
                </div>

                <b>›</b>
              </button>
            ))}
          </div>

          {availableReports.length === 0 && (
            <div className="no-record-box">No reports found</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="master-report-page">
      <div className="common-page-header">
        <AppButton
          type="back"
          onClick={() => {
            setSelectedReport(null);
            setViewClicked(false);
          }}
        >
          ←
        </AppButton>

        <div>
          <h1>{activeReport.title}</h1>
          <p>{activeReport.description}</p>
        </div>
      </div>

      <div className="common-card">
        <h2>Filters</h2>

        <div className="report-filter-grid">
          {(activeReport.filters || []).map((filter) => (
            <div className="form-group" key={filter.name}>
              {filter.type !== "checkbox" && (
  <label>{filter.label}</label>
)}

             {filter.type === "select" ? (
  <select
    value={filterData[filter.name] || ""}
    onChange={(e) =>
      setFilterData({
        ...filterData,
        [filter.name]: e.target.value,
      })
    }
  >
    {filter.showAllOption !== false && (
      <option value="">
        {filter.placeholder || "All"}
      </option>
    )}

    {(filter.options || []).map((option) => (
      <option
        key={option.value || option}
        value={option.value || option}
      >
        {option.label || option}
      </option>
    ))}
  </select>
) : filter.type === "checkbox" ? (
  <label className="report-checkbox-filter">
    <input
      type="checkbox"
      checked={Boolean(filterData[filter.name])}
      onChange={(e) =>
        setFilterData({
          ...filterData,
          [filter.name]: e.target.checked,
        })
      }
    />
    {filter.checkboxLabel || filter.label}
  </label>
) : (
  <input
    type={filter.type || "text"}
    placeholder={filter.placeholder || ""}
    value={filterData[filter.name] || ""}
    onChange={(e) =>
      setFilterData({
        ...filterData,
        [filter.name]: e.target.value,
      })
    }
  />
)}
            </div>
          ))}
        </div>

        <div className="report-action-row">
          {activeReport.viewType !== "card" && (
  <AppButton
    type="secondary"
    onClick={() => setShowColumnPopup(true)}
  >
    ☰
  </AppButton>
)}

          <AppButton type="primary" onClick={handleView}>
            View
          </AppButton>

          <AppButton type="primary" onClick={handlePrint}>
            Print
          </AppButton>

          <AppButton type="primary" onClick={() => setShowExportPopup(true)}>
            Export
          </AppButton>
        </div>
      </div>

      {viewClicked && (
        <div id="report-print-area" className="report-print-area">
          <ReportHeader schoolInfo={schoolInfo} title={activeReport.title} />

          {activeReport.viewType === "card" ? (
  <StudentPhotoCardReport data={filteredData} />
) : (
  <ReportTable columns={selectedColumns} data={filteredData} />
)}

          <ReportFooter
            mode="print"
            userName={printedBy}
            dateTime={new Date().toLocaleString("en-IN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}
          />
        </div>
      )}

      {showColumnPopup &&
 activeReport.viewType !== "card" && (
  <ColumnSetupPopup
    allColumns={allColumns}
    selectedColumns={selectedColumns}
    setSelectedColumns={setSelectedColumns}
    onClose={() => setShowColumnPopup(false)}
  />
)}

      {showExportPopup && (
        <ExportPopup
          onClose={() => setShowExportPopup(false)}
          onExport={handleExport}
        />
      )}
    </div>
  );
}

export default MasterReport;