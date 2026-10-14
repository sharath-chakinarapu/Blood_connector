import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { apiErrorMessage, bloodGroups, fromApiBloodGroup, fromApiRole, toApiBloodGroup } from "../api/domain";
import { useAuth } from "../auth/useAuth";

const initialForm = {
  name: "",
  phone: "",
  bloodGroup: "O+",
  lastDonationDate: "",
  available: true,
  hospitalName: "",
  address: "",
  latitude: "",
  longitude: "",
};

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = fromApiRole(user?.role);
  const endpoint = role === "hospital" ? "/hospital/profile" : "/donor/profile";
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const { data } = await API.get(endpoint);
      setProfile(data);
      setForm({
        ...initialForm,
        name: data.name || "",
        phone: data.phone || "",
        bloodGroup: fromApiBloodGroup(data.bloodGroup) || "O+",
        lastDonationDate: data.lastDonationDate || "",
        available: data.available ?? true,
        hospitalName: data.hospitalName || "",
        address: data.address || "",
        latitude: data.latitude ?? "",
        longitude: data.longitude ?? "",
      });
      setError("");
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Could not load profile."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      try {
        const { data } = await API.get(endpoint);
        if (!active) return;
        setProfile(data);
        setForm({
          ...initialForm,
          name: data.name || "",
          phone: data.phone || "",
          bloodGroup: fromApiBloodGroup(data.bloodGroup) || "O+",
          lastDonationDate: data.lastDonationDate || "",
          available: data.available ?? true,
          hospitalName: data.hospitalName || "",
          address: data.address || "",
          latitude: data.latitude ?? "",
          longitude: data.longitude ?? "",
        });
        setError("");
      } catch (requestError) {
        if (active) setError(apiErrorMessage(requestError, "Could not load profile."));
      }
    };
    loadProfile();
    return () => {
      active = false;
    };
  }, [endpoint]);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        ...(role === "donor"
          ? {
              bloodGroup: toApiBloodGroup(form.bloodGroup),
              available: form.available,
              lastDonationDate: form.lastDonationDate || null,
            }
          : { hospitalName: form.hospitalName.trim() }),
      };
      const { data } = await API.patch(endpoint, payload);
      setProfile(data);
      setMessage("Profile updated successfully.");
      await fetchProfile();
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Unable to save profile."));
    } finally {
      setSaving(false);
    }
  };

  if (!profile) {
    return (
      <main className="page-shell">
        <div className="page-container">
          {loading ? <p className="loading-state" role="status">Loading your profile…</p> : (
            <section className="alert-card alert-card--error" role="alert">
              <h1>Profile unavailable</h1>
              <p>{error || "Could not load profile."}</p>
              <button className="button button--secondary" type="button" onClick={fetchProfile}>Try again</button>
            </section>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="page-container page-container--narrow">
        <section className="panel">
        <div className="page-heading">
          <div>
            <p className="eyebrow">ACCOUNT SETTINGS</p>
            <h1>Your profile</h1>
            <p className="page-lead">Keep your contact and location details current for accurate matching.</p>
          </div>
          <button className="button button--secondary" type="button" onClick={() => navigate(role === "hospital" ? "/dashboard" : "/find-donors")}>Back to dashboard</button>
        </div>
        <form className="profile-form" onSubmit={handleSave}>
          <div className="profile-form__section">
            <h2>Contact details</h2>
            <div className="form-grid">
              <label>Full name
                <input required maxLength="120" autoComplete="name" value={form.name} onChange={(event) => updateField("name", event.target.value)} />
              </label>
              <label>Phone
                <input required maxLength="30" autoComplete="tel" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} />
              </label>
              {role === "hospital" && <label className="form-span-2">Hospital name
                <input required maxLength="160" value={form.hospitalName} onChange={(event) => updateField("hospitalName", event.target.value)} />
              </label>}
              <label className="form-span-2">Address
                <input maxLength="500" autoComplete="street-address" value={form.address} onChange={(event) => updateField("address", event.target.value)} />
              </label>
            </div>
          </div>
          {role === "donor" && (
            <div className="profile-form__section">
              <h2>Donor details</h2>
              <div className="form-grid">
                <label>Blood group
                  <select value={form.bloodGroup} onChange={(event) => updateField("bloodGroup", event.target.value)}>
                    {bloodGroups.map((group) => <option key={group}>{group}</option>)}
                  </select>
                </label>
                <label>Last donation date
                  <input type="date" required={Boolean(profile.lastDonationDate)} max={new Date().toISOString().slice(0, 10)} value={form.lastDonationDate} onChange={(event) => updateField("lastDonationDate", event.target.value)} />
                  <span className="form-help">Matching requires a 90-day interval after your last donation.</span>
                </label>
                <label className="check-row form-span-2">
                  <input type="checkbox" checked={form.available} onChange={(event) => updateField("available", event.target.checked)} />
                  Available to donate
                </label>
              </div>
            </div>
          )}
          <div className="profile-form__section">
            <h2>Location for nearby matching</h2>
            <div className="form-grid">
              <label>Latitude
                <input required type="number" min="-90" max="90" step="any" value={form.latitude} onChange={(event) => updateField("latitude", event.target.value)} />
              </label>
              <label>Longitude
                <input required type="number" min="-180" max="180" step="any" value={form.longitude} onChange={(event) => updateField("longitude", event.target.value)} />
              </label>
            </div>
          </div>
          {message && <div className="alert-card alert-card--success" role="status">{message}</div>}
          {error && <div className="alert-card alert-card--error" role="alert">{error}</div>}
          <div className="form-actions">
            <button className="button button--primary" type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
            <span className="form-help">Your profile is only available to you and authorized workflows.</span>
          </div>
        </form>
        </section>
      </div>
    </main>
  );
}
