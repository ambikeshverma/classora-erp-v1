import jsPDF from "jspdf";
import * as XLSX from "xlsx";

const getPageSize = (orientation = "portrait") => {
  if (orientation === "landscape") {
    return {
      width: 297,
      height: 210,
    };
  }

  return {
    width: 210,
    height: 297,
  };
};

const margin = {
  left: 10,
  right: 10,
  top: 10,
  bottom: 16,
};

const getCellValue = (row, column, rowIndex) => {
  if (column.render) return column.render(row, rowIndex);
  return row[column.key] || "--";
};

const drawFooter = ({ pdf, pageNo, footerText, pageSize }) => {
  const y = pageSize.height - 8;

  pdf.setFontSize(8);
  pdf.setTextColor(30, 30, 30);

  pdf.line(
    margin.left,
    y - 5,
    pageSize.width - margin.right,
    y - 5
  );

  pdf.text(`Page No: ${pageNo}`, margin.left, y);

  pdf.text(
    footerText,
    pageSize.width - margin.right,
    y,
    { align: "right" }
  );
};

const drawHeader = ({ pdf, schoolInfo, title, pageSize }) => {
  const startY = margin.top;

  pdf.setDrawColor(30, 30, 30);
  pdf.rect(
    margin.left,
    startY,
    pageSize.width - margin.left - margin.right,
    38
  );

  pdf.circle(margin.left + 17, startY + 18, 10);

  pdf.setFontSize(7);
  pdf.text("Logo", margin.left + 17, startY + 20, {
    align: "center",
  });

  pdf.setFontSize(14);
  pdf.setFont(undefined, "bold");
  pdf.text(
    schoolInfo.schoolName || "School Name",
    pageSize.width / 2,
    startY + 11,
    { align: "center" }
  );

  pdf.setFont(undefined, "normal");
  pdf.setFontSize(9);
  pdf.text(
    schoolInfo.address || "School Address",
    pageSize.width / 2,
    startY + 18,
    { align: "center" }
  );

  const contact = [
    schoolInfo.email ? `Email: ${schoolInfo.email}` : "",
    schoolInfo.website ? `Website: ${schoolInfo.website}` : "",
    schoolInfo.phone ? `Phone: ${schoolInfo.phone}` : "",
  ]
    .filter(Boolean)
    .join(" | ");

  pdf.setFontSize(8);
  pdf.text(contact, pageSize.width / 2, startY + 25, {
    align: "center",
  });

  pdf.line(
    margin.left,
    startY + 30,
    pageSize.width - margin.right,
    startY + 30
  );

  pdf.setFont(undefined, "bold");
  pdf.setFontSize(11);
  pdf.text(title || "REPORT", pageSize.width / 2, startY + 35, {
    align: "center",
  });
};

export const exportPDF = ({
  schoolInfo = {},
  title = "Report",
  columns = [],
  data = [],
  userName = "User",
  mode = "export",
  orientation = "portrait",
}) => {
  const pdf = new jsPDF({
    orientation,
    unit: "mm",
    format: "a4",
  });

  const pageSize = getPageSize(orientation);

  const now = new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const footerText =
    mode === "print"
      ? `Printed By: ${userName} | Printed On: ${now}`
      : `Exported By: ${userName} | Exported On: ${now}`;

  let pageNo = 1;
  let y = 54;

  drawHeader({ pdf, schoolInfo, title, pageSize });

  const availableWidth =
    pageSize.width - margin.left - margin.right;

  const colWidth = availableWidth / columns.length;
  const rowHeight = 8;

  const drawTableHeader = () => {
    pdf.setFontSize(7);
    pdf.setFont(undefined, "bold");
    pdf.setFillColor(238, 242, 255);

    columns.forEach((col, index) => {
      const x = margin.left + index * colWidth;

      pdf.rect(x, y, colWidth, rowHeight, "FD");
      pdf.text(String(col.label), x + colWidth / 2, y + 5, {
        align: "center",
        maxWidth: colWidth - 2,
      });
    });

    y += rowHeight;
  };

  const addNewPage = () => {
    drawFooter({ pdf, pageNo, footerText, pageSize });

    pdf.addPage();
    pageNo += 1;
    y = margin.top;

    drawTableHeader();
  };

  drawTableHeader();

  if (!data.length) {
    pdf.setFontSize(10);
    pdf.setFont(undefined, "bold");
    pdf.text("No Records Found", pageSize.width / 2, y + 15, {
      align: "center",
    });
  } else {
    data.forEach((row, rowIndex) => {
      if (y + rowHeight > pageSize.height - margin.bottom) {
        addNewPage();
      }

      pdf.setFontSize(6.5);
      pdf.setFont(undefined, "normal");

      columns.forEach((col, colIndex) => {
        const x = margin.left + colIndex * colWidth;
        const value = String(getCellValue(row, col, rowIndex));

        pdf.rect(x, y, colWidth, rowHeight);
        pdf.text(value, x + 1.5, y + 5, {
          maxWidth: colWidth - 3,
        });
      });

      y += rowHeight;
    });
  }

  drawFooter({ pdf, pageNo, footerText, pageSize });

  if (mode === "print") {
    pdf.autoPrint();
    window.open(pdf.output("bloburl"), "_blank");
    return;
  }

  pdf.save(`${title}.pdf`);
};

export const exportExcel = ({
  schoolInfo = {},
  title = "Report",
  columns = [],
  data = [],
  userName = "User",
}) => {
  const now = new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const contact = [
    schoolInfo.email ? `Email: ${schoolInfo.email}` : "",
    schoolInfo.website ? `Website: ${schoolInfo.website}` : "",
    schoolInfo.phone ? `Phone: ${schoolInfo.phone}` : "",
  ]
    .filter(Boolean)
    .join(" | ");

  const rows = [];

  rows.push([schoolInfo.schoolName || "School Name"]);
  rows.push([schoolInfo.address || "School Address"]);
  rows.push([contact]);
  rows.push([title]);
  rows.push([]);

  rows.push(columns.map((col) => col.label));

  if (data.length) {
    data.forEach((row, rowIndex) => {
      rows.push(
        columns.map((col) => getCellValue(row, col, rowIndex))
      );
    });
  } else {
    rows.push(["No Records Found"]);
  }

  rows.push([]);
  rows.push([
    "Page No: 1",
    `Exported By: ${userName} | Exported On: ${now}`,
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();

  const lastCol = Math.max(columns.length - 1, 1);

  worksheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: lastCol } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: lastCol } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: lastCol } },
  ];

  worksheet["!cols"] = columns.map(() => ({
    wch: 18,
  }));

  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

  XLSX.writeFile(workbook, `${title}.xlsx`);
};