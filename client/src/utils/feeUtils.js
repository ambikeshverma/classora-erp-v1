export const formatMoney = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

// yyyy-mm-dd -> dd-mm-yyyy
export const formatDate = (iso) => {
  if (!iso) return "-";
  const [year, month, day] = String(iso).slice(0, 10).split("-");
  return year && month && day ? `${day}-${month}-${year}` : iso;
};

export const todayISO = () => new Date().toISOString().split("T")[0];

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

const belowThousand = (n) => {
  const parts = [];
  if (n >= 100) {
    parts.push(`${ONES[Math.floor(n / 100)]} Hundred`);
    n %= 100;
  }
  if (n >= 20) {
    parts.push(TENS[Math.floor(n / 10)]);
    n %= 10;
  }
  if (n > 0) parts.push(ONES[n]);
  return parts.join(" ");
};

const wholeNumberInWords = (n) => {
  if (n === 0) return "Zero";

  const units = [
    [10000000, "Crore"],
    [100000, "Lakh"],
    [1000, "Thousand"],
  ];

  const parts = [];
  units.forEach(([size, label]) => {
    if (n >= size) {
      parts.push(`${belowThousand(Math.floor(n / size))} ${label}`);
      n %= size;
    }
  });
  if (n > 0) parts.push(belowThousand(n));

  return parts.join(" ");
};

export const amountInWords = (amount) => {
  const value = Math.round(Number(amount || 0) * 100) / 100;
  const rupees = Math.floor(value);
  const paise = Math.round((value - rupees) * 100);

  let words = `${wholeNumberInWords(rupees)} Rupees`;
  if (paise > 0) words += ` and ${wholeNumberInWords(paise)} Paise`;
  return `${words} Only`;
};

// Converts a saved receipt (API shape) into the props expected by FeeReceiptPrint
export const buildReceiptPrintData = (receipt) => {
  if (!receipt) return null;

  const rows = receipt.rows || [];
  const sum = (key) => rows.reduce((total, row) => total + Number(row[key] || 0), 0);

  return {
    receiptNo: receipt.receiptNo,
    receiptDate: formatDate(receipt.depositDate),
    printDateTime: new Date().toLocaleString("en-IN"),
    feePeriod: (receipt.periods || []).join(", "),
    paymentMode: receipt.paymentMode,
    paymentRef: receipt.paymentRef,
    remarks: receipt.remarks,
    totalFee: sum("fee"),
    totalConcession: sum("concession"),
    totalPrepaid: sum("prepaid"),
    totalPaid: receipt.paidAmount,
    totalBalance: sum("balance"),
    amountInWords: amountInWords(receipt.paidAmount),
    collectedByName: receipt.collectedByName,
    rows: rows.map((row) => ({
      headName: `${row.feeHeadName} (${row.periodShort || row.periodKey})`,
      fee: row.fee,
      concession: row.concession,
      prepaid: row.prepaid,
      paid: row.paid,
      balance: row.balance,
    })),
  };
};
