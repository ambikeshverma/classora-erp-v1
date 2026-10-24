import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { superAdminService } from "../services/api";
import {
  Shield,
  School,
  CheckCircle,
  XCircle,
  Layers,
  Search,
  Plus,
  Key,
  LogOut,
  Trash2,
  Copy,
  Check,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  Sliders,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import "./superAdminDashboard.css";

import {
  MODULES_REGISTRY as ALL_MODULES,
  getDefaultSubModulesMap as getDefaultSubModules,
  TOTAL_SUB_MODULES_COUNT as TOTAL_SUB_MODULES,
} from "../constants/modulesRegistry";
import ScanLoader from "../components/ScanLoader";
import { SkeletonCard, SkeletonList } from "../components/Skeleton";

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [schools, setSchools] = useState([]);
  const [stats, setStats] = useState({
    totalSchools: 0,
    activeSchools: 0,
    inactiveSchools: 0,
    allModulesCount: ALL_MODULES.length,
    allSubModulesCount: TOTAL_SUB_MODULES,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTab, setFilterTab] = useState("all"); // 'all', 'active', 'inactive'
  const [adminUser, setAdminUser] = useState(null);

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [modulesModalOpen, setModulesModalOpen] = useState(false);
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);

  const [selectedSchool, setSelectedSchool] = useState(null);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState(null);

  // Accordion & Filter states for Modules modals
  const [expandedCreateModules, setExpandedCreateModules] = useState({});
  const [expandedEditModules, setExpandedEditModules] = useState({});
  const [modulesFilterSearch, setModulesFilterSearch] = useState("");

  // Notice modal
  const [noticeModalOpen, setNoticeModalOpen] = useState(false);
  const [schoolNotices, setSchoolNotices] = useState([]);
  const [noticeForm, setNoticeForm] = useState({ title: "", message: "", type: "info" });
  const [noticeLoading, setNoticeLoading] = useState(false);

  // Form states for Create School
  const [newSchoolData, setNewSchoolData] = useState({
    campusId: "",
    schoolName: "",
    principalName: "",
    email: "",
    password: "",
    contactNo: "",
    address: "",
    website: "",
    schoolLogo: "",
    enabledModules: ALL_MODULES.map((m) => m.key),
    enabledSubModules: getDefaultSubModules(),
  });

  // Form state for Reset Password
  const [newPasswordInput, setNewPasswordInput] = useState("");

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const openNoticeModal = async (school) => {
    setSelectedSchool(school);
    setNoticeForm({ title: "", message: "", type: "info" });
    setNoticeLoading(true);
    setNoticeModalOpen(true);
    try {
      const res = await superAdminService.getSchoolNotices(school._id);
      if (res.data.success) setSchoolNotices(res.data.notices || []);
    } catch { setSchoolNotices([]); }
    setNoticeLoading(false);
  };

  const handleAddNotice = async () => {
    if (!noticeForm.message.trim()) return showToast("Notice message is required", "error");
    try {
      const res = await superAdminService.addSchoolNotice(selectedSchool._id, noticeForm);
      if (res.data.success) {
        setSchoolNotices((prev) => [res.data.notice, ...prev]);
        setNoticeForm({ title: "", message: "", type: "info" });
        showToast("Notice sent successfully ✅");
      }
    } catch (err) { showToast(err.response?.data?.message || "Failed to send notice", "error"); }
  };

  const handleToggleNotice = async (noticeId) => {
    try {
      const res = await superAdminService.toggleSchoolNotice(selectedSchool._id, noticeId);
      if (res.data.success) {
        setSchoolNotices((prev) => prev.map((n) => n._id === noticeId ? res.data.notice : n));
      }
    } catch (err) { showToast("Failed to toggle notice", "error"); }
  };

  const handleDeleteNotice = async (noticeId) => {
    if (!window.confirm("Delete this notice?")) return;
    try {
      await superAdminService.deleteSchoolNotice(selectedSchool._id, noticeId);
      setSchoolNotices((prev) => prev.filter((n) => n._id !== noticeId));
      showToast("Notice deleted ✅");
    } catch { showToast("Failed to delete notice", "error"); }
  };

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const res = await superAdminService.getSchools();
      if (res.data.success) {
        setSchools(res.data.data);
        setStats(res.data.stats);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/super-admin/login");
      } else {
        showToast(err.response?.data?.message || "Failed to fetch schools", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("superAdminUser");
    if (storedUser) {
      try {
        setAdminUser(JSON.parse(storedUser));
      } catch (e) {}
    }
    fetchSchools();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    try {
      await superAdminService.logout();
    } catch (e) {}
    localStorage.removeItem("superAdminToken");
    localStorage.removeItem("superAdminUser");
    navigate("/super-admin/login");
  };

  // Toggle Active / Inactive Status
  const handleToggleStatus = async (school) => {
    const newStatus = !school.isActive;
    const confirmMsg = newStatus
      ? `Activate '${school.schoolName}'? Users of this school will be able to log in.`
      : `Deactivate '${school.schoolName}'? This will immediately prevent all logins and block API access for this school campus.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await superAdminService.toggleSchoolStatus(school._id, newStatus);
      if (res.data.success) {
        showToast(res.data.message);
        setSchools((prev) =>
          prev.map((s) => (s._id === school._id ? { ...s, isActive: newStatus } : s))
        );
        setStats((prev) => ({
          ...prev,
          activeSchools: newStatus ? prev.activeSchools + 1 : prev.activeSchools - 1,
          inactiveSchools: newStatus ? prev.inactiveSchools - 1 : prev.inactiveSchools + 1,
        }));
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Status update failed", "error");
    }
  };

  // Accordion Expand Helpers
  const toggleExpandCreate = (modKey) => {
    setExpandedCreateModules((prev) => ({
      ...prev,
      [modKey]: !prev[modKey],
    }));
  };

  const toggleExpandEdit = (modKey) => {
    setExpandedEditModules((prev) => ({
      ...prev,
      [modKey]: !prev[modKey],
    }));
  };

  // --- Create School Sub-module Handlers ---
  const toggleModuleInNewSchool = (modKey) => {
    const isSelected = newSchoolData.enabledModules.includes(modKey);
    const modDef = ALL_MODULES.find((m) => m.key === modKey);
    const allSubs = (modDef?.subModules || []).map((s) => s.key);

    if (isSelected) {
      const updatedModules = newSchoolData.enabledModules.filter((k) => k !== modKey);
      const updatedSubs = { ...newSchoolData.enabledSubModules };
      delete updatedSubs[modKey];
      setNewSchoolData({
        ...newSchoolData,
        enabledModules: updatedModules,
        enabledSubModules: updatedSubs,
      });
    } else {
      const updatedModules = [...newSchoolData.enabledModules, modKey];
      const updatedSubs = {
        ...newSchoolData.enabledSubModules,
        [modKey]: allSubs,
      };
      setNewSchoolData({
        ...newSchoolData,
        enabledModules: updatedModules,
        enabledSubModules: updatedSubs,
      });
    }
  };

  const toggleSubModuleInNewSchool = (modKey, subModKey) => {
    const isModSelected = newSchoolData.enabledModules.includes(modKey);
    const currentSubs = newSchoolData.enabledSubModules[modKey] || [];
    const isSubSelected = currentSubs.includes(subModKey);

    const updatedSubsList = isSubSelected
      ? currentSubs.filter((k) => k !== subModKey)
      : [...currentSubs, subModKey];

    const updatedModules = isModSelected
      ? newSchoolData.enabledModules
      : [...newSchoolData.enabledModules, modKey];

    setNewSchoolData({
      ...newSchoolData,
      enabledModules: updatedModules,
      enabledSubModules: {
        ...newSchoolData.enabledSubModules,
        [modKey]: updatedSubsList,
      },
    });
  };

  const selectAllSubModulesInNewSchool = (modKey) => {
    const modDef = ALL_MODULES.find((m) => m.key === modKey);
    const allSubs = (modDef?.subModules || []).map((s) => s.key);
    const isModSelected = newSchoolData.enabledModules.includes(modKey);
    const updatedModules = isModSelected
      ? newSchoolData.enabledModules
      : [...newSchoolData.enabledModules, modKey];

    setNewSchoolData({
      ...newSchoolData,
      enabledModules: updatedModules,
      enabledSubModules: {
        ...newSchoolData.enabledSubModules,
        [modKey]: allSubs,
      },
    });
  };

  const clearAllSubModulesInNewSchool = (modKey) => {
    setNewSchoolData({
      ...newSchoolData,
      enabledSubModules: {
        ...newSchoolData.enabledSubModules,
        [modKey]: [],
      },
    });
  };

  const selectAllInNewSchool = () => {
    setNewSchoolData({
      ...newSchoolData,
      enabledModules: ALL_MODULES.map((m) => m.key),
      enabledSubModules: getDefaultSubModules(),
    });
  };

  const clearAllInNewSchool = () => {
    setNewSchoolData({
      ...newSchoolData,
      enabledModules: [],
      enabledSubModules: {},
    });
  };

  // --- Edit School Modules & Sub-modules Handlers ---
  const openModulesModal = (school) => {
    const currentEnabledModules = school.enabledModules || [];
    let currentSubModules = {};
    if (school.enabledSubModules && typeof school.enabledSubModules === "object") {
      currentSubModules = { ...school.enabledSubModules };
    }
    currentEnabledModules.forEach((modKey) => {
      if (!currentSubModules[modKey]) {
        const modDef = ALL_MODULES.find((m) => m.key === modKey);
        currentSubModules[modKey] = modDef ? (modDef.subModules || []).map((s) => s.key) : [];
      }
    });

    setSelectedSchool({
      ...school,
      enabledModules: currentEnabledModules,
      enabledSubModules: currentSubModules,
    });
    setModulesFilterSearch("");
    setModulesModalOpen(true);
  };

  const toggleModuleInSelected = (modKey) => {
    if (!selectedSchool) return;
    const currentMods = selectedSchool.enabledModules || [];
    const isSelected = currentMods.includes(modKey);
    const modDef = ALL_MODULES.find((m) => m.key === modKey);
    const allSubs = (modDef?.subModules || []).map((s) => s.key);

    if (isSelected) {
      const updatedMods = currentMods.filter((k) => k !== modKey);
      const updatedSubs = { ...(selectedSchool.enabledSubModules || {}) };
      delete updatedSubs[modKey];
      setSelectedSchool({
        ...selectedSchool,
        enabledModules: updatedMods,
        enabledSubModules: updatedSubs,
      });
    } else {
      const updatedMods = [...currentMods, modKey];
      const updatedSubs = {
        ...(selectedSchool.enabledSubModules || {}),
        [modKey]: allSubs,
      };
      setSelectedSchool({
        ...selectedSchool,
        enabledModules: updatedMods,
        enabledSubModules: updatedSubs,
      });
    }
  };

  const toggleSubModuleInSelected = (modKey, subModKey) => {
    if (!selectedSchool) return;
    const currentMods = selectedSchool.enabledModules || [];
    const isModSelected = currentMods.includes(modKey);
    const currentSubs = selectedSchool.enabledSubModules?.[modKey] || [];
    const isSubSelected = currentSubs.includes(subModKey);

    const updatedSubsList = isSubSelected
      ? currentSubs.filter((k) => k !== subModKey)
      : [...currentSubs, subModKey];

    const updatedMods = isModSelected ? currentMods : [...currentMods, modKey];

    setSelectedSchool({
      ...selectedSchool,
      enabledModules: updatedMods,
      enabledSubModules: {
        ...(selectedSchool.enabledSubModules || {}),
        [modKey]: updatedSubsList,
      },
    });
  };

  const selectAllSubModulesInSelected = (modKey) => {
    if (!selectedSchool) return;
    const modDef = ALL_MODULES.find((m) => m.key === modKey);
    const allSubs = (modDef?.subModules || []).map((s) => s.key);
    const currentMods = selectedSchool.enabledModules || [];
    const updatedMods = currentMods.includes(modKey) ? currentMods : [...currentMods, modKey];

    setSelectedSchool({
      ...selectedSchool,
      enabledModules: updatedMods,
      enabledSubModules: {
        ...(selectedSchool.enabledSubModules || {}),
        [modKey]: allSubs,
      },
    });
  };

  const clearAllSubModulesInSelected = (modKey) => {
    if (!selectedSchool) return;
    setSelectedSchool({
      ...selectedSchool,
      enabledSubModules: {
        ...(selectedSchool.enabledSubModules || {}),
        [modKey]: [],
      },
    });
  };

  const selectAllModulesForSelected = () => {
    if (!selectedSchool) return;
    setSelectedSchool({
      ...selectedSchool,
      enabledModules: ALL_MODULES.map((m) => m.key),
      enabledSubModules: getDefaultSubModules(),
    });
  };

  const clearAllModulesForSelected = () => {
    if (!selectedSchool) return;
    setSelectedSchool({
      ...selectedSchool,
      enabledModules: [],
      enabledSubModules: {},
    });
  };

  // Save Module Permissions for Selected School
  const handleSaveModules = async () => {
    if (!selectedSchool) return;
    try {
      const res = await superAdminService.updateSchoolModules(
        selectedSchool._id,
        selectedSchool.enabledModules,
        selectedSchool.enabledSubModules
      );
      if (res.data.success) {
        showToast(res.data.message);
        setSchools((prev) =>
          prev.map((s) =>
            s._id === selectedSchool._id
              ? {
                  ...s,
                  enabledModules: res.data.data.enabledModules,
                  enabledSubModules: res.data.data.enabledSubModules,
                }
              : s
          )
        );
        setModulesModalOpen(false);
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update modules", "error");
    }
  };

  // Reset School Password
  const handleResetPassword = async () => {
    if (!newPasswordInput || newPasswordInput.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    try {
      const res = await superAdminService.resetSchoolPassword(
        selectedSchool._id,
        newPasswordInput
      );
      if (res.data.success) {
        showToast(res.data.message);
        setSelectedSchool({ ...selectedSchool, lastPassword: newPasswordInput });
        setNewPasswordInput("");
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to reset password", "error");
    }
  };

  // Delete School
  const handleDeleteSchool = async (school) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete '${school.schoolName}' (${school.campusId})? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const res = await superAdminService.deleteSchool(school._id);
      if (res.data.success) {
        showToast(res.data.message);
        fetchSchools();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete school", "error");
    }
  };

  // Generate Random Password Helper
  const generateRandomPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
    let pwd = "";
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };

  // Create School Submit
  const handleCreateSchool = async (e) => {
    e.preventDefault();
    try {
      const res = await superAdminService.createSchool(newSchoolData);
      if (res.data.success) {
        showToast(res.data.message);
        setCreateModalOpen(false);

        // Open credentials view modal so admin can immediately copy credentials
        setSelectedSchool({
          ...res.data.data,
          lastPassword: newSchoolData.password,
        });
        setCredentialsModalOpen(true);

        // Reset form
        setNewSchoolData({
          campusId: "",
          schoolName: "",
          principalName: "",
          email: "",
          password: "",
          contactNo: "",
          address: "",
          website: "",
          schoolLogo: "",
          enabledModules: ALL_MODULES.map((m) => m.key),
          enabledSubModules: getDefaultSubModules(),
        });

        fetchSchools();
      }
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to create school", "error");
    }
  };

  // Copy School Credentials to Clipboard
  const handleCopyCredentials = (school) => {
    const text = `*CLASSORA ERP - SCHOOL CREDENTIALS*\n` +
      `------------------------------------\n` +
      `School Name: ${school.schoolName}\n` +
      `School ID (DB): ${school._id || school.id}\n` +
      `Campus ID: ${school.campusId}\n` +
      `Login Email: ${school.email}\n` +
      (school.lastPassword ? `Password: ${school.lastPassword}\n` : `Password: (As configured)\n`) +
      `Login Portal URL: ${window.location.origin}\n` +
      `Status: ${school.isActive ? "Active ✅" : "Inactive ❌"}\n` +
      `------------------------------------\n` +
      `Keep these credentials safe. For support, contact Classora Super Admin.`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Filter & Search Logic
  const filteredSchools = schools.filter((school) => {
    const matchesFilter =
      filterTab === "all"
        ? true
        : filterTab === "active"
        ? school.isActive
        : !school.isActive;

    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      school.schoolName?.toLowerCase().includes(term) ||
      school.campusId?.toLowerCase().includes(term) ||
      school.principalName?.toLowerCase().includes(term) ||
      school.email?.toLowerCase().includes(term);

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="sa-dashboard-wrapper">
      {/* 🚀 Modern Holographic Scanning Page Overlay Loader */}
      <ScanLoader
        loading={loading}
        title="Classora Master Control"
        subtitle="Synchronizing Multi-School Governance & Security Registry..."
        badgeText="CENTRAL CORE • GOVERNANCE SCAN"
        readout="Verifying Multi-Campus Security & Network..."
        variant="superAdmin"
        delay={100}
        minDuration={300}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            background: toast.type === "error" ? "#ef4444" : "#10b981",
            color: "#ffffff",
            padding: "14px 22px",
            borderRadius: "12px",
            fontWeight: "600",
            fontSize: "14px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "10px",
            animation: "fadeIn 0.3s ease",
          }}
        >
          {toast.type === "error" ? <XCircle size={18} /> : <CheckCircle size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sa-navbar">
        <div className="sa-brand-group">
          <div className="sa-brand-icon">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="sa-brand-title">Classora ERP</h1>
            <p className="sa-brand-subtitle">Master Super Admin Governance</p>
          </div>
        </div>

        <div className="sa-nav-actions">
          <div className="sa-admin-badge">
            <div className="sa-admin-avatar">A</div>
            <span>{adminUser?.email || "Super Admin"}</span>
          </div>
          <button className="sa-logout-btn" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="sa-main-content">
        {/* KPI Stats Grid */}
        <section className="sa-stats-grid">
          <div className="sa-stat-card">
            <div className="sa-stat-info">
              <h3>Registered Schools</h3>
              <p className="sa-stat-value">{stats.totalSchools}</p>
            </div>
            <div className="sa-stat-icon blue">
              <School size={28} />
            </div>
          </div>

          <div className="sa-stat-card">
            <div className="sa-stat-info">
              <h3>Active Schools</h3>
              <p className="sa-stat-value">{stats.activeSchools}</p>
            </div>
            <div className="sa-stat-icon green">
              <CheckCircle size={28} />
            </div>
          </div>

          <div className="sa-stat-card">
            <div className="sa-stat-info">
              <h3>Inactive Schools</h3>
              <p className="sa-stat-value">{stats.inactiveSchools}</p>
            </div>
            <div className="sa-stat-icon red">
              <XCircle size={28} />
            </div>
          </div>

          <div className="sa-stat-card">
            <div className="sa-stat-info">
              <h3>Available Modules</h3>
              <p className="sa-stat-value">{ALL_MODULES.length}</p>
            </div>
            <div className="sa-stat-icon purple">
              <Layers size={28} />
            </div>
          </div>
        </section>

        {/* Control Bar: Search, Filters, and Add School button */}
        <section className="sa-control-bar">
          <div className="sa-search-filter-group">
            <div className="sa-search-box">
              <Search size={18} className="sa-search-icon" />
              <input
                type="text"
                className="sa-search-input"
                placeholder="Search by school, Campus ID, principal, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="sa-filter-tabs">
              <button
                className={`sa-filter-tab ${filterTab === "all" ? "active" : ""}`}
                onClick={() => setFilterTab("all")}
              >
                All ({schools.length})
              </button>
              <button
                className={`sa-filter-tab ${filterTab === "active" ? "active" : ""}`}
                onClick={() => setFilterTab("active")}
              >
                Active ({schools.filter((s) => s.isActive).length})
              </button>
              <button
                className={`sa-filter-tab ${filterTab === "inactive" ? "active" : ""}`}
                onClick={() => setFilterTab("inactive")}
              >
                Inactive ({schools.filter((s) => !s.isActive).length})
              </button>
            </div>
          </div>

          <button
            className="sa-primary-action-btn"
            onClick={() => setCreateModalOpen(true)}
          >
            <Plus size={18} /> Register New School
          </button>
        </section>

        {/* Schools List */}
        <section className="sa-schools-container">
          {loading ? (
            <div style={{ padding: "8px 0" }}>
              <SkeletonCard count={4} lines={3} theme="dark" />
            </div>
          ) : filteredSchools.length === 0 ? (
            <div className="sa-empty-state">
              <div className="sa-empty-state-icon">🏫</div>
              <h3>No Schools Found</h3>
              <p>
                {searchTerm || filterTab !== "all"
                  ? "No schools matched your search criteria or filter."
                  : "You haven't registered any schools yet. Create your first school to give school admins access."}
              </p>
              <button
                className="sa-primary-action-btn"
                style={{ margin: "0 auto" }}
                onClick={() => {
                  setSearchTerm("");
                  setFilterTab("all");
                  setCreateModalOpen(true);
                }}
              >
                <Plus size={18} /> Add Your First School
              </button>
            </div>
          ) : (
            filteredSchools.map((school) => {
              const activeCount = school.enabledModules?.length || 0;
              return (
                <div
                  key={school._id}
                  className={`sa-school-card ${school.isActive ? "active" : "inactive"}`}
                >
                  {/* Left: Avatar & Identity */}
                  <div className="sa-school-primary-info">
                    <div className="sa-school-avatar">
                      {school.schoolLogo ? (
                        <img
                          src={school.schoolLogo}
                          alt="Logo"
                          style={{ width: "100%", height: "100%", borderRadius: "14px", objectFit: "cover" }}
                        />
                      ) : (
                        school.schoolName?.charAt(0).toUpperCase() || "S"
                      )}
                    </div>
                    <div className="sa-school-details">
                      <h4>
                        {school.schoolName}
                        <span className="sa-campus-pill">ID: {school.campusId}</span>
                      </h4>
                      <div className="sa-school-subtext">
                        <span>
                          <Mail size={13} /> {school.email}
                        </span>
                        <span>
                          <Phone size={13} /> {school.contactNo}
                        </span>
                        <span>
                          <MapPin size={13} /> {school.address}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Feature Modules & Active Switch */}
                  <div className="sa-school-status-section">
                    <div className="sa-modules-badge">
                      <Sliders size={14} />
                      <span>{activeCount} / {ALL_MODULES.length} Modules</span>
                    </div>

                    {(() => {
                      const subCount = Object.values(school.enabledSubModules || {}).reduce(
                        (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
                        0
                      );
                      return (
                        <div className="sa-submodules-badge" title={`${subCount} sub-modules active`}>
                          <Layers size={13} />
                          <span>{subCount} Sub-modules</span>
                        </div>
                      );
                    })()}

                    {/* Active / Inactive Switch Toggle */}
                    <div className="sa-status-toggle-wrapper">
                      <label className="sa-toggle-switch">
                        <input
                          type="checkbox"
                          checked={school.isActive}
                          onChange={() => handleToggleStatus(school)}
                        />
                        <span className="sa-slider"></span>
                      </label>
                      <span className={`sa-status-label ${school.isActive ? "active" : "inactive"}`}>
                        {school.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="sa-school-actions">
                    <button
                      className="sa-btn-icon-label manage-modules"
                      onClick={() => openModulesModal(school)}
                      title="Enable or disable specific features and sub-modules for this school"
                    >
                      <Sliders size={14} /> Modules & Sub-modules
                    </button>

                    <button
                      className="sa-btn-icon-label"
                      style={{ background: "rgba(234,179,8,0.15)", color: "#ca8a04", border: "1px solid rgba(234,179,8,0.3)" }}
                      onClick={() => openNoticeModal(school)}
                      title="Send notice or warning to this school"
                    >
                      📢 Notice
                    </button>

                    <button
                      className="sa-btn-icon-label credentials"
                      onClick={() => {
                        setSelectedSchool({ ...school });
                        setCredentialsModalOpen(true);
                      }}
                      title="View school ID, campus ID, and credentials"
                    >
                      <Key size={14} /> Credentials
                    </button>

                    <button
                      className="sa-btn-danger-icon"
                      onClick={() => handleDeleteSchool(school)}
                      title="Delete school"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </main>

      {/* ==========================================================
          MODAL 1: CREATE NEW SCHOOL
      ========================================================== */}
      {createModalOpen && (
        <div className="sa-modal-backdrop" onClick={() => setCreateModalOpen(false)}>
          <div className="sa-modal-card wide" onClick={(e) => e.stopPropagation()}>
            <div className="sa-modal-header">
              <h3>
                <School size={22} color="#6366f1" /> Create & Provision New School
              </h3>
              <button
                className="sa-modal-close-btn"
                onClick={() => setCreateModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSchool}>
              <div className="sa-modal-body">
                <div
                  style={{
                    background: "rgba(99, 102, 241, 0.1)",
                    border: "1px solid rgba(99, 102, 241, 0.25)",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    marginBottom: "20px",
                    fontSize: "13px",
                    color: "#c7d2fe",
                    lineHeight: "1.5",
                  }}
                >
                  💡 <strong>Tenant Isolation:</strong> The <strong>Campus ID</strong> acts as the unique school identifier.
                  All students, admissions, and records will be linked strictly against this school.
                </div>

                <div className="sa-form-grid-2">
                  <div className="sa-form-field">
                    <label>
                      Campus ID / School Code <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="sa-modal-input"
                      placeholder="e.g. SCH001, DPS101"
                      value={newSchoolData.campusId}
                      onChange={(e) =>
                        setNewSchoolData({ ...newSchoolData, campusId: e.target.value.toUpperCase() })
                      }
                      required
                    />
                  </div>

                  <div className="sa-form-field">
                    <label>
                      School Official Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="sa-modal-input"
                      placeholder="e.g. St. Xavier International Academy"
                      value={newSchoolData.schoolName}
                      onChange={(e) =>
                        setNewSchoolData({ ...newSchoolData, schoolName: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="sa-form-field">
                    <label>
                      Principal / Head Name <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="sa-modal-input"
                      placeholder="e.g. Dr. Robert Vance"
                      value={newSchoolData.principalName}
                      onChange={(e) =>
                        setNewSchoolData({ ...newSchoolData, principalName: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="sa-form-field">
                    <label>
                      Official Login Email <span className="required">*</span>
                    </label>
                    <input
                      type="email"
                      className="sa-modal-input"
                      placeholder="principal@school.com"
                      value={newSchoolData.email}
                      onChange={(e) =>
                        setNewSchoolData({ ...newSchoolData, email: e.target.value.toLowerCase() })
                      }
                      required
                    />
                  </div>

                  <div className="sa-form-field">
                    <label>
                      School Login Password <span className="required">*</span>
                    </label>
                    <div className="sa-password-input-group">
                      <input
                        type="text"
                        className="sa-modal-input"
                        placeholder="Set password or click generate"
                        value={newSchoolData.password}
                        onChange={(e) =>
                          setNewSchoolData({ ...newSchoolData, password: e.target.value })
                        }
                        required
                      />
                      <button
                        type="button"
                        className="sa-gen-pwd-btn"
                        onClick={() =>
                          setNewSchoolData({ ...newSchoolData, password: generateRandomPassword() })
                        }
                      >
                        <Sparkles size={11} style={{ marginRight: 3, verticalAlign: "middle" }} />
                        Generate
                      </button>
                    </div>
                  </div>

                  <div className="sa-form-field">
                    <label>
                      Contact Phone Number <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="sa-modal-input"
                      placeholder="e.g. 9876543210"
                      value={newSchoolData.contactNo}
                      onChange={(e) =>
                        setNewSchoolData({ ...newSchoolData, contactNo: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="sa-form-field sa-form-full">
                    <label>
                      School Campus Address <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      className="sa-modal-input"
                      placeholder="Street, City, State, PIN"
                      value={newSchoolData.address}
                      onChange={(e) =>
                        setNewSchoolData({ ...newSchoolData, address: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="sa-form-field">
                    <label>Website URL (Optional)</label>
                    <input
                      type="text"
                      className="sa-modal-input"
                      placeholder="https://myschool.edu"
                      value={newSchoolData.website}
                      onChange={(e) =>
                        setNewSchoolData({ ...newSchoolData, website: e.target.value })
                      }
                    />
                  </div>

                  <div className="sa-form-field">
                    <label>School Logo URL (Optional)</label>
                    <input
                      type="text"
                      className="sa-modal-input"
                      placeholder="https://.../logo.png"
                      value={newSchoolData.schoolLogo}
                      onChange={(e) =>
                        setNewSchoolData({ ...newSchoolData, schoolLogo: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Module Permissions Selection */}
                <div className="sa-modules-header-bar">
                  <div>
                    <h4>
                      Module & Sub-module Permissions
                    </h4>
                    <p style={{ fontSize: "12px", color: "#94a3b8", margin: "4px 0 0 0" }}>
                      {newSchoolData.enabledModules.length} of {ALL_MODULES.length} Modules active (
                      {Object.values(newSchoolData.enabledSubModules || {}).reduce(
                        (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
                        0
                      )} of {TOTAL_SUB_MODULES} Sub-modules active)
                    </p>
                  </div>
                  <div className="sa-quick-toggle-actions">
                    <button
                      type="button"
                      className="sa-mini-btn"
                      onClick={selectAllInNewSchool}
                    >
                      Enable All
                    </button>
                    <button
                      type="button"
                      className="sa-mini-btn"
                      onClick={clearAllInNewSchool}
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="sa-modules-accordion-list">
                  {ALL_MODULES.map((mod) => {
                    const isSelected = newSchoolData.enabledModules.includes(mod.key);
                    const selectedSubs = newSchoolData.enabledSubModules[mod.key] || [];
                    const isExpanded = !!expandedCreateModules[mod.key];
                    const subCount = mod.subModules?.length || 0;

                    return (
                      <div
                        key={mod.key}
                        className={`sa-module-accordion ${isSelected ? "active" : ""}`}
                      >
                        <div
                          className="sa-module-accordion-header"
                          onClick={() => toggleExpandCreate(mod.key)}
                        >
                          <span className="sa-module-accordion-icon">{mod.icon}</span>
                          <div className="sa-module-accordion-info">
                            <div className="sa-module-accordion-title">
                              <span>{mod.name}</span>
                              <span
                                className={`sa-submodule-pill ${
                                  selectedSubs.length > 0 ? "" : "muted"
                                }`}
                              >
                                {selectedSubs.length} / {subCount} Sub-modules
                              </span>
                            </div>
                            <div className="sa-module-accordion-desc">{mod.desc}</div>
                          </div>

                          <div
                            style={{ display: "flex", alignItems: "center", gap: "10px" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              className="sa-module-checkbox"
                              checked={isSelected}
                              onChange={() => toggleModuleInNewSchool(mod.key)}
                              title={isSelected ? "Disable module" : "Enable module"}
                            />
                            <button
                              type="button"
                              className="sa-accordion-expand-btn"
                              onClick={() => toggleExpandCreate(mod.key)}
                              title={isExpanded ? "Collapse sub-modules" : "Expand sub-modules"}
                            >
                              {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="sa-submodules-container">
                            <div className="sa-submodules-toolbar">
                              <span className="sa-submodules-toolbar-label">
                                Sub-modules for {mod.name}:
                              </span>
                              <div className="sa-quick-toggle-actions">
                                <button
                                  type="button"
                                  className="sa-mini-btn"
                                  onClick={() => selectAllSubModulesInNewSchool(mod.key)}
                                >
                                  Select All
                                </button>
                                <button
                                  type="button"
                                  className="sa-mini-btn"
                                  onClick={() => clearAllSubModulesInNewSchool(mod.key)}
                                >
                                  Clear
                                </button>
                              </div>
                            </div>

                            <div className="sa-submodules-grid">
                              {(mod.subModules || []).map((sub) => {
                                const isSubActive = selectedSubs.includes(sub.key);
                                return (
                                  <div
                                    key={sub.key}
                                    className={`sa-submodule-chip ${
                                      isSubActive ? "active" : ""
                                    }`}
                                    onClick={() => toggleSubModuleInNewSchool(mod.key, sub.key)}
                                  >
                                    <input
                                      type="checkbox"
                                      className="sa-submodule-checkbox"
                                      checked={isSubActive}
                                      onChange={() =>
                                        toggleSubModuleInNewSchool(mod.key, sub.key)
                                      }
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <span className="sa-submodule-chip-label">{sub.name}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="sa-modal-footer">
                <button
                  type="button"
                  className="sa-modal-btn-cancel"
                  onClick={() => setCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="sa-modal-btn-submit">
                  Create School & Provision Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================================
          MODAL 2: MANAGE FUNCTIONALITY & MODULES PER SCHOOL
      ========================================================== */}
      {modulesModalOpen && selectedSchool && (
        <div className="sa-modal-backdrop" onClick={() => setModulesModalOpen(false)}>
          <div className="sa-modal-card extra-wide" onClick={(e) => e.stopPropagation()}>
            <div className="sa-modal-header">
              <h3>
                <Sliders size={22} color="#0ea5e9" /> Feature & Sub-Module Control: {selectedSchool.schoolName}
              </h3>
              <button
                className="sa-modal-close-btn"
                onClick={() => setModulesModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="sa-modal-body">
              <p style={{ color: "#94a3b8", fontSize: "14px", marginTop: 0, marginBottom: "16px" }}>
                Toggle which features and sub-modules this school campus can access. Any disabled module or sub-module
                will be locked in the school dashboard and inaccessible to school staff.
              </p>

              {/* Search Bar for Modules & Sub-modules */}
              <div className="sa-modules-search-bar">
                <Search size={16} color="#94a3b8" />
                <input
                  type="text"
                  placeholder="Filter modules or sub-modules by name (e.g., Attendance, Fee, Report Card, Visitor)..."
                  value={modulesFilterSearch}
                  onChange={(e) => setModulesFilterSearch(e.target.value)}
                />
                {modulesFilterSearch && (
                  <button
                    type="button"
                    onClick={() => setModulesFilterSearch("")}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#94a3b8",
                      cursor: "pointer",
                      fontSize: "14px",
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="sa-modules-header-bar">
                <div>
                  <h4>
                    Modules Active: {selectedSchool.enabledModules?.length || 0} of {ALL_MODULES.length}
                  </h4>
                  <p style={{ fontSize: "12px", color: "#94a3b8", margin: "2px 0 0 0" }}>
                    Sub-modules Active:{" "}
                    {Object.values(selectedSchool.enabledSubModules || {}).reduce(
                      (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
                      0
                    )}{" "}
                    of {TOTAL_SUB_MODULES}
                  </p>
                </div>
                <div className="sa-quick-toggle-actions">
                  <button
                    type="button"
                    className="sa-mini-btn"
                    onClick={selectAllModulesForSelected}
                  >
                    Enable All Features
                  </button>
                  <button
                    type="button"
                    className="sa-mini-btn"
                    onClick={clearAllModulesForSelected}
                  >
                    Disable All
                  </button>
                </div>
              </div>

              <div className="sa-modules-accordion-list">
                {ALL_MODULES.filter((mod) => {
                  if (!modulesFilterSearch) return true;
                  const q = modulesFilterSearch.toLowerCase();
                  if (mod.name.toLowerCase().includes(q) || mod.desc.toLowerCase().includes(q)) return true;
                  return (mod.subModules || []).some(
                    (s) => s.name.toLowerCase().includes(q) || s.key.toLowerCase().includes(q)
                  );
                }).map((mod) => {
                  const isEnabled = selectedSchool.enabledModules?.includes(mod.key);
                  const selectedSubs = selectedSchool.enabledSubModules?.[mod.key] || [];
                  const subCount = mod.subModules?.length || 0;
                  // If searching, auto-expand matching modules
                  const isExpanded = modulesFilterSearch
                    ? true
                    : !!expandedEditModules[mod.key];

                  return (
                    <div
                      key={mod.key}
                      className={`sa-module-accordion ${isEnabled ? "active" : ""}`}
                    >
                      <div
                        className="sa-module-accordion-header"
                        onClick={() => toggleExpandEdit(mod.key)}
                      >
                        <span className="sa-module-accordion-icon">{mod.icon}</span>
                        <div className="sa-module-accordion-info">
                          <div className="sa-module-accordion-title">
                            <span>{mod.name}</span>
                            <span
                              className={`sa-submodule-pill ${
                                selectedSubs.length > 0 ? "" : "muted"
                              }`}
                            >
                              {selectedSubs.length} / {subCount} Sub-modules Active
                            </span>
                          </div>
                          <div className="sa-module-accordion-desc">{mod.desc}</div>
                        </div>

                        <div
                          style={{ display: "flex", alignItems: "center", gap: "10px" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            className="sa-module-checkbox"
                            checked={isEnabled}
                            onChange={() => toggleModuleInSelected(mod.key)}
                            title={isEnabled ? "Disable this module" : "Enable this module"}
                          />
                          <button
                            type="button"
                            className="sa-accordion-expand-btn"
                            onClick={() => toggleExpandEdit(mod.key)}
                            title={isExpanded ? "Collapse sub-modules" : "Expand sub-modules"}
                          >
                            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="sa-submodules-container">
                          <div className="sa-submodules-toolbar">
                            <span className="sa-submodules-toolbar-label">
                              Sub-modules in {mod.name}:
                            </span>
                            <div className="sa-quick-toggle-actions">
                              <button
                                type="button"
                                className="sa-mini-btn"
                                onClick={() => selectAllSubModulesInSelected(mod.key)}
                              >
                                Select All
                              </button>
                              <button
                                type="button"
                                className="sa-mini-btn"
                                onClick={() => clearAllSubModulesInSelected(mod.key)}
                              >
                                Clear
                              </button>
                            </div>
                          </div>

                          <div className="sa-submodules-grid">
                            {(mod.subModules || []).map((sub) => {
                              const isSubActive = selectedSubs.includes(sub.key);
                              return (
                                <div
                                  key={sub.key}
                                  className={`sa-submodule-chip ${
                                    isSubActive ? "active" : ""
                                  }`}
                                  onClick={() => toggleSubModuleInSelected(mod.key, sub.key)}
                                >
                                  <input
                                    type="checkbox"
                                    className="sa-submodule-checkbox"
                                    checked={isSubActive}
                                    onChange={() =>
                                      toggleSubModuleInSelected(mod.key, sub.key)
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <span className="sa-submodule-chip-label">{sub.name}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="sa-modal-footer">
              <button
                type="button"
                className="sa-modal-btn-cancel"
                onClick={() => setModulesModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="sa-modal-btn-submit"
                onClick={handleSaveModules}
              >
                Save Feature & Sub-Module Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================
          MODAL 3: VIEW CREDENTIALS & RESET PASSWORD
      ========================================================== */}
      {credentialsModalOpen && selectedSchool && (
        <div className="sa-modal-backdrop" onClick={() => setCredentialsModalOpen(false)}>
          <div className="sa-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="sa-modal-header">
              <h3>
                <Key size={22} color="#f59e0b" /> School Access Credentials
              </h3>
              <button
                className="sa-modal-close-btn"
                onClick={() => setCredentialsModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="sa-modal-body">
              <div className="sa-credentials-box">
                <div className="sa-cred-row">
                  <span className="sa-cred-label">School Name</span>
                  <span className="sa-cred-value">{selectedSchool.schoolName}</span>
                </div>
                <div className="sa-cred-row">
                  <span className="sa-cred-label">Internal DB School ID</span>
                  <span className="sa-cred-value" style={{ color: "#38bdf8" }}>
                    {selectedSchool._id || selectedSchool.id}
                  </span>
                </div>
                <div className="sa-cred-row">
                  <span className="sa-cred-label">Campus ID (School Code)</span>
                  <span className="sa-cred-value" style={{ color: "#a5b4fc" }}>
                    {selectedSchool.campusId}
                  </span>
                </div>
                <div className="sa-cred-row">
                  <span className="sa-cred-label">Registered Login Email</span>
                  <span className="sa-cred-value">{selectedSchool.email}</span>
                </div>
                {selectedSchool.lastPassword && (
                  <div className="sa-cred-row">
                    <span className="sa-cred-label">Provisioned Password</span>
                    <span className="sa-cred-value" style={{ color: "#34d399" }}>
                      {selectedSchool.lastPassword}
                    </span>
                  </div>
                )}
                <div className="sa-cred-row">
                  <span className="sa-cred-label">Status</span>
                  <span
                    className="sa-cred-value"
                    style={{ color: selectedSchool.isActive ? "#34d399" : "#f87171" }}
                  >
                    {selectedSchool.isActive ? "Active (Can Log in)" : "Inactive (Log in Blocked)"}
                  </span>
                </div>

                <button
                  type="button"
                  className="sa-copy-banner-btn"
                  onClick={() => handleCopyCredentials(selectedSchool)}
                >
                  {copied ? (
                    <>
                      <Check size={18} /> Credentials Copied to Clipboard!
                    </>
                  ) : (
                    <>
                      <Copy size={18} /> Copy Credentials to Share
                    </>
                  )}
                </button>
              </div>

              {/* Reset Password Form */}
              <div style={{ marginTop: "20px" }}>
                <h4 style={{ fontSize: "15px", fontWeight: "700", marginBottom: "8px", color: "#e2e8f0" }}>
                  Reset School Password
                </h4>
                <p style={{ fontSize: "13px", color: "#94a3b8", margin: "0 0 12px 0" }}>
                  Enter a new password below to reset this school's login credentials.
                </p>
                <div style={{ display: "flex", gap: "10px" }}>
                  <input
                    type="text"
                    className="sa-modal-input"
                    placeholder="Enter new password (min 6 chars)"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                  />
                  <button
                    type="button"
                    className="sa-primary-action-btn"
                    style={{ whiteSpace: "nowrap" }}
                    onClick={handleResetPassword}
                  >
                    Update Password
                  </button>
                </div>
              </div>
            </div>

            <div className="sa-modal-footer">
              <button
                type="button"
                className="sa-modal-btn-cancel"
                onClick={() => setCredentialsModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================================
          MODAL 4: NOTICE MANAGEMENT
      ========================================================== */}
      {noticeModalOpen && selectedSchool && (
        <div className="sa-modal-backdrop" onClick={() => setNoticeModalOpen(false)}>
          <div className="sa-modal-card wide" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "640px" }}>
            <div className="sa-modal-header">
              <h3>📢 Notices — {selectedSchool.schoolName}</h3>
              <button className="sa-modal-close-btn" onClick={() => setNoticeModalOpen(false)}>✕</button>
            </div>
            <div className="sa-modal-body">
              {/* Compose New Notice */}
              <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "12px", padding: "16px", marginBottom: "20px" }}>
                <div style={{ fontWeight: "700", color: "#a5b4fc", marginBottom: "12px", fontSize: "13px" }}>✏️ Send New Notice</div>
                <div className="sa-form-grid-2" style={{ marginBottom: "10px" }}>
                  <div className="sa-form-field">
                    <label>Title (optional)</label>
                    <input className="sa-modal-input" placeholder="e.g. Fee Reminder" value={noticeForm.title}
                      onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })} />
                  </div>
                  <div className="sa-form-field">
                    <label>Type</label>
                    <select className="sa-modal-input" value={noticeForm.type}
                      onChange={(e) => setNoticeForm({ ...noticeForm, type: e.target.value })}>
                      <option value="info">ℹ️ Info</option>
                      <option value="warning">⚠️ Warning</option>
                      <option value="danger">🚨 Danger / Urgent</option>
                      <option value="success">✅ Success / Good News</option>
                    </select>
                  </div>
                </div>
                <div className="sa-form-field" style={{ marginBottom: "12px" }}>
                  <label>Message <span className="required">*</span></label>
                  <textarea className="sa-modal-input" rows={3} placeholder="Type your notice message here..."
                    value={noticeForm.message}
                    onChange={(e) => setNoticeForm({ ...noticeForm, message: e.target.value })}
                    style={{ resize: "vertical", fontFamily: "inherit" }} />
                </div>
                <button onClick={handleAddNotice}
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", borderRadius: "8px", padding: "9px 20px", fontWeight: "600", cursor: "pointer", fontSize: "13px" }}>
                  📤 Send Notice
                </button>
              </div>

              {/* Existing Notices */}
              <div style={{ fontWeight: "700", color: "#94a3b8", fontSize: "12px", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Existing Notices ({schoolNotices.length})
              </div>
              {noticeLoading ? (
                <div style={{ padding: "8px 0" }}>
                  <SkeletonList count={3} theme="dark" />
                </div>
              ) : schoolNotices.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px", color: "#64748b", fontSize: "13px" }}>No notices sent yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "260px", overflowY: "auto" }}>
                  {schoolNotices.map((notice) => {
                    const typeColors = { info: "#3b82f6", warning: "#f59e0b", danger: "#ef4444", success: "#22c55e" };
                    const typeIcons = { info: "ℹ️", warning: "⚠️", danger: "🚨", success: "✅" };
                    return (
                      <div key={notice._id} style={{
                        display: "flex", alignItems: "flex-start", gap: "10px",
                        background: notice.isActive ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${notice.isActive ? typeColors[notice.type] + "55" : "rgba(255,255,255,0.08)"}`,
                        borderRadius: "10px", padding: "10px 12px",
                        opacity: notice.isActive ? 1 : 0.5
                      }}>
                        <span style={{ fontSize: "16px" }}>{typeIcons[notice.type] || "ℹ️"}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {notice.title && <div style={{ fontWeight: "700", color: "#e2e8f0", fontSize: "13px" }}>{notice.title}</div>}
                          <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "2px" }}>{notice.message}</div>
                          <div style={{ fontSize: "11px", color: "#475569", marginTop: "4px" }}>
                            {new Date(notice.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                            &nbsp;•&nbsp;{notice.isActive ? <span style={{ color: "#22c55e" }}>Active</span> : <span style={{ color: "#ef4444" }}>Hidden</span>}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                          <button onClick={() => handleToggleNotice(notice._id)}
                            style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "6px", padding: "4px 8px", cursor: "pointer", fontSize: "11px", color: "#94a3b8" }}
                            title={notice.isActive ? "Hide notice" : "Show notice"}>
                            {notice.isActive ? "Hide" : "Show"}
                          </button>
                          <button onClick={() => handleDeleteNotice(notice._id)}
                            style={{ background: "rgba(239,68,68,0.12)", border: "none", borderRadius: "6px", padding: "4px 8px", cursor: "pointer", fontSize: "11px", color: "#f87171" }}
                            title="Delete notice">
                            ✕
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="sa-modal-footer">
              <button type="button" className="sa-modal-btn-cancel" onClick={() => setNoticeModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;