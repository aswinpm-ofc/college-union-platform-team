import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../../../services/auth/authService";
import { academicsService } from "../../../services/api/academicsService";
import BrandMark from "../../../components/ui/BrandMark";

export default function SignUpPage({ onSignUp }) {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [semester, setSemester] = useState("");
  const [departments, setDepartments] = useState([]);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    academicsService.getApprovedDepartments().then((res) => {
      if (res?.ok && Array.isArray(res.data)) {
        setDepartments(res.data);
      }
    });
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your college email.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      const result = await authService.signUp({
        email,
        password,
        fullName,
        studentId,
        departmentId,
        semester,
      });

      if (!result?.ok) {
        setError(result?.error || "Unable to create your account. Please try again.");
        return;
      }

      if (result.needsEmailConfirmation) {
        setSuccessMessage("Account created! Check your email to confirm it, then sign in.");
        return;
      }

      onSignUp?.(result.user);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Unable to create your account. Please try again.");
    } finally {
      setLoading(false);
    }
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
            <span className="eyebrow light">JOIN UNIONHUB</span>
            <h1>Make your account.</h1>
            <p>
              Register with your college email to upload academic material, track grievances, register for
              events, and get campus updates in one place.
            </p>
          </div>

          <div className="feature-list">
            <div>
              <strong>One account, everything</strong>
              <span>Academics, events, grievances, welfare</span>
            </div>
            <div>
              <strong>Your uploads, tracked</strong>
              <span>See status on everything you submit</span>
            </div>
            <div>
              <strong>Stay in the loop</strong>
              <span>Announcements and emergency alerts</span>
            </div>
          </div>
        </div>

        <div className="login-card">
          <div className="login-header">
            <div>
              <span className="eyebrow">SIGN UP</span>
              <h2>Create your account</h2>
            </div>
            <div className="status-pill">Secure portal</div>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="field-row">
              <label>
                <span>Full name</span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Aswin P."
                  disabled={loading}
                />
              </label>

              <label>
                <span>Student ID (optional)</span>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. CSE2024042"
                  disabled={loading}
                />
              </label>
            </div>

            <label>
              <span>College email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.edu"
                disabled={loading}
              />
            </label>

            <div className="field-row">
              <label>
                <span>Department (optional)</span>
                <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} disabled={loading}>
                  <option value="">Select department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Semester (optional)</span>
                <select value={semester} onChange={(e) => setSemester(e.target.value)} disabled={loading}>
                  <option value="">Select semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>
                      Semester {n} (S{n})
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="field-row">
              <label>
                <span>Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  disabled={loading}
                />
              </label>

              <label>
                <span>Confirm password</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  disabled={loading}
                />
              </label>
            </div>

            {error && <div className="form-error">{error}</div>}
            {successMessage && <div className="form-success">{successMessage}</div>}

            <button type="submit" className="primary login-btn" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <div className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
