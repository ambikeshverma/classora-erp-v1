// Pure fee calculation helpers shared by Fee Collection, Receipts and Reports.
// Nothing here touches the database, so the same logic can run per student
// (collection screen) or across a whole school (reports).

const MONTHS = [
  ["April", "APR"],
  ["May", "MAY"],
  ["June", "JUN"],
  ["July", "JUL"],
  ["August", "AUG"],
  ["September", "SEP"],
  ["October", "OCT"],
  ["November", "NOV"],
  ["December", "DEC"],
  ["January", "JAN"],
  ["February", "FEB"],
  ["March", "MAR"],
];

const TRANSPORT_HEAD = "Transport Fee";

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Columns follow the same naming used by Fee Plan Management so that stored plan amounts map 1:1.
const getPeriods = (schemeType = "Monthly", installmentCount = 3) => {
  if (schemeType === "Monthly") {
    return MONTHS.map(([name, short]) => ({ key: name, short, column: short }));
  }

  let labels;
  if (schemeType === "Installment") {
    labels = Array.from({ length: Math.max(Number(installmentCount) || 1, 1) }, (_, i) => `Installment ${i + 1}`);
  } else if (schemeType === "Quarterly") {
    labels = ["Quarter 1", "Quarter 2", "Quarter 3", "Quarter 4"];
  } else if (schemeType === "Half Yearly") {
    labels = ["Half Yearly 1", "Half Yearly 2"];
  } else if (schemeType === "Annual") {
    labels = ["Annual"];
  } else {
    labels = ["Yearly"];
  }

  return labels.map((label) => ({ key: label, short: label, column: label }));
};

// Academic year runs April to March
const getCurrentSession = (date = new Date()) => {
  const start = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  return `${start}-${start + 1}`;
};

const getSessionStartYear = (session) => {
  const year = parseInt(String(session || "").slice(0, 4), 10);
  return Number.isNaN(year) ? null : year;
};

// A student is "new" for a session when admitted inside that session's April-March window
const isNewStudent = (admissionDate, session) => {
  const startYear = getSessionStartYear(session);
  if (!startYear || !admissionDate) return false;

  const admitted = new Date(admissionDate);
  if (Number.isNaN(admitted.getTime())) return false;

  const from = new Date(startYear, 3, 1);
  const to = new Date(startYear + 1, 2, 31, 23, 59, 59);
  return admitted >= from && admitted <= to;
};

// Deposit dates are plain yyyy-mm-dd strings; allow a day of timezone slack
const isFutureDate = (dateStr) => {
  const limit = new Date(Date.now() + 14 * 60 * 60 * 1000).toISOString().split("T")[0];
  return dateStr > limit;
};

const concessionAmount = (concession, headName, period, fee) => {
  if (!concession || concession.isActive === false || fee <= 0) return 0;

  const heads = concession.applicableFeeHeads || [];
  if (heads.length > 0 && !heads.includes(headName)) return 0;

  const months = concession.applicableMonths || [];
  if (months.length > 0 && !months.includes(period.column) && !months.includes(period.key)) return 0;

  const value = Number(concession.concessionValue) || 0;
  const raw = concession.concessionType === "Amount" ? value : (fee * value) / 100;
  return Math.min(round2(raw), fee);
};

const buildPaidMap = (receipts) => {
  const map = new Map();
  receipts.forEach((receipt) => {
    (receipt.rows || []).forEach((row) => {
      map.set(row.rowKey, round2((map.get(row.rowKey) || 0) + Number(row.paid || 0)));
    });
  });
  return map;
};

/**
 * Builds the fee rows (one per period + head) for a student in a session.
 *
 * Plan rows are only generated for the session the student currently belongs to; for any other
 * session the plan rows are rebuilt from the receipts already issued. Transport and manually
 * added fees are always session-bound records so they work for every session.
 */
const buildStudentRows = ({
  admission,
  session,
  profileSession,
  scheme,
  plan,
  concession,
  transport,
  manualFees = [],
  historyRows = [],
  paidMap,
}) => {
  const schemeType = plan?.feeScheme || scheme?.schemeType || "Monthly";
  const periods = getPeriods(schemeType, scheme?.installmentCount);
  const periodIndex = new Map(periods.map((p, i) => [p.key, i]));

  const headOrder = new Map((scheme?.feeHeads || []).map((h, i) => [h.feeHeadName, i]));
  const rows = [];

  const pushRow = (base) => {
    const paid = round2(paidMap.get(base.rowKey) || 0);
    const payable = Math.max(round2(base.fee - base.concession - paid), 0);
    rows.push({
      ...base,
      paid,
      payable,
      balance: payable,
      periodIndex: periodIndex.has(base.periodKey) ? periodIndex.get(base.periodKey) : 99,
    });
  };

  if (session === profileSession && plan) {
    const amounts = isNewStudent(admission.admissionDate, session)
      ? plan.newStudentAmounts
      : plan.oldStudentAmounts;

    Object.keys(amounts || {}).forEach((headName) => {
      periods.forEach((period) => {
        const fee = round2(amounts?.[headName]?.[period.column]);
        if (fee <= 0) return;

        pushRow({
          rowKey: `FeePlan|${period.key}|${headName}|`,
          source: "FeePlan",
          manualFeeId: null,
          periodKey: period.key,
          periodShort: period.short,
          feeHeadName: headName,
          fee,
          concession: concessionAmount(concession, headName, period, fee),
        });
      });
    });
  } else {
    const grouped = new Map();
    historyRows.forEach((row) => {
      if (row.source !== "FeePlan") return;
      const existing = grouped.get(row.rowKey);
      if (!existing) {
        grouped.set(row.rowKey, { ...row });
      } else {
        existing.fee = Math.max(existing.fee, row.fee);
        existing.concession = Math.max(existing.concession, row.concession);
      }
    });

    grouped.forEach((row) => {
      pushRow({
        rowKey: row.rowKey,
        source: "FeePlan",
        manualFeeId: null,
        periodKey: row.periodKey,
        periodShort: row.periodShort || row.periodKey,
        feeHeadName: row.feeHeadName,
        fee: row.fee,
        concession: row.concession,
      });
    });
  }

  if (transport && transport.monthlyFee > 0) {
    const multiplier = schemeType === "Monthly" ? 1 : Math.round(12 / periods.length) || 1;
    const removed = new Set(transport.removedPeriods || []);

    periods.forEach((period) => {
      if (removed.has(period.key)) return;

      pushRow({
        rowKey: `Transport|${period.key}|${TRANSPORT_HEAD}|`,
        source: "Transport",
        manualFeeId: null,
        periodKey: period.key,
        periodShort: period.short,
        feeHeadName: TRANSPORT_HEAD,
        fee: round2(transport.monthlyFee * multiplier),
        concession: 0,
      });
    });
  }

  manualFees.forEach((item) => {
    const period = periods.find((p) => p.key === item.periodKey);

    pushRow({
      rowKey: `Manual|${item.periodKey}|${item.feeHeadName}|${item._id}`,
      source: "Manual",
      manualFeeId: item._id,
      periodKey: item.periodKey,
      periodShort: period?.short || item.periodKey,
      feeHeadName: item.feeHeadName,
      fee: round2(item.amount),
      concession: 0,
    });
  });

  const sourceRank = { FeePlan: 0, Transport: 1, Manual: 2 };
  rows.sort((a, b) => {
    if (a.periodIndex !== b.periodIndex) return a.periodIndex - b.periodIndex;
    const ha = headOrder.has(a.feeHeadName) ? headOrder.get(a.feeHeadName) : 999;
    const hb = headOrder.has(b.feeHeadName) ? headOrder.get(b.feeHeadName) : 999;
    if (ha !== hb) return ha - hb;
    return sourceRank[a.source] - sourceRank[b.source];
  });

  const totals = rows.reduce(
    (acc, row) => {
      acc.totalFee += row.fee;
      acc.totalConcession += row.concession;
      acc.totalPaid += row.paid;
      acc.balance += row.payable;
      return acc;
    },
    { totalFee: 0, totalConcession: 0, totalPaid: 0, balance: 0 }
  );

  Object.keys(totals).forEach((key) => {
    totals[key] = round2(totals[key]);
  });

  return { periods, rows, totals };
};

module.exports = {
  TRANSPORT_HEAD,
  round2,
  escapeRegex,
  getPeriods,
  getCurrentSession,
  getSessionStartYear,
  isNewStudent,
  isFutureDate,
  concessionAmount,
  buildPaidMap,
  buildStudentRows,
};
