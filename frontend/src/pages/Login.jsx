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
    setError("");
    try {
      const response = await API.post("/auth/login", form);
      const session = saveSession(response.data);
      const role = fromApiRole(session.user.role);
      const requestedPath = location.state?.from?.pathname;
      navigate(requestedPath || (role === "hospital" ? "/dashboard" : "/find-donors"), { replace: true });
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Login failed. Check your email and password."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <aside className="auth-aside">
        <div className="auth-aside__content">
          <span className="auth-aside__mark" aria-hidden="true">+</span>
          <p className="eyebrow">BLOOD CONNECTOR</p>
          <h1>Better coordination begins with a trusted connection.</h1>
          <p>Sign in to manage your donor or hospital account and continue securely.</p>
        </div>
      </aside>
      <section className="auth-panel">
        <p className="eyebrow">WELCOME BACK</p>
        <h1>Sign in</h1>
        <p>Use the email address linked to your account.</p>
        <form className="auth-form" onSubmit={handleLogin}>
          <label>
            Email address
            <input
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="you@example.com"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="Enter your password"
            />
          </label>
          {error && <div className="alert-card alert-card--error" role="alert">{error}</div>}
          <button className="button button--primary button--large" type="submit" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in securely"}
          </button>
        </form>
        <p className="auth-footnote">New to Blood Connector? <Link to="/register">Create an account</Link></p>
      </section>
    </main>
  );
}
