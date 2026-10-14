import { useState } from "react";
import API from "../api/axios";
import { apiErrorMessage, bloodGroups, toApiBloodGroup } from "../api/domain";

export default function SOSPanel({ profile }) {
  const [form, setForm] = useState(() => ({
    bloodGroup: "O+",
    unitsRequired: 1,
    locationDescription: profile?.address || "",
    latitude: profile?.latitude || "",
    longitude: profile?.longitude || "",
    requiredBy: "",
    contactNumber: profile?.phone || "",
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const useLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setForm((current) => ({
        ...current,
        latitude: coords.latitude.toFixed(6),
        longitude: coords.longitude.toFixed(6),
      })),
      (locationError) => setError(`Could not get your location: ${locationError.message}`),
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
        locationDescription: form.locationDescription.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        requiredBy: new Date(form.requiredBy).toISOString(),
        contactNumber: form.contactNumber.trim(),
      });
      setResult(data);
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Unable to create SOS alert."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section style={{ padding: 24, background: "white", borderRadius: 20 }}>
      <h2>Emergency SOS</h2>
      <p>Create an urgent hospital alert and find eligible nearby donors. SMS remains in safe mock/logging mode.</p>
      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
          <label>Blood group<select required value={form.bloodGroup} onChange={(event) => update("bloodGroup", event.target.value)}>{bloodGroups.map((group) => <option key={group}>{group}</option>)}</select></label>
          <label>Units required<input required type="number" min="1" value={form.unitsRequired} onChange={(event) => update("unitsRequired", event.target.value)} /></label>
          <label>Required by<input required type="datetime-local" value={form.requiredBy} onChange={(event) => update("requiredBy", event.target.value)} /></label>
          <label>Contact number<input required maxLength="30" value={form.contactNumber} onChange={(event) => update("contactNumber", event.target.value)} /></label>
          <label>Location description<input required maxLength="500" value={form.locationDescription} onChange={(event) => update("locationDescription", event.target.value)} /></label>
          <label>Latitude<input required type="number" min="-90" max="90" step="any" value={form.latitude} onChange={(event) => update("latitude", event.target.value)} /></label>
          <label>Longitude<input required type="number" min="-180" max="180" step="any" value={form.longitude} onChange={(event) => update("longitude", event.target.value)} /></label>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button type="button" onClick={useLocation}>Use current location</button>
          <button disabled={busy}>{busy ? "Creating alert…" : "Send SOS alert"}</button>
        </div>
      </form>
      {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
      {result && (
        <div role="status" style={{ marginTop: 16, padding: 16, background: "#fff7ed", borderRadius: 12 }}>
          <strong>SOS alert created.</strong>
          <p>Eligible donors found: {result.eligibleDonors?.length ?? 0}.</p>
          <p>SMS status: {result.smsNotificationStatus}. No real SMS was sent.</p>
        </div>
      )}
    </section>
  );
}
