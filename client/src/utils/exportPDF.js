import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const exportToPDF = ({ title, columns, data, schoolProfile }) => {
  const doc = new jsPDF();

  // HEADER (ONLY FIRST PAGE)
  doc.setFontSize(14);
  doc.text(schoolProfile.name, 105, 10, null, null, "center");

  doc.setFontSize(10);
  doc.text(schoolProfile.address, 105, 16, null, null, "center");
  doc.text("Contact: " + schoolProfile.contact, 105, 22, null, null, "center");

  doc.setFontSize(12);
  doc.text(title, 105, 30, null, null, "center");

  autoTable(doc, {
    head: [columns],
    body: data,
    startY: 40,
    didDrawPage: function (dataArg) {
      const pageCount = doc.internal.getNumberOfPages();

      // FOOTER (हर page पर)
      doc.setFontSize(8);
      doc.text(
        new Date().toLocaleString(),
        200,
        287,
        null,
        null,
        "right"
      );

      doc.text(
        `Page ${dataArg.pageNumber} of ${pageCount}`,
        10,
        287
      );
    }
  });

  doc.save(`${title}.pdf`);
};