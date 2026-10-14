import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../auth/useAuth";
import { apiErrorMessage, fromApiRole } from "../api/domain";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { saveSession } = useAuth();

  const handleLogin = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const res = await API.post("/auth/login", form);
      const session = saveSession(res.data);
      setError("");
      const role = fromApiRole(session.user.role);
      const requestedPath = location.state?.from?.pathname;
      navigate(requestedPath || (role === "hospital" ? "/dashboard" : "/find-donors"), { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, "Login failed. Check your email and password."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: "#fdf2f2", minHeight: "100vh", padding: 40 }}>
      <div style={{ maxWidth: 420, margin: "0 auto", padding: 28, background: "white", borderRadius: 16, boxShadow: "0 20px 40px rgba(15, 23, 42, 0.08)" }}>
        <h2 style={{ marginBottom: 20, color: "#991b1b" }}>Login to BloodBridge</h2>
        <form onSubmit={handleLogin}>
        <label style={{ display: "block", marginBottom: 8, color: "#334155" }}>Email</label>
        <input
          type="email"
          required
          style={{ width: "100%", padding: 14, marginBottom: 16, borderRadius: 12, border: "1px solid #cbd5e1" }}
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="your@email.com"
        />
        <label style={{ display: "block", marginBottom: 8, color: "#334155" }}>Password</label>
        <input
          style={{ width: "100%", padding: 14, marginBottom: 16, borderRadius: 12, border: "1px solid #cbd5e1" }}
          type="password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Enter your password"
        />
        <button
          type="submit"
          disabled={submitting}
          style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", background: "#b91c1c", color: "white", fontWeight: 600, cursor: "pointer" }}
        >
          {submitting ? "Signing in…" : "Login"}
        </button>
        {error && <p style={{ color: "#b91c1c", marginTop: 16 }}>{error}</p>}
        </form>
        <p style={{ marginTop: 20, textAlign: "center", color: "#475569" }}>
          New here? <Link to="/register" style={{ color: "#b91c1c" }}>Create an account</Link>
        </p>
      </div>
    </div>
  );
}
