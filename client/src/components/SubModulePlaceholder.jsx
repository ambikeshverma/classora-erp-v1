import React from "react";
import { useNavigate } from "react-router-dom";

const SubModulePlaceholder = ({ title, moduleName, icon = "📁", backRoute = "/dashboard" }) => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        padding: "32px 20px",
        fontFamily: "'Segoe UI', Roboto, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
        }}
      >
        <button
          onClick={() => navigate(backRoute)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            padding: "8px 16px",
            fontSize: "14px",
            fontWeight: "600",
            color: "#334155",
            cursor: "pointer",
            marginBottom: "24px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          }}
        >
          ← Back to {moduleName || "Module"}
        </button>

        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            padding: "40px 32px",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.06)",
            border: "1px solid #e2e8f0",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              margin: "0 auto 20px",
              borderRadius: "50%",
              background: "#eff6ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "36px",
            }}
          >
            {icon}
          </div>

          <span
            style={{
              display: "inline-block",
              background: "#dbeafe",
              color: "#1e40af",
              fontSize: "12px",
              fontWeight: "700",
              padding: "4px 12px",
              borderRadius: "12px",
              marginBottom: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {moduleName || "Module Active"}
          </span>

          <h1
            style={{
              fontSize: "26px",
              fontWeight: "800",
              color: "#0f172a",
              margin: "0 0 12px",
            }}
          >
            {title}
          </h1>

          <p
            style={{
              fontSize: "15px",
              color: "#64748b",
              maxWidth: "540px",
              margin: "0 auto 28px",
              lineHeight: "1.6",
            }}
          >
            This feature is active and enabled for your school campus. The records and workflow configuration for this section are being synced.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => navigate(backRoute)}
              style={{
                padding: "10px 20px",
                background: "#2563eb",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Return to {moduleName} Hub
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              style={{
                padding: "10px 20px",
                background: "#f1f5f9",
                color: "#334155",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "14px",
                cursor: "pointer",
              }}
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubModulePlaceholder;
