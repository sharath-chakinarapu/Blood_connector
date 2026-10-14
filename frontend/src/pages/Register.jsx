import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../auth/useAuth";
import { apiErrorMessage, bloodGroups, toApiBloodGroup } from "../api/domain";

export default function Register() {
  const navigate = useNavigate();
  const { saveSession } = useAuth();
  const [locationStatus, setLocationStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", email: "", password: "", role: "DONOR", bloodGroup: "O+",
    hospitalName: "", address: "", latitude: "", longitude: "", phone: "",
  });

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Location is not supported by this browser. Enter coordinates below.");
      return;
    }
    setLocationStatus("Detecting current location…");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setForm((current) => ({
          ...current,
          latitude: coords.latitude.toFixed(6),
          longitude: coords.longitude.toFixed(6),
        }));
        setLocationStatus("Location added. You can adjust it before submitting.");
      },
      () => setLocationStatus("Could not access location. Check browser permission or enter coordinates manually."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        bloodGroup: form.role === "DONOR" ? toApiBloodGroup(form.bloodGroup) : null,
        phone: form.phone.trim(),
        hospitalName: form.role === "HOSPITAL" ? form.hospitalName.trim() : null,
        address: form.address.trim() || null,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      };
      const { data } = await API.post("/auth/register", payload);
      const session = saveSession(data);
      navigate(session.user.role === "HOSPITAL" ? "/dashboard" : "/find-donors", { replace: true });
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Registration failed. Review your details and try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <aside className="auth-aside">
        <div className="auth-aside__content">
          <span className="auth-aside__mark" aria-hidden="true">+</span>
          <p className="eyebrow">A COMMUNITY OF CARE</p>
          <h1>Join a more connected response to blood needs.</h1>
          <p>Create a donor or hospital account. Your role determines which tools and information you can access.</p>
        </div>
      </aside>
      <section className="auth-panel auth-panel--register">
        <p className="eyebrow">GET STARTED</p>
        <h1>Create your account</h1>
        <p>Complete your details to securely join Blood Connector.</p>
        <form className="auth-form" onSubmit={handleRegister}>
          <div className="form-grid">
            <label className="form-span-2">Full name
              <input required maxLength="120" autoComplete="name" value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Your name" />
            </label>
            <label className="form-span-2">Email address
              <input required type="email" maxLength="254" autoComplete="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="you@example.com" />
            </label>
            <label className="form-span-2">Password
              <input required type="password" minLength="8" maxLength="72" autoComplete="new-password" value={form.password} onChange={(event) => updateField("password", event.target.value)} placeholder="At least 8 characters" />
              <span className="form-help">Use at least 8 characters.</span>
            </label>
            <label className="form-span-2">Account type
              <select value={form.role} onChange={(event) => updateField("role", event.target.value)}>
                <option value="DONOR">Blood donor</option>
                <option value="HOSPITAL">Hospital</option>
              </select>
            </label>
            {form.role === "HOSPITAL" ? (
              <label className="form-span-2">Hospital name
                <input required maxLength="160" value={form.hospitalName} onChange={(event) => updateField("hospitalName", event.target.value)} placeholder="Hospital or clinic name" />
              </label>
            ) : (
              <label className="form-span-2">Blood group
                <select value={form.bloodGroup} onChange={(event) => updateField("bloodGroup", event.target.value)}>
                  {bloodGroups.map((group) => <option key={group}>{group}</option>)}
                </select>
              </label>
            )}
            <label className="form-span-2">Phone number
              <input required maxLength="30" autoComplete="tel" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="Contact number" />
            </label>
            <label className="form-span-2">Address <span className="form-help">(optional)</span>
              <input maxLength="500" autoComplete="street-address" value={form.address} onChange={(event) => updateField("address", event.target.value)} placeholder="Street, city" />
            </label>
            <div className="form-span-2">
              <div className="form-actions">
                <button className="button button--secondary" type="button" onClick={handleUseLocation}>Use my location</button>
                <span className="form-help" role="status">{locationStatus || "Location coordinates are needed for nearby matching."}</span>
              </div>
            </div>
            <label>Latitude
              <input required type="number" min="-90" max="90" step="any" value={form.latitude} onChange={(event) => updateField("latitude", event.target.value)} placeholder="19.0760" />
            </label>
            <label>Longitude
              <input required type="number" min="-180" max="180" step="any" value={form.longitude} onChange={(event) => updateField("longitude", event.target.value)} placeholder="72.8777" />
            </label>
          </div>
          {error && <div className="alert-card alert-card--error" role="alert">{error}</div>}
          <button className="button button--primary button--large" type="submit" disabled={submitting}>
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>
        <p className="auth-footnote">Already have an account? <Link to="/login">Sign in</Link></p>
      </section>
    </main>
  );
}
