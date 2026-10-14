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
    name: "",
    email: "",
    password: "",
    role: "DONOR",
    bloodGroup: "O+",
    hospitalName: "",
    address: "",
    latitude: "",
    longitude: "",
    phone: "",
  });

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation is not supported in this browser.");
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
        setLocationStatus("Location detected successfully.");
      },
      (locationError) => setLocationStatus(`Location error: ${locationError.message}`),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setSubmitting(true);
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
    <div style={{ background: "#fdf2f2", minHeight: "100vh", padding: 40 }}>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: 28, background: "white", borderRadius: 16, boxShadow: "0 20px 40px rgba(15, 23, 42, 0.08)" }}>
        <h2 style={{ marginBottom: 24, color: "#991b1b" }}>Create your BloodBridge account</h2>
        <form onSubmit={handleRegister} style={{ display: "grid", gap: 16 }}>
          <label style={{ display: "grid", gap: 8, color: "#334155" }}>
            Full Name
            <input required maxLength="120" value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="Enter your name" />
          </label>
          <label style={{ display: "grid", gap: 8, color: "#334155" }}>
            Email
            <input required type="email" maxLength="254" value={form.email} onChange={(event) => updateField("email", event.target.value)} placeholder="your@email.com" />
          </label>
          <label style={{ display: "grid", gap: 8, color: "#334155" }}>
            Password (at least 8 characters)
            <input required type="password" minLength="8" maxLength="72" value={form.password} onChange={(event) => updateField("password", event.target.value)} placeholder="Create a password" />
          </label>
          <label style={{ display: "grid", gap: 8, color: "#334155" }}>
            Register as
            <select value={form.role} onChange={(event) => updateField("role", event.target.value)}>
              <option value="DONOR">Donor</option>
              <option value="HOSPITAL">Hospital</option>
            </select>
          </label>
          {form.role === "HOSPITAL" ? (
            <label style={{ display: "grid", gap: 8, color: "#334155" }}>
              Hospital Name
              <input required maxLength="160" value={form.hospitalName} onChange={(event) => updateField("hospitalName", event.target.value)} placeholder="The hospital or clinic name" />
            </label>
          ) : (
            <label style={{ display: "grid", gap: 8, color: "#334155" }}>
              Blood Group
              <select value={form.bloodGroup} onChange={(event) => updateField("bloodGroup", event.target.value)}>
                {bloodGroups.map((group) => <option key={group}>{group}</option>)}
              </select>
            </label>
          )}
          <label style={{ display: "grid", gap: 8, color: "#334155" }}>
            Address (optional)
            <input maxLength="500" value={form.address} onChange={(event) => updateField("address", event.target.value)} placeholder="Address" />
          </label>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button type="button" onClick={handleUseLocation}>Use my current location</button>
            <span role="status" style={{ alignSelf: "center", color: "#475569" }}>
              {locationStatus || "Coordinates are required for nearby matching."}
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={{ display: "grid", gap: 8, color: "#334155" }}>
              Latitude
              <input required type="number" min="-90" max="90" step="any" value={form.latitude} onChange={(event) => updateField("latitude", event.target.value)} placeholder="19.0760" />
            </label>
            <label style={{ display: "grid", gap: 8, color: "#334155" }}>
              Longitude
              <input required type="number" min="-180" max="180" step="any" value={form.longitude} onChange={(event) => updateField("longitude", event.target.value)} placeholder="72.8777" />
            </label>
          </div>
          <label style={{ display: "grid", gap: 8, color: "#334155" }}>
            Phone
            <input required maxLength="30" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} placeholder="Phone number" />
          </label>
          <button type="submit" disabled={submitting} style={{ width: "100%", marginTop: 8, padding: 14, borderRadius: 12, border: "none", background: "#b91c1c", color: "white", fontWeight: 600, cursor: "pointer" }}>
            {submitting ? "Creating account…" : "Register"}
          </button>
          {error && <p role="alert" style={{ color: "#b91c1c", margin: 0 }}>{error}</p>}
        </form>
        <p style={{ marginTop: 20, textAlign: "center", color: "#475569" }}>
          Already registered? <Link to="/login" style={{ color: "#b91c1c" }}>Login</Link>
        </p>
      </div>
    </div>
  );
}
