import React, { useState } from "react";
import axios from "axios";
import "./login.css";

function Login() {
  const [campusId, setCampusId] = useState(localStorage.getItem("rememberCampusId") || "");
  const [email, setEmail] = useState(localStorage.getItem("rememberEmail") || "");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/school/login", {
        campusId,
        email,
        password
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userName", res.data.name);
      localStorage.setItem("schoolId", res.data.schoolId);

      if (rememberMe) {
        localStorage.setItem("rememberCampusId", campusId);
        localStorage.setItem("rememberEmail", email);
      }

      window.location.href = "/dashboard";
    } catch (err) {
      console.log("Login Error:", err.response?.data || err.message);
alert(err.response?.data?.msg || err.message || "Login Failed ❌");
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

    alert("Password reset demo successful. Backend API baad me connect karenge.");
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
        <p className="subtitle">Multi-School ERP Login</p>

        <label>Campus ID</label>
        <input
          type="text"
          placeholder="Example: ABC123"
          value={campusId}
          onChange={(e) => setCampusId(e.target.value)}
        />

        <label>Email Address</label>
        <input
          type="email"
          placeholder="Registered school email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>Password</label>
        <div className="password-box">
          <input
            type={showPass ? "text" : "password"}
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span onClick={() => setShowPass(!showPass)}>
            {showPass ? "🙈" : "👁️"}
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

          <button className="link-btn" onClick={() => setResetOpen(true)}>
            Forgot Password?
          </button>
        </div>

        <button className="login-btn" onClick={handleLogin}>
          Login
        </button>

        <p className="support">Contact for query: 8840248644</p>
      </div>

      {resetOpen && (
        <div className="modal-bg">
          <div className="reset-box">
            <button className="close-btn" onClick={() => setResetOpen(false)}>×</button>
            <h2>Reset Password</h2>

            <input
              type="email"
              placeholder="Enter registered email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
            />

            {!otpSent ? (
              <button className="login-btn" onClick={sendOtp}>Send OTP</button>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Enter OTP"
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
                  Reset Password
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