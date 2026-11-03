import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Shield,
  LayoutDashboard,
  School,
  Layers,
  CreditCard,
  Receipt,
  Wallet,
  Activity,
  Radio,
  Settings,
  ChevronRight,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  LogOut,
} from "lucide-react";
import { superAdminService } from "../../services/api";
import "../superAdminDashboard.css";
import "./superAdminShell.css";

const NAV = [
  { to: "/super-admin", label: "Dashboard", icon: LayoutDashboard, end: true, title: "Dashboard" },
  { to: "/super-admin/schools", label: "Schools", icon: School, title: "Schools" },
  { to: "/super-admin/modules", label: "Modules & Permissions", icon: Layers, title: "Modules & Permissions" },
  { to: "/super-admin/login-status", label: "Login Status", icon: Radio, title: "Login Status" },
  {
    label: "Subscription & Billing",
    icon: Wallet,
    children: [
      { to: "/super-admin/billing", label: "Subscriptions", icon: CreditCard, title: "Subscriptions" },
      { to: "/super-admin/payments", label: "Payments & Invoices", icon: Receipt, title: "Payments & Invoices" },
    ],
  },
  {
    label: "Platform",
    icon: Settings,
    children: [
      { to: "/super-admin/activity", label: "Activity Log", icon: Activity, title: "Activity Log" },
      { to: "/super-admin/settings", label: "Settings & Announcements", icon: Settings, title: "Settings & Announcements" },
    ],
  },
];

const flatten = NAV.flatMap((item) => (item.children ? item.children.map((c) => ({ ...c, group: item.label })) : [item]));

const SuperAdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("saSidebarCollapsed") === "1";
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState({ "Subscription & Billing": true, Platform: true });

  const adminUser = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("superAdminUser") || "null");
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  const current = flatten.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to))) || flatten[0];

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      try {
        localStorage.setItem("saSidebarCollapsed", prev ? "0" : "1");
      } catch {
        /* storage unavailable */
      }
      return !prev;
    });
  };

  const handleLogout = async () => {
    try {
      await superAdminService.logout();
    } catch {
      /* token may already be invalid */
    }
    localStorage.removeItem("superAdminToken");
    localStorage.removeItem("superAdminUser");
    navigate("/super-admin/login");
  };

  const initial = (adminUser?.name || adminUser?.email || "S").charAt(0).toUpperCase();

  return (
    <div className={`sa2-shell ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
      {mobileOpen && <div className="sa2-scrim" onClick={() => setMobileOpen(false)} />}

      <aside className="sa2-sidebar" aria-label="Super Admin navigation">
        <div className="sa2-brand">
          <span className="sa2-brand-mark">
            <Shield size={20} />
          </span>
          <div className="sa2-brand-text">
            <strong>Classora ERP</strong>
            <span>Super Admin</span>
          </div>
        </div>

        <nav className="sa2-nav">
          {NAV.map((item) => {
            const Icon = item.icon;
            if (!item.children) {
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `sa2-nav-item ${isActive ? "active" : ""}`}
                  title={item.label}
                >
                  <Icon size={18} />
                  <span className="sa2-nav-label">{item.label}</span>
                </NavLink>
              );
            }
            const open = openGroups[item.label];
            const groupActive = item.children.some((c) => location.pathname.startsWith(c.to));
            return (
              <div key={item.label}>
                <button
                  className={`sa2-nav-item ${groupActive ? "active" : ""}`}
                  onClick={() => setOpenGroups((prev) => ({ ...prev, [item.label]: !prev[item.label] }))}
                  aria-expanded={!!open}
                  title={item.label}
                >
                  <Icon size={18} />
                  <span className="sa2-nav-label">{item.label}</span>
                  <ChevronRight size={14} className={`sa2-nav-caret ${open ? "open" : ""}`} />
                </button>
                {(open || collapsed) && (
                  <div className="sa2-nav-sub">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      return (
                        <NavLink
                          key={child.to}
                          to={child.to}
                          className={({ isActive }) => `sa2-nav-item ${isActive ? "active" : ""}`}
                          title={child.label}
                        >
                          <ChildIcon size={16} />
                          <span className="sa2-nav-label">{child.label}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="sa2-sidebar-foot">
          <button className="sa2-nav-item" onClick={toggleCollapsed} title={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            <span className="sa2-nav-label">Collapse</span>
          </button>
        </div>
      </aside>

      <div className="sa2-main">
        <header className="sa2-topbar">
          <button className="sa2-btn icon sa2-mobile-toggle" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu size={18} />
          </button>

          <div className="sa2-topbar-title">
            <div className="sa2-crumbs">
              <Link to="/super-admin">Super Admin</Link>
              {current.group && (
                <>
                  <ChevronRight size={12} />
                  <span>{current.group}</span>
                </>
              )}
              {current.to !== "/super-admin" && (
                <>
                  <ChevronRight size={12} />
                  <span>{current.title}</span>
                </>
              )}
            </div>
            <h1>{current.title}</h1>
          </div>

          <div className="sa2-profile">
            <button className="sa2-profile-btn" onClick={() => setMenuOpen((v) => !v)} aria-haspopup="menu" aria-expanded={menuOpen}>
              <span className="sa2-avatar">{initial}</span>
              <span className="sa2-profile-name">{adminUser?.email || "Super Admin"}</span>
              <ChevronDown size={14} />
            </button>
            {menuOpen && (
              <div className="sa2-menu" role="menu">
                <div className="sa2-menu-info">
                  <strong>{adminUser?.name || "Super Admin"}</strong>
                  <span>{adminUser?.email || "Platform administrator"}</span>
                </div>
                <button className="danger" onClick={handleLogout} role="menuitem">
                  <LogOut size={16} /> Log out
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="sa2-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
