import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { superAdminService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Shield, Eye, EyeOff, LogIn, Sparkles, AlertCircle, ArrowLeft } from "lucide-react";
import "./superAdminLogin.css";

const SuperAdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await superAdminService.login({ email, password });
      if (res.data.success) {
        const adminRole = res.data.admin?.role || res.data.role || "superAdmin";
        const adminData = res.data.admin || res.data.user || {
          email,
          role: adminRole,
          name: "Super Admin",
        };

        // Context API login
        login(
          {
            accessToken: res.data.accessToken,
            token: res.data.accessToken,
            role: adminRole,
            user: adminData,
            name: adminData.name || "Super Admin",
            email: adminData.email || email,
          },
          { isSuperAdmin: true }
        );

        // Keep existing legacy localStorage keys
        localStorage.setItem("superAdminToken", res.data.accessToken);
        localStorage.setItem("superAdminUser", JSON.stringify(adminData));
        localStorage.setItem("role", adminRole);
        localStorage.setItem("userRole", adminRole);
        localStorage.setItem("userName", adminData.name || "Super Admin");
        localStorage.setItem("user", JSON.stringify(adminData));
        localStorage.setItem("userInfo", JSON.stringify(adminData));

        navigate("/super-admin");
      } else {
        setError(res.data.message || "Login failed");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to connect to server. Please ensure backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail("admin@classora.com");
    setPassword("SuperAdmin@2026");
    setError("");
  };

  return (
    <div className="sa-login-container">
      <div className="sa-login-card">
        <div className="sa-badge-crown">
          <Shield size={14} /> CLASSORA MASTER CONTROL
        </div>

        <div className="sa-login-header">
          <h1>Super Admin Portal</h1>
          <p>Multi-School Administration & Central Governance</p>
        </div>

        {error && (
          <div className="sa-alert sa-alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="sa-form-group">
            <label>Master Administrator Email</label>
            <div className="sa-input-wrapper">
              <input
                type="email"
                className="sa-input"
                placeholder="admin@classora.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="sa-form-group">
            <label>Master Security Password</label>
            <div className="sa-input-wrapper">
              <input
                type={showPass ? "text" : "password"}
                className="sa-input sa-input-pass"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="sa-toggle-pass-btn"
                onClick={() => setShowPass(!showPass)}
                title={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="sa-login-btn" disabled={loading}>
            {loading ? (
              "Authenticating Master..."
            ) : (
              <>
                <LogIn size={18} /> Authorize & Access Portal
              </>
            )}
          </button>
        </form>

        <div className="sa-quick-demo">
          <div className="sa-quick-demo-info">
            <strong>Default Super Admin</strong>
            <div>admin@classora.com / SuperAdmin@2026</div>
          </div>
          <button
            type="button"
            className="sa-quick-demo-btn"
            onClick={fillDemoCredentials}
          >
            <Sparkles size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
            Auto Fill
          </button>
        </div>

        <div className="sa-switch-link">
          <button type="button" onClick={() => navigate("/")}>
            <ArrowLeft size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
            Back to School Campus Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLogin;
