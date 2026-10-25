import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./studentHub.css";
import { MODULES_REGISTRY } from "../constants/modulesRegistry";
import { useModulePermissions } from "../hooks/useModulePermissions";
import { SkeletonStats } from "../components/Skeleton";
import { studentHubService } from "../services/api";

function StudentHub() {
  const navigate = useNavigate();
  const MODULE_KEY = "student_hub";
  const { isSubModuleEnabled, showLockNotice, toastMessage } = useModulePermissions(MODULE_KEY);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    classes: 0,
    houses: 0,
  });

  const moduleDef = MODULES_REGISTRY.find((m) => m.key === MODULE_KEY);
  const cards = moduleDef ? moduleDef.subModules : [];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await studentHubService.getReports();
        if (res.data?.success) {
          const d = res.data.data;
          setStats({
            total: d.students?.total || 0,
            active: d.students?.active || 0,
            classes: d.infrastructure?.classes || 0,
            houses: d.infrastructure?.houses || 0,
          });
        }
      } catch (err) {
        console.error("Failed to load StudentHub stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleCardClick = (card) => {
    if (!isSubModuleEnabled(card.key)) {
      showLockNotice(card.name);
      return;
    }
    navigate(card.route);
  };

  return (
    <div className="student-hub-page">
      <div className="student-hub-header">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          ←
        </button>

        <div>
          <h1>Student Hub</h1>
          <p>Comprehensive student management, classes, sections, documents and analytics</p>
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        {loading ? (
          <SkeletonStats count={4} />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "14px",
            }}
          >
            <div
              style={{
                background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                color: "white",
                padding: "16px 20px",
                borderRadius: "14px",
                boxShadow: "0 4px 14px rgba(59,130,246,0.25)",
              }}
            >
              <div style={{ fontSize: "12px", opacity: 0.9, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Total Students Enrolled
              </div>
              <div style={{ fontSize: "28px", fontWeight: "700", marginTop: "4px" }}>
                {stats.total}
              </div>
            </div>

            <div
              style={{
                background: "linear-gradient(135deg, #10b981, #047857)",
                color: "white",
                padding: "16px 20px",
                borderRadius: "14px",
                boxShadow: "0 4px 14px rgba(16,185,129,0.25)",
              }}
            >
              <div style={{ fontSize: "12px", opacity: 0.9, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Active Students
              </div>
              <div style={{ fontSize: "28px", fontWeight: "700", marginTop: "4px" }}>
                {stats.active}
              </div>
            </div>

            <div
              style={{
                background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                color: "white",
                padding: "16px 20px",
                borderRadius: "14px",
                boxShadow: "0 4px 14px rgba(139,92,246,0.25)",
              }}
            >
              <div style={{ fontSize: "12px", opacity: 0.9, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Active Classes
              </div>
              <div style={{ fontSize: "28px", fontWeight: "700", marginTop: "4px" }}>
                {stats.classes}
              </div>
            </div>

            <div
              style={{
                background: "linear-gradient(135deg, #f59e0b, #b45309)",
                color: "white",
                padding: "16px 20px",
                borderRadius: "14px",
                boxShadow: "0 4px 14px rgba(245,158,11,0.25)",
              }}
            >
              <div style={{ fontSize: "12px", opacity: 0.9, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Active Houses
              </div>
              <div style={{ fontSize: "28px", fontWeight: "700", marginTop: "4px" }}>
                {stats.houses}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="student-hub-grid">
        {cards.map((card) => {
          const enabled = isSubModuleEnabled(card.key);
          return (
            <div
              className={`student-hub-card ${!enabled ? "submodule-card-locked" : ""}`}
              key={card.key}
              onClick={() => handleCardClick(card)}
              title={enabled ? card.name : `${card.name} — Locked by Super Admin`}
            >
              {!enabled && <span className="submodule-lock-badge">🔒 Locked</span>}
              <div className="student-hub-icon">{card.icon}</div>
              <h3>{card.name}</h3>
            </div>
          );
        })}
      </div>

      {toastMessage && (
        <div className="submodule-toast-banner">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default StudentHub;