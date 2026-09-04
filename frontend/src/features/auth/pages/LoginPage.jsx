import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authService } from "../../../services/auth/authService";
import BrandMark from "../../../components/ui/BrandMark";

const quickUsers = [
  { label: "Student", email: "student@college.local", role: "Student" },
  { label: "Maintainer", email: "maintainer@college.local", role: "Maintainer" },
  { label: "Admin", email: "admin@college.local", role: "Admin" },
];

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("student@college.local");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await authService.login(email, password);
      if (!result?.user) {
        throw new Error("Login failed");
      }

      onLogin?.(result.user);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const useQuickLogin = (nextEmail) => {
    setEmail(nextEmail);
    setPassword("123456");
    setError("");
  };

  return (
    <div className="login-shell">
      <div className="login-panel">
        <div className="login-hero">
          <div className="brand header-block">
            <div className="brandmark"><BrandMark size={24} /></div>
            <div>
              <b>UnionHub</b>
              <small>College Union</small>
            </div>
          </div>

          <div className="hero-copy">
            <span className="eyebrow light">WELCOME BACK</span>
            <h1>Campus life, connected.</h1>
            <p>
              Access notices, grievances, academic resources, events, and platform operations from one place.
            </p>
          </div>

          <div className="feature-list">
            <div>
              <strong>Academic access</strong>
              <span>Materials and moderation</span>
            </div>
            <div>
              <strong>Union updates</strong>
              <span>Announcements and events</span>
            </div>
            <div>
              <strong>Student support</strong>
              <span>Grievances and welfare</span>
            </div>
          </div>
        </div>

        <div className="login-card">
          <div className="login-header">
            <div>
              <span className="eyebrow">SIGN IN</span>
              <h2>Welcome back</h2>
            </div>
            <div className="status-pill">Secure portal</div>
          </div>

          <div className="quick-login-row">
            {quickUsers.map((user) => (
              <button
                key={user.email}
                type="button"
                className={email === user.email ? "quick-role active" : "quick-role"}
                onClick={() => useQuickLogin(user.email)}
              >
                {user.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <label>
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.edu"
              />
            </label>

            <label>
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
            </label>

            {error && <div className="form-error">{error}</div>}

            <button type="submit" className="primary login-btn" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="demo-hint">
            Demo access: <strong>student@college.local</strong> · <strong>maintainer@college.local</strong> · <strong>admin@college.local</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
