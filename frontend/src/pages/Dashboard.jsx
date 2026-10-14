import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import NearbyDonors from "../components/NearbyDonors";
import SOSPanel from "../components/SOSPanel";
import { apiErrorMessage, bloodGroups, displayRequestStatus, fromApiBloodGroup, toApiBloodGroup } from "../api/domain";
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
  const [matchesLoading, setMatchesLoading] = useState(false);
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
    setMatchesLoading(true);
    try {
      const { data } = await API.get(`/request/alert/${request.id}/donors`);
      setDonors(data);
      setError("");
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Unable to load eligible donor matches."));
    } finally {
      setMatchesLoading(false);
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

  if (loading && !profile) return <main className="page-shell"><div className="page-container"><p className="loading-state" role="status">Loading your hospital workspace…</p></div></main>;
  if (error && !profile) return <main className="page-shell"><div className="page-container"><section className="alert-card alert-card--error" role="alert"><h1>Hospital workspace unavailable</h1><p>{error}</p><button className="button button--secondary" type="button" onClick={loadDashboard}>Try again</button></section></div></main>;

  return (
    <main className="page-shell">
      <div className="page-container">
        <header className="page-heading">
          <div>
            <p className="eyebrow">HOSPITAL WORKSPACE</p>
            <h1>{profile?.hospitalName || user?.name}</h1>
            <p className="page-lead">Create requests, manage your hospital’s alerts, and coordinate with eligible donors.</p>
          </div>
          <div className="form-actions">
            <button className="button button--secondary" type="button" onClick={() => navigate("/profile")}>Edit profile</button>
            <button className="button button--quiet" type="button" onClick={loadDashboard} disabled={loading}>Refresh workspace</button>
          </div>
        </header>
        {error && <div className="alert-card alert-card--error" role="alert">{error}</div>}
        {notice && <div className="alert-card alert-card--success" role="status">{notice}</div>}

        <div className="dashboard-grid">
          <div>
            <section className="panel">
              <p className="eyebrow">NEW REQUEST</p>
              <h2>Create a blood request</h2>
              <p>Share the blood group, location, and timing needed. Your hospital account owns and manages this request.</p>
              <form className="request-form" onSubmit={createRequest}>
                <div className="request-form-grid">
                  <label>Blood group
                    <select required value={form.bloodGroup} onChange={(event) => updateField("bloodGroup", event.target.value)}>{bloodGroups.map((group) => <option key={group}>{group}</option>)}</select>
                  </label>
                  <label>Urgency
                    <select required value={form.urgency} onChange={(event) => updateField("urgency", event.target.value)}><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option></select>
                  </label>
                  <label>Units
                    <input required type="number" min="1" value={form.unitsRequired} onChange={(event) => updateField("unitsRequired", event.target.value)} />
                  </label>
                  <label>Needed by
                    <input required type="datetime-local" value={form.requiredBy} onChange={(event) => updateField("requiredBy", event.target.value)} />
                  </label>
                  <label className="form-span-2">Contact number
                    <input required maxLength="30" value={form.contactNumber} onChange={(event) => updateField("contactNumber", event.target.value)} />
                  </label>
                  <label className="form-span-2">Location description
                    <input required maxLength="500" value={form.locationDescription} onChange={(event) => updateField("locationDescription", event.target.value)} />
                  </label>
                  <label>Latitude
                    <input required type="number" min="-90" max="90" step="any" value={form.latitude} onChange={(event) => updateField("latitude", event.target.value)} />
                  </label>
                  <label>Longitude
                    <input required type="number" min="-180" max="180" step="any" value={form.longitude} onChange={(event) => updateField("longitude", event.target.value)} />
                  </label>
                </div>
                <button className="button button--primary" disabled={saving}>{saving ? "Creating request…" : "Create request"}</button>
              </form>
            </section>
            <div className="dashboard-stack">
              <SOSPanel profile={profile} />
              <NearbyDonors profile={profile} />
            </div>
          </div>

          <div className="dashboard-stack">
            <section className="panel">
              <div className="panel-heading">
                <div><p className="eyebrow">REQUEST MANAGEMENT</p><h2>Your blood requests</h2></div>
                <span className="count-badge">{requests.length}</span>
              </div>
              {requests.length === 0 ? (
                <div className="empty-state"><h3>No requests yet</h3><p>Requests created by this hospital will appear here.</p></div>
              ) : requests.map((request) => (
                <article className="request-item" key={request.id}>
                  <h3><span className="blood-tag">{fromApiBloodGroup(request.bloodGroup)} · {request.unitsRequired} unit(s)</span><span className={`status-pill ${request.status === "OPEN" ? "status-pill--good" : "status-pill--neutral"}`}>{displayRequestStatus(request.status)}</span></h3>
                  <p>{request.locationDescription} · Needed {new Date(request.requiredBy).toLocaleString()}</p>
                  <div className="panel-actions">
                    <button className="button button--secondary" type="button" onClick={() => loadMatches(request)}>Find eligible donors</button>
                    {request.status === "OPEN" && <button className="button button--secondary" type="button" onClick={() => updateStatus(request, "COMPLETED")}>Mark completed</button>}
                    {request.status === "OPEN" && <button className="button button--quiet" type="button" onClick={() => updateStatus(request, "DISMISSED")}>Dismiss</button>}
                  </div>
                </article>
              ))}
            </section>

            <section className="panel">
              <div className="panel-heading">
                <div><p className="eyebrow">EMERGENCY ALERTS</p><h2>Your SOS alerts</h2></div>
                <span className="count-badge">{sosAlerts.length}</span>
              </div>
              {sosAlerts.length === 0 ? (
                <div className="empty-state"><h3>No SOS alerts</h3><p>Alerts created by this hospital will appear here.</p></div>
              ) : sosAlerts.map((item) => (
                <article className="request-item" key={item.alert.id}>
                  <h3><span className="blood-tag">{fromApiBloodGroup(item.alert.bloodGroup)} · {item.alert.unitsRequired} unit(s)</span><span className="status-pill status-pill--warning">{displayRequestStatus(item.alert.status)}</span></h3>
                  <p>{item.alert.locationDescription} · {item.eligibleDonors.length} eligible donor(s) matched</p>
                  <p className="form-help">SMS: {item.smsNotificationStatus}. Notifications remain in mock mode; no SMS was sent.</p>
                  {item.alert.status === "OPEN" && <div className="panel-actions">
                    <button className="button button--secondary" type="button" onClick={() => updateSosStatus(item.alert, "COMPLETED")}>Mark completed</button>
                    <button className="button button--quiet" type="button" onClick={() => updateSosStatus(item.alert, "DISMISSED")}>Dismiss alert</button>
                  </div>}
                </article>
              ))}
            </section>

            {selectedRequest && (
              <section className="panel">
                <div className="panel-heading">
                  <div><p className="eyebrow">MATCHED DONORS</p><h2>Eligible nearby donors</h2></div>
                  <button className="button button--quiet" type="button" onClick={() => setSelectedRequest(null)}>Close</button>
                </div>
                {matchesLoading ? <p className="loading-state" role="status">Searching for eligible donors…</p> : donors.length === 0 ? <div className="empty-state"><h3>No eligible matches found</h3><p>No available donor matching this request is currently within 30 km.</p></div> : (
                  <div className="donor-list">{donors.map((donor) => (
                    <article className="donor-card" key={donor.id}>
                      <div className="donor-card__head"><strong>{donor.name}</strong><span className="blood-tag">{fromApiBloodGroup(donor.bloodGroup)}</span></div>
                      <span className="donor-card__meta">{donor.distanceKm?.toFixed(1)} km away</span>
                      <div className="panel-actions">
                        {donor.phone && <a className="button button--secondary" href={`tel:${donor.phone}`}>Call</a>}
                        <button className="button button--primary" type="button" onClick={() => startChat(donor)}>Message</button>
                      </div>
                    </article>
                  ))}</div>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
