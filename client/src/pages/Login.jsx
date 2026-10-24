import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { schoolService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Shield, AlertTriangle, Eye, EyeOff, LogIn } from "lucide-react";
import "./login.css";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [campusId, setCampusId] = useState(
    localStorage.getItem("rememberCampusId") || ""
  );
  const [email, setEmail] = useState(
    localStorage.getItem("rememberEmail") || ""
  );
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(
    Boolean(localStorage.getItem("rememberCampusId"))
  );
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleLogin = async (e) => {
    if (e) e.preventDefault();

    if (!campusId || !email || !password) {
      setErrorMsg("Please fill in Campus ID, Email, and Password.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await schoolService.login({
        campusId: campusId.toUpperCase().trim(),
        email: email.toLowerCase().trim(),
        password,
      });

      if (res.data.success) {
        // Store via AuthContext (saves role, user info, tokens, modules, etc. to localStorage & context state)
        login(res.data);

        // Explicitly maintain existing localStorage keys for 100% backward compatibility
        const token = res.data.token || res.data.accessToken;
        const role = res.data.role || res.data.user?.role || "schoolAdmin";
        const userName = res.data.name || res.data.schoolName;

        localStorage.setItem("token", token);
        localStorage.setItem("role", role);
        localStorage.setItem("userRole", role);
        localStorage.setItem("userName", userName);
        localStorage.setItem("schoolId", res.data.schoolId);
        localStorage.setItem("campusId", res.data.campusId);

        if (res.data.user) {
          localStorage.setItem("user", JSON.stringify(res.data.user));
          localStorage.setItem("userInfo", JSON.stringify(res.data.user));
        }

        if (res.data.enabledModules) {
          localStorage.setItem(
            "enabledModules",
            JSON.stringify(res.data.enabledModules)
          );
        }

        if (res.data.enabledSubModules) {
          localStorage.setItem(
            "enabledSubModules",
            JSON.stringify(res.data.enabledSubModules)
          );
        }

        if (rememberMe) {
          localStorage.setItem("rememberCampusId", campusId.toUpperCase().trim());
          localStorage.setItem("rememberEmail", email.toLowerCase().trim());
        } else {
          localStorage.removeItem("rememberCampusId");
          localStorage.removeItem("rememberEmail");
        }

        navigate("/dashboard");
      } else {
        setErrorMsg(res.data.message || res.data.msg || "Login failed");
      }
    } catch (err) {
      console.error("Login Error:", err.response?.data || err.message);
      if (err.response?.data?.isDeactivated) {
        setErrorMsg(
          "🛑 Access Denied: This school account has been deactivated by Super Admin. Please contact Classora Support."
        );
      } else {
        setErrorMsg(
          err.response?.data?.message ||
            err.response?.data?.msg ||
            "Login failed. Please check your credentials or server connection."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = () => {
    if (!resetEmail) {
      alert("Please enter registered email");
      return;
    }
    setOtpSent(true);
    alert("Demo OTP sent: 123456");
  };

  const resetPassword = () => {
    if (otp !== "123456") {
      alert("Invalid OTP");
      return;
    }
    if (!newPassword) {
      alert("Enter new password");
      return;
    }
    alert("Demo password reset simulated. Contact Super Admin to reset your production school password.");
    setResetOpen(false);
    setOtpSent(false);
    setOtp("");
    setNewPassword("");
    setResetEmail("");
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="logo-circle">C</div>
        <h1>Classora</h1>
        <p className="subtitle">School Management ERP Portal</p>

        {errorMsg && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "12px",
              background: "#fee2e2",
              border: "1px solid #f87171",
              color: "#991b1b",
              fontSize: "13px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
              lineHeight: "1.4",
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: "2px" }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <label>Campus ID / School Code</label>
          <input
            type="text"
            placeholder="e.g. SCH001"
            value={campusId}
            onChange={(e) => setCampusId(e.target.value.toUpperCase())}
            required
          />

          <label>Official School Email</label>
          <input
            type="email"
            placeholder="e.g. admin@school.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label>Password</label>
          <div className="password-box">
            <input
              type={showPass ? "text" : "password"}
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span
              onClick={() => setShowPass(!showPass)}
              title={showPass ? "Hide password" : "Show password"}
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </span>
          </div>

          <div className="login-options">
            <label className="remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              Remember me
            </label>

            <button
              type="button"
              className="link-btn"
              onClick={() => setResetOpen(true)}
            >
              Forgot Password?
            </button>
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            {loading ? (
              "Authenticating School..."
            ) : (
              <>
                <LogIn size={18} /> Secure Login
              </>
            )}
          </button>
        </form>

        <div
          style={{
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: "1px dashed #e2e8f0",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "12px", color: "#64748b" }}>Master Administrator?</span>
          <button
            type="button"
            onClick={() => navigate("/super-admin/login")}
            style={{
              background: "none",
              border: "none",
              color: "#4f46e5",
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <Shield size={13} /> Super Admin Portal →
          </button>
        </div>

        <p className="support">Technical Support: 8840248644</p>
      </div>

      {resetOpen && (
        <div className="modal-bg">
          <div className="reset-box">
            <button className="close-btn" onClick={() => setResetOpen(false)}>
              ×
            </button>
            <h2>Reset School Password</h2>
            <p style={{ fontSize: "13px", color: "#64748b", textAlign: "center", margin: "0 0 16px 0" }}>
              Enter your registered school email address to request password assistance.
            </p>

            <input
              type="email"
              placeholder="Enter registered school email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
            />

            {!otpSent ? (
              <button className="login-btn" onClick={sendOtp}>
                Send Verification OTP
              </button>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Enter OTP (Use 123456)"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />

                <input
                  type="password"
                  placeholder="New password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />

                <button className="login-btn" onClick={resetPassword}>
                  Confirm New Password
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;