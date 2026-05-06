import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const exportToExcel = async ({ title, columns, data, schoolProfile }) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Report");

  const totalColumns = columns.length;
  const lastCol = String.fromCharCode(64 + totalColumns);

  // SCHOOL HEADER
  sheet.mergeCells(`A1:${lastCol}1`);
  sheet.getCell("A1").value = schoolProfile.name;
  sheet.getCell("A1").alignment = { horizontal: "center" };
  sheet.getCell("A1").font = { bold: true, size: 14 };

  sheet.mergeCells(`A2:${lastCol}2`);
  sheet.getCell("A2").value = schoolProfile.address;
  sheet.getCell("A2").alignment = { horizontal: "center" };

  sheet.mergeCells(`A3:${lastCol}3`);
  sheet.getCell("A3").value = "Contact: " + schoolProfile.contact;
  sheet.getCell("A3").alignment = { horizontal: "center" };

  // TITLE
  sheet.mergeCells(`A5:${lastCol}5`);
  sheet.getCell("A5").value = title;
  sheet.getCell("A5").alignment = { horizontal: "center" };
  sheet.getCell("A5").font = { bold: true, size: 13 };

  // TABLE HEADER
  const headerRow = sheet.addRow(columns);

  headerRow.eachCell((cell) => {
    cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF0070C0" }
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" }
    };
  });

  // DATA ROWS
  data.forEach((rowData) => {
    const row = sheet.addRow(rowData);

    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      };
      cell.alignment = { vertical: "middle" };
    });
  });
// PRINT SETTINGS
sheet.pageSetup = {
  paperSize: 9, // A4
  orientation: 'landscape',
  fitToPage: true,
  fitToWidth: 1,
  fitToHeight: 0,
};
  // COLUMN WIDTH
  sheet.columns = columns.map((col, index) => {
    if (index === 0) return { width: 10 };
    if (index === 1) return { width: 22 };
    return { width: 45 };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), `${title}.xlsx`);
};