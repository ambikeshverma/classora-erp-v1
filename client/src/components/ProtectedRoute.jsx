import React, { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

const ProtectedRoute = ({ children, moduleKey }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [deactivatedMsg, setDeactivatedMsg] = useState(null);

  useEffect(() => {
    const handleDeactivated = (event) => {
      setDeactivatedMsg(
        event.detail?.message ||
          "Your school account has been deactivated by Super Admin. Please contact Classora Support."
      );
    };

    window.addEventListener("school:deactivated", handleDeactivated);
    return () => {
      window.removeEventListener("school:deactivated", handleDeactivated);
    };
  }, []);

  if (deactivatedMsg) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          fontFamily: "'Segoe UI', Roboto, sans-serif",
          padding: "20px",
        }}
      >
        <div
          style={{
            maxWidth: "480px",
            width: "100%",
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(16px)",
            borderRadius: "20px",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            padding: "36px 28px",
            textAlign: "center",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            color: "#f8fafc",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              margin: "0 auto 20px",
              borderRadius: "50%",
              background: "rgba(239, 68, 68, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "36px",
            }}
          >
            🛑
          </div>
          <h2 style={{ fontSize: "22px", fontWeight: "700", marginBottom: "12px", color: "#f87171" }}>
            Account Deactivated
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: "1.6", marginBottom: "28px" }}>
            {deactivatedMsg}
          </p>
          <button
            onClick={() => {
              localStorage.clear();
              navigate("/");
            }}
            style={{
              padding: "12px 28px",
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              fontWeight: "600",
              cursor: "pointer",
              fontSize: "14px",
              transition: "all 0.2s ease",
            }}
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // Not logged in -> redirect to login
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // If this route requires a specific module, check if it's enabled for the school
  if (moduleKey) {
    try {
      const rawModules = localStorage.getItem("enabledModules");
      const enabledModules = rawModules ? JSON.parse(rawModules) : null;

      if (Array.isArray(enabledModules) && !enabledModules.includes(moduleKey)) {
        return (
          <div
            style={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#f1f5f9",
              fontFamily: "'Segoe UI', Roboto, sans-serif",
              padding: "20px",
            }}
          >
            <div
              style={{
                maxWidth: "520px",
                width: "100%",
                background: "#ffffff",
                borderRadius: "16px",
                padding: "36px 30px",
                textAlign: "center",
                boxShadow: "0 10px 30px -5px rgba(0, 0, 0, 0.08)",
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  width: "68px",
                  height: "68px",
                  margin: "0 auto 18px",
                  borderRadius: "50%",
                  background: "#fef3c7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "32px",
                }}
              >
                🔒
              </div>
              <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#1e293b", marginBottom: "10px" }}>
                Module Access Restricted
              </h2>
              <p style={{ color: "#64748b", fontSize: "14px", lineHeight: "1.6", marginBottom: "24px" }}>
                This module (<strong>{moduleKey}</strong>) is currently not enabled for your school campus.
                Please contact Classora Super Admin to subscribe or activate this feature.
              </p>
              <button
                onClick={() => navigate("/dashboard")}
                style={{
                  padding: "11px 24px",
                  background: "#4f46e5",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        );
      }
    } catch (e) {
      // Continue if modules parsing fails
    }
  }

  return children;
};

export default ProtectedRoute;
