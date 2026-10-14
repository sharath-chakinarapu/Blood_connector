import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import NearbyDonors from "../components/NearbyDonors";
import SOSPanel from "../components/SOSPanel";
import { apiErrorMessage, bloodGroups, displayRequestStatus, toApiBloodGroup } from "../api/domain";
import { useAuth } from "../auth/useAuth";

const blankRequest = {
  bloodGroup: "O+",
  urgency: "HIGH",
  locationDescription: "",
  latitude: "",
  longitude: "",
  requiredBy: "",
  unitsRequired: 1,
  contactNumber: "",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [sosAlerts, setSosAlerts] = useState([]);
  const [donors, setDonors] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [form, setForm] = useState(blankRequest);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      const [profileResponse, requestsResponse, sosResponse] = await Promise.all([
        API.get("/hospital/profile"),
        API.get("/request/hospital"),
        API.get("/request/sos"),
      ]);
      setProfile(profileResponse.data);
      setRequests(requestsResponse.data);
      setSosAlerts(sosResponse.data);
      setForm((current) => ({
        ...current,
        latitude: current.latitude || profileResponse.data.latitude || "",
        longitude: current.longitude || profileResponse.data.longitude || "",
        contactNumber: current.contactNumber || profileResponse.data.phone || "",
        locationDescription: current.locationDescription || profileResponse.data.address || "",
      }));
      setError("");
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Unable to load hospital dashboard."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [profileResponse, requestsResponse, sosResponse] = await Promise.all([
          API.get("/hospital/profile"),
          API.get("/request/hospital"),
          API.get("/request/sos"),
        ]);
        if (!active) return;
        setProfile(profileResponse.data);
        setRequests(requestsResponse.data);
        setSosAlerts(sosResponse.data);
        setForm((current) => ({
          ...current,
          latitude: current.latitude || profileResponse.data.latitude || "",
          longitude: current.longitude || profileResponse.data.longitude || "",
          contactNumber: current.contactNumber || profileResponse.data.phone || "",
          locationDescription: current.locationDescription || profileResponse.data.address || "",
        }));
        setError("");
      } catch (requestError) {
        if (active) setError(apiErrorMessage(requestError, "Unable to load hospital dashboard."));
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const createRequest = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await API.post("/request", {
        bloodGroup: toApiBloodGroup(form.bloodGroup),
        urgency: form.urgency,
        locationDescription: form.locationDescription.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        requiredBy: new Date(form.requiredBy).toISOString(),
        unitsRequired: Number(form.unitsRequired),
        contactNumber: form.contactNumber.trim(),
      });
      setNotice("Blood request created.");
      setForm((current) => ({ ...blankRequest, latitude: current.latitude, longitude: current.longitude, contactNumber: current.contactNumber, locationDescription: current.locationDescription }));
      await loadDashboard();
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Unable to create blood request."));
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (request, status) => {
    try {
      await API.patch(`/request/${request.id}/status`, { status });
      setNotice(`Request marked ${displayRequestStatus(status)}.`);
      setError("");
      await loadDashboard();
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Unable to update request status."));
    }
  };

  const updateSosStatus = async (alert, status) => {
    try {
      await API.patch(`/request/sos/${alert.id}/status`, { status });
      setNotice(`SOS alert marked ${displayRequestStatus(status)}.`);
      setError("");
      await loadDashboard();
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Unable to update SOS alert."));
    }
  };

  const loadMatches = async (request) => {
    setSelectedRequest(request);
    setDonors([]);
    try {
      const { data } = await API.get(`/request/alert/${request.id}/donors`);
      setDonors(data);
      setError("");
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Unable to load eligible donor matches."));
    }
  };

  const startChat = async (donor) => {
    try {
      const { data } = await API.post("/chats", {
        participantId: donor.id,
        bloodRequestId: selectedRequest?.id,
        title: `Request ${selectedRequest?.bloodGroup || ""} donor`,
      });
      navigate(`/chats/${data.id}`);
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Unable to start conversation."));
    }
  };

  if (loading && !profile) return <main role="status" style={{ padding: 32 }}>Loading dashboard…</main>;

  return (
    <main style={{ background: "#fdf2f2", minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 1080, margin: "0 auto", display: "grid", gap: 24 }}>
        <section style={{ padding: 24, background: "white", borderRadius: 20 }}>
          <h1 style={{ marginTop: 0 }}>Hospital Dashboard</h1>
          <p>Welcome, {profile?.hospitalName || user?.name}. Create requests, manage your own requests, and contact eligible donors.</p>
          <button type="button" onClick={() => navigate("/profile")}>Edit hospital profile</button>
          {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
          {notice && <p role="status" style={{ color: "#166534" }}>{notice}</p>}
        </section>

        <SOSPanel profile={profile} />
        <NearbyDonors profile={profile} />

        <section style={{ padding: 24, background: "white", borderRadius: 20 }}>
          <h2>Create a blood request</h2>
          <form onSubmit={createRequest} style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 12 }}>
              <label>Blood group<select required value={form.bloodGroup} onChange={(event) => updateField("bloodGroup", event.target.value)}>{bloodGroups.map((group) => <option key={group}>{group}</option>)}</select></label>
              <label>Urgency<select required value={form.urgency} onChange={(event) => updateField("urgency", event.target.value)}><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option></select></label>
              <label>Units<input required type="number" min="1" value={form.unitsRequired} onChange={(event) => updateField("unitsRequired", event.target.value)} /></label>
              <label>Needed by<input required type="datetime-local" value={form.requiredBy} onChange={(event) => updateField("requiredBy", event.target.value)} /></label>
              <label>Contact number<input required maxLength="30" value={form.contactNumber} onChange={(event) => updateField("contactNumber", event.target.value)} /></label>
              <label>Location description<input required maxLength="500" value={form.locationDescription} onChange={(event) => updateField("locationDescription", event.target.value)} /></label>
              <label>Latitude<input required type="number" min="-90" max="90" step="any" value={form.latitude} onChange={(event) => updateField("latitude", event.target.value)} /></label>
              <label>Longitude<input required type="number" min="-180" max="180" step="any" value={form.longitude} onChange={(event) => updateField("longitude", event.target.value)} /></label>
            </div>
            <button disabled={saving}>{saving ? "Creating…" : "Create request"}</button>
          </form>
        </section>

        <section style={{ padding: 24, background: "white", borderRadius: 20 }}>
          <h2>Your blood requests</h2>
          {requests.length === 0 ? <p>No requests yet.</p> : requests.map((request) => (
            <article key={request.id} style={{ borderTop: "1px solid #e2e8f0", padding: "16px 0" }}>
              <strong>{request.bloodGroup} · {request.unitsRequired} unit(s)</strong>
              <p>{request.locationDescription} · {displayRequestStatus(request.status)} · {request.distanceKm == null ? "" : `${request.distanceKm.toFixed(1)} km`}</p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" onClick={() => loadMatches(request)}>Eligible donor matches</button>
                {request.status === "OPEN" && <button type="button" onClick={() => updateStatus(request, "COMPLETED")}>Mark completed</button>}
                {request.status === "OPEN" && <button type="button" onClick={() => updateStatus(request, "DISMISSED")}>Dismiss request</button>}
              </div>
            </article>
          ))}
        </section>

        <section style={{ padding: 24, background: "white", borderRadius: 20 }}>
          <h2>Your SOS alerts</h2>
          {sosAlerts.length === 0 ? <p>No SOS alerts yet.</p> : sosAlerts.map((item) => (
            <article key={item.alert.id} style={{ borderTop: "1px solid #e2e8f0", padding: "16px 0" }}>
              <strong>{item.alert.bloodGroup} · {item.alert.unitsRequired} unit(s)</strong>
              <p>{item.alert.locationDescription} · {displayRequestStatus(item.alert.status)}</p>
              <p>{item.eligibleDonors.length} eligible donor(s) matched · SMS: {item.smsNotificationStatus} (mock mode; no SMS sent)</p>
              {item.alert.status === "OPEN" && (
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" onClick={() => updateSosStatus(item.alert, "COMPLETED")}>Mark completed</button>
                  <button type="button" onClick={() => updateSosStatus(item.alert, "DISMISSED")}>Dismiss alert</button>
                </div>
              )}
            </article>
          ))}
        </section>

        {selectedRequest && (
          <section style={{ padding: 24, background: "white", borderRadius: 20 }}>
            <h2>Eligible donor matches</h2>
            {donors.length === 0 ? <p>No eligible matches returned for this request.</p> : donors.map((donor) => (
              <article key={donor.id} style={{ borderTop: "1px solid #e2e8f0", padding: "14px 0" }}>
                <strong>{donor.name}</strong> · {donor.bloodGroup} · {donor.distanceKm?.toFixed(1)} km
                {donor.phone && <a style={{ marginLeft: 12 }} href={`tel:${donor.phone}`}>Call</a>}
                <button style={{ marginLeft: 12 }} type="button" onClick={() => startChat(donor)}>Chat</button>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
