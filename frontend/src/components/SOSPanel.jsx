import { useState } from "react";
import API from "../api/axios";
import { apiErrorMessage, bloodGroups, toApiBloodGroup } from "../api/domain";

function formFromProfile(profile) {
  return {
    bloodGroup: "O+",
    unitsRequired: 1,
    locationDescription: profile?.address || "",
    latitude: profile?.latitude ?? "",
    longitude: profile?.longitude ?? "",
    requiredBy: "",
    contactNumber: profile?.phone || "",
  };
}

export default function SOSPanel({ profile }) {
  const [form, setForm] = useState(() => formFromProfile(profile));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const useLocation = () => {
    if (!navigator.geolocation) {
      setError("Location is not supported by this browser. Enter the coordinates manually.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setForm((current) => ({
          ...current,
          latitude: coords.latitude.toFixed(6),
          longitude: coords.longitude.toFixed(6),
        }));
        setError("");
      },
      () => setError("Could not access your location. Check browser permission or enter coordinates manually."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const { data } = await API.post("/request/sos", {
        bloodGroup: toApiBloodGroup(form.bloodGroup),
        unitsRequired: Number(form.unitsRequired),
        locationDescription: (form.locationDescription || profile?.address || "").trim(),
        latitude: Number(form.latitude || profile?.latitude),
        longitude: Number(form.longitude || profile?.longitude),
        requiredBy: new Date(form.requiredBy).toISOString(),
        contactNumber: (form.contactNumber || profile?.phone || "").trim(),
      });
      setResult(data);
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Unable to create the SOS alert."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="panel sos-panel">
      <div className="panel-heading">
        <div className="sos-heading">
          <span className="sos-icon" aria-hidden="true">SOS</span>
          <div><p className="eyebrow">URGENT NEED</p><h2>Create an SOS alert</h2></div>
        </div>
      </div>
      <p>Notify eligible nearby donors of a critical request. SMS notifications remain in mock mode.</p>
      <form className="request-form" onSubmit={submit}>
        <div className="request-form-grid">
          <label>Blood group
            <select required value={form.bloodGroup} onChange={(event) => update("bloodGroup", event.target.value)}>{bloodGroups.map((group) => <option key={group}>{group}</option>)}</select>
          </label>
          <label>Units required
            <input required type="number" min="1" value={form.unitsRequired} onChange={(event) => update("unitsRequired", event.target.value)} />
          </label>
          <label>Required by
            <input required type="datetime-local" value={form.requiredBy} onChange={(event) => update("requiredBy", event.target.value)} />
          </label>
          <label>Contact number
            <input required maxLength="30" value={form.contactNumber || profile?.phone || ""} onChange={(event) => update("contactNumber", event.target.value)} />
          </label>
          <label className="form-span-2">Location description
            <input required maxLength="500" value={form.locationDescription || profile?.address || ""} onChange={(event) => update("locationDescription", event.target.value)} />
          </label>
          <label>Latitude
            <input required type="number" min="-90" max="90" step="any" value={form.latitude || profile?.latitude || ""} onChange={(event) => update("latitude", event.target.value)} />
          </label>
          <label>Longitude
            <input required type="number" min="-180" max="180" step="any" value={form.longitude || profile?.longitude || ""} onChange={(event) => update("longitude", event.target.value)} />
          </label>
        </div>
        <div className="form-actions">
          <button className="button button--secondary" type="button" onClick={useLocation}>Use current location</button>
          <button className="button button--danger" disabled={busy}>{busy ? "Creating alert…" : "Create SOS alert"}</button>
        </div>
      </form>
      {error && <div className="alert-card alert-card--error" role="alert">{error}</div>}
      {result && (
        <div className="alert-card alert-card--success" role="status">
          <strong>SOS alert created.</strong>
          <p>{result.eligibleDonors?.length ?? 0} eligible donor(s) matched. SMS status: {result.smsNotificationStatus}; no real SMS was sent.</p>
        </div>
      )}
    </section>
  );
}
