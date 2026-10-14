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
    return <main role="status" style={{ padding: 32 }}>{error || "Loading profile…"}</main>;
  }

  return (
    <div style={{ background: "#fdf2f2", minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: 24, background: "white", borderRadius: 20, boxShadow: "0 20px 40px rgba(15, 23, 42, 0.08)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0, color: "#991b1b" }}>Your Profile</h2>
            <p style={{ color: "#475569", marginTop: 8 }}>Review your account details and edit information anytime.</p>
          </div>
          <button type="button" onClick={() => navigate(role === "hospital" ? "/dashboard" : "/find-donors")}>Back to Dashboard</button>
        </div>
        <form onSubmit={handleSave} style={{ display: "grid", gap: 18 }}>
          <label style={{ display: "grid", gap: 8 }}>Full Name
            <input required maxLength="120" value={form.name} onChange={(event) => updateField("name", event.target.value)} />
          </label>
          <label style={{ display: "grid", gap: 8 }}>Phone
            <input required maxLength="30" value={form.phone} onChange={(event) => updateField("phone", event.target.value)} />
          </label>
          {role === "donor" ? (
            <>
              <label style={{ display: "grid", gap: 8 }}>Blood Group
                <select value={form.bloodGroup} onChange={(event) => updateField("bloodGroup", event.target.value)}>
                  {bloodGroups.map((group) => <option key={group}>{group}</option>)}
                </select>
              </label>
              <label style={{ display: "grid", gap: 8 }}>Last Donation Date
                <input type="date" max={new Date().toISOString().slice(0, 10)} value={form.lastDonationDate} onChange={(event) => updateField("lastDonationDate", event.target.value)} />
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input type="checkbox" checked={form.available} onChange={(event) => updateField("available", event.target.checked)} />
                Available to donate
              </label>
            </>
          ) : (
            <label style={{ display: "grid", gap: 8 }}>Hospital Name
              <input required maxLength="160" value={form.hospitalName} onChange={(event) => updateField("hospitalName", event.target.value)} />
            </label>
          )}
          <label style={{ display: "grid", gap: 8 }}>Address
            <input maxLength="500" value={form.address} onChange={(event) => updateField("address", event.target.value)} />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={{ display: "grid", gap: 8 }}>Latitude
              <input required type="number" min="-90" max="90" step="any" value={form.latitude} onChange={(event) => updateField("latitude", event.target.value)} />
            </label>
            <label style={{ display: "grid", gap: 8 }}>Longitude
              <input required type="number" min="-180" max="180" step="any" value={form.longitude} onChange={(event) => updateField("longitude", event.target.value)} />
            </label>
          </div>
          <button type="submit" disabled={saving}>{saving ? "Saving…" : "Save Profile"}</button>
          {message && <p role="status" style={{ color: "#16a34a" }}>{message}</p>}
          {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
        </form>
      </div>
    </div>
  );
}
