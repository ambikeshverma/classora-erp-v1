import React from "react";
import "./expenseEntry.css";
import FinanceEntryPage from "../components/finance/FinanceEntryPage";

function ExpenseEntry() {
  return <FinanceEntryPage type="EXPENSE" />;
}

export default ExpenseEntry;
