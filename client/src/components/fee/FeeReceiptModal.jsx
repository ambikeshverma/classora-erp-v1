import React from "react";
import "./FeeReceiptModal.css";
import AppButton from "../AppButton";
import FeeReceiptPrint from "./FeeReceiptPrint";
import { buildReceiptPrintData } from "../../utils/feeUtils";

function FeeReceiptModal({ receipt, schoolInfo = {}, onClose }) {
  if (!receipt) return null;

  const printData = buildReceiptPrintData(receipt);

  return (
    <div className="fee-print-overlay">
      <div className="fee-print-box">
        <div className="fee-print-actions">
          {receipt.status === "Cancelled" && (
            <span className="fee-cancelled-tag">
              CANCELLED{receipt.cancelReason ? ` - ${receipt.cancelReason}` : ""}
            </span>
          )}

          <AppButton type="primary" onClick={() => window.print()}>
            Print
          </AppButton>

          <AppButton type="secondary" onClick={onClose}>
            Close
          </AppButton>
        </div>

        <FeeReceiptPrint
          schoolInfo={schoolInfo}
          receipt={printData}
          student={{
            studentName: receipt.studentName,
            fatherName: receipt.fatherName,
            admissionNo: receipt.admissionNo,
            srNo: receipt.srNo,
          }}
          studentProfile={{
            className: receipt.className,
            sectionName: receipt.section,
            routeName: receipt.routeName || "-",
            sessionName: receipt.session,
          }}
          showOfficeCopy={true}
        />
      </div>
    </div>
  );
}

export default FeeReceiptModal;
