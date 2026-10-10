import React, { useState } from "react";

function AuthView({ loading, onLogin, onRegister }) {
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setLocalError("");
    if (!authEmail.trim()) {
      setLocalError("Email is required");
      return;
    }
    if (!authPassword) {
      setLocalError("Password is required");
      return;
    }
    if (authPassword.length < 6) {
      setLocalError("Password must be at least 6 characters long");
      return;
    }
    if (authPassword !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    onRegister(authEmail.trim(), authPassword, () => {
      setAuthMode("login");
      setAuthPassword("");
      setConfirmPassword("");
    });
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setLocalError("");
    if (!authEmail.trim() || !authPassword) {
      setLocalError("Email and password are required");
      return;
    }
    onLogin(authEmail.trim(), authPassword);
  };

  return (
    <div className="auth-card">
      <div className="auth-tabs">
        <button
          className={`auth-tab ${authMode === "login" ? "active" : ""}`}
          onClick={() => {
            setAuthMode("login");
            setLocalError("");
          }}
        >
          Login
        </button>
        <button
          className={`auth-tab ${authMode === "register" ? "active" : ""}`}
          onClick={() => {
            setAuthMode("register");
            setLocalError("");
          }}
        >
          Register
        </button>
      </div>

      {localError && <div className="alert alert-error">{localError}</div>}

      {authMode === "login" ? (
        <form className="auth-form" onSubmit={handleLoginSubmit}>
          <h2>Welcome Back</h2>
          <p className="auth-subtitle">Log in to manage your private tasks</p>
          <div className="input-group">
            <label htmlFor="login-email">Email Address</label>
            <input
              id="login-email"
              type="email"
              placeholder="name@example.com"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              placeholder="Enter your password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Authenticating..." : "Login"}
          </button>
        </form>
      ) : (
        <form className="auth-form" onSubmit={handleRegisterSubmit}>
          <h2>Create an Account</h2>
          <p className="auth-subtitle">Register to start organizing your tasks</p>
          <div className="input-group">
            <label htmlFor="reg-email">Email Address</label>
            <input
              id="reg-email"
              type="email"
              placeholder="name@example.com"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="reg-password">Password</label>
            <input
              id="reg-password"
              type="password"
              placeholder="At least 6 characters"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="reg-confirm">Confirm Password</label>
            <input
              id="reg-confirm"
              type="password"
              placeholder="Repeat password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Creating Account..." : "Register"}
          </button>
        </form>
      )}
    </div>
  );
}

export default AuthView;
