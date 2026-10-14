import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { apiErrorMessage, displayRequestStatus, fromApiBloodGroup } from "../api/domain";
import { useAuth } from "../auth/useAuth";

export default function FindDonors() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [donationDate, setDonationDate] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [profileResponse, requestsResponse] = await Promise.all([
        API.get("/donor/profile"),
        API.get("/request/nearby"),
      ]);
      setProfile(profileResponse.data);
      setRequests(requestsResponse.data);
      setDonationDate(profileResponse.data.lastDonationDate || "");
      setError("");
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Unable to load your donor dashboard."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [profileResponse, requestsResponse] = await Promise.all([
          API.get("/donor/profile"),
          API.get("/request/nearby"),
        ]);
        if (!active) return;
        setProfile(profileResponse.data);
        setRequests(requestsResponse.data);
        setDonationDate(profileResponse.data.lastDonationDate || "");
        setError("");
      } catch (requestError) {
        if (active) setError(apiErrorMessage(requestError, "Unable to load your donor dashboard."));
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const updateDonationDate = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await API.patch("/donor/profile", {
        name: profile.name,
        phone: profile.phone,
        bloodGroup: profile.bloodGroup,
        available: profile.available,
        address: profile.address,
        latitude: profile.latitude,
        longitude: profile.longitude,
        lastDonationDate: donationDate || null,
      });
      setNotice("Donation date updated.");
      await loadData();
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Unable to save donation date."));
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async () => {
    try {
      await API.patch("/donor/profile", {
        name: profile.name,
        phone: profile.phone,
        bloodGroup: profile.bloodGroup,
        available: !profile.available,
        address: profile.address,
        latitude: profile.latitude,
        longitude: profile.longitude,
        lastDonationDate: profile.lastDonationDate || null,
      });
      await loadData();
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Unable to update availability."));
    }
  };

  const startChat = async (request) => {
    try {
      const { data } = await API.post("/chats", {
        participantId: request.hospitalId,
        bloodRequestId: request.id,
        title: `Blood request from ${request.hospitalDisplayName || request.hospitalName}`,
      });
      navigate(`/chats/${data.id}`);
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Unable to start conversation."));
    }
  };

  if (loading && !profile) return <main role="status" style={{ padding: 32 }}>Loading donor dashboard…</main>;

  return (
    <main style={{ background: "#fdf2f2", minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 980, margin: "0 auto", display: "grid", gap: 24 }}>
        <section style={{ padding: 24, background: "white", borderRadius: 20 }}>
          <h1 style={{ marginTop: 0 }}>Donor Dashboard</h1>
          <p>Welcome, {profile?.name || user?.name}. Open requests shown here are selected for your location and donor profile.</p>
          <p>Blood group: {fromApiBloodGroup(profile?.bloodGroup)} · Availability: {profile?.available ? "Available" : "Not available"}</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" onClick={toggleAvailability}>{profile?.available ? "Set unavailable" : "Set available"}</button>
            <button type="button" onClick={() => navigate("/profile")}>Edit profile</button>
            <button type="button" onClick={loadData}>Refresh requests</button>
          </div>
          <form onSubmit={updateDonationDate} style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "end", marginTop: 16 }}>
            <label>Last donation date (optional)<br /><input type="date" max={new Date().toISOString().slice(0, 10)} value={donationDate} onChange={(event) => setDonationDate(event.target.value)} /></label>
            <button disabled={saving}>{saving ? "Saving…" : "Save donation date"}</button>
          </form>
          {error && <p role="alert" style={{ color: "#b91c1c" }}>{error}</p>}
          {notice && <p role="status" style={{ color: "#166534" }}>{notice}</p>}
        </section>

        <section style={{ padding: 24, background: "white", borderRadius: 20 }}>
          <h2>Nearby open blood requests</h2>
          {requests.length === 0 ? <p>No relevant open requests are available.</p> : requests.map((request) => (
            <article key={request.id} style={{ borderTop: "1px solid #e2e8f0", padding: "16px 0" }}>
              <strong>{request.bloodGroup} · {request.unitsRequired} unit(s)</strong>
              <p>{request.hospitalDisplayName || request.hospitalName} · {request.locationDescription}</p>
              <p>{displayRequestStatus(request.status)} · Needed by {new Date(request.requiredBy).toLocaleString()} · {request.distanceKm == null ? "" : `${request.distanceKm.toFixed(1)} km away`}</p>
              <div style={{ display: "flex", gap: 10 }}>
                {request.contactNumber && <a href={`tel:${request.contactNumber}`}>Call hospital</a>}
                <button type="button" onClick={() => startChat(request)}>Message hospital</button>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
