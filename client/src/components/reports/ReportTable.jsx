import React from "react";

function ReportTable({
  columns = [],
  data = [],
}) {
  if (!data || data.length === 0) {
    return (
      <div className="no-record-box">
        No Records Found
      </div>
    );
  }

  return (
    <div className="report-table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={row.id || rowIndex}>
              {columns.map((column) => (
                <td key={column.key}>
                  {column.render
                    ? column.render(row, rowIndex)
                    : row[column.key] || "--"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ReportTable;