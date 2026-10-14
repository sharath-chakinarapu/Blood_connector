import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import { apiErrorMessage, displayRequestStatus, fromApiBloodGroup, getDonorEligibility } from "../api/domain";
import { useAuth } from "../auth/useAuth";

export default function FindDonors() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState("");
  const [requestsError, setRequestsError] = useState("");
  const [eligibilityDenied, setEligibilityDenied] = useState(false);
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [donationDate, setDonationDate] = useState("");
  const initialLoadStarted = useRef(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    setRequestsError("");
    setEligibilityDenied(false);
    try {
      const { data: donorProfile } = await API.get("/donor/profile");
      setProfile(donorProfile);
      setDonationDate(donorProfile.lastDonationDate || "");

      if (!getDonorEligibility(donorProfile).eligible) {
        setRequests([]);
        return;
      }

      setRequestsLoading(true);
      try {
        const { data } = await API.get("/request/nearby");
        setRequests(data);
      } catch (requestError) {
        const message = apiErrorMessage(requestError, "Unable to load nearby blood requests.");
        if (requestError.response?.status === 403) {
          const isEligibilityDenial = message.toLowerCase().includes("donor is not currently eligible");
          setEligibilityDenied(isEligibilityDenial);
          setRequestsError(isEligibilityDenial
            ? `${message} Review your availability and last donation date in your profile. Matching requires availability and at least 90 days since your last donation.`
            : `${message} Check your donor account and try again.`);
        } else {
          setRequestsError(message);
        }
        setRequests([]);
      } finally {
        setRequestsLoading(false);
      }
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Unable to load your donor profile."));
      setProfile(null);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialLoadStarted.current) return;
    initialLoadStarted.current = true;
    loadData();
  }, [loadData]);

  const eligibility = eligibilityDenied
    ? { eligible: false, reason: requestsError }
    : getDonorEligibility(profile);
  const completenessItems = profile
    ? [profile.name, profile.bloodGroup, profile.phone, profile.latitude != null && profile.longitude != null]
    : [];
  const profileCompleteness = completenessItems.length
    ? Math.round((completenessItems.filter(Boolean).length / completenessItems.length) * 100)
    : 0;

  const updateDonationDate = async (event) => {
    event.preventDefault();
    if (!profile) return;
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
      setNotice("Donation date updated. Your matching eligibility has been refreshed.");
      await loadData();
    } catch (requestError) {
      setError(apiErrorMessage(requestError, "Unable to save your donation date."));
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailability = async () => {
    if (!profile) return;
    setSaving(true);
    setError("");
    setNotice("");
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
      setError(apiErrorMessage(requestError, "Unable to update your availability."));
    } finally {
      setSaving(false);
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
      setRequestsError(apiErrorMessage(requestError, "Unable to start a conversation."));
    }
  };

  if (loading && !profile) {
    return <main className="page-shell"><div className="page-container"><p className="loading-state" role="status">Loading your donor dashboard…</p></div></main>;
  }

  if (error && !profile) {
    return (
      <main className="page-shell">
        <div className="page-container">
          <section className="alert-card alert-card--error" role="alert">
            <h1>We could not load your donor profile</h1>
            <p>{error}</p>
            <button className="button button--secondary" type="button" onClick={loadData}>Try again</button>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="page-container">
        <header className="page-heading">
          <div>
            <p className="eyebrow">DONOR DASHBOARD</p>
            <h1>Welcome back, {profile?.name || user?.name}</h1>
            <p className="page-lead">Your eligibility and nearby open requests, in one place.</p>
          </div>
          <button className="button button--secondary" type="button" onClick={() => navigate("/profile")}>Edit profile</button>
        </header>

        {error && <div className="alert-card alert-card--error" role="alert">{error}</div>}
        {notice && <div className="alert-card alert-card--success" role="status">{notice}</div>}

        <div className="dashboard-grid dashboard-grid--donor">
          <section className="panel donor-summary">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">YOUR DONOR PROFILE</p>
                <h2>Donation readiness</h2>
              </div>
              <span className={`status-pill ${eligibility.eligible ? "status-pill--good" : "status-pill--warning"}`}>
                {eligibility.eligible ? "Eligible for matching" : "Not currently eligible"}
              </span>
            </div>
            <p className="summary-text">
              {eligibility.eligible
                ? "Your profile currently meets the matching rules. Nearby requests are shown only to authenticated donors who are available and within the matching criteria."
                : eligibility.reason}
            </p>
            {!eligibility.eligible && (
              <div className="eligibility-guidance">
                <strong>What you can do</strong>
                <ul>
                  {!profile?.available && <li>Turn on “Available to donate” if you are ready to be contacted.</li>}
                  {eligibility.eligibleOn && <li>Matching becomes available on {eligibility.eligibleOn}, after the 90-day recovery period.</li>}
                  <li>Keep your last donation date accurate in your profile. Do not change it unless the recorded date is incorrect.</li>
                </ul>
                <button className="button button--secondary" type="button" onClick={() => navigate("/profile")}>Review donor profile</button>
              </div>
            )}
            <div className="profile-progress">
              <div className="profile-progress__label">
                <span>Profile completeness</span>
                <strong>{profileCompleteness}%</strong>
              </div>
              <div className="progress-track" role="progressbar" aria-label="Profile completeness" aria-valuemin="0" aria-valuemax="100" aria-valuenow={profileCompleteness}>
                <span style={{ width: `${profileCompleteness}%` }} />
              </div>
            </div>
            <dl className="detail-list">
              <div><dt>Blood group</dt><dd>{fromApiBloodGroup(profile?.bloodGroup) || "Not set"}</dd></div>
              <div><dt>Availability</dt><dd>{profile?.available ? "Available" : "Unavailable"}</dd></div>
              <div><dt>Last donation</dt><dd>{profile?.lastDonationDate || "Not recorded"}</dd></div>
            </dl>
            <div className="panel-actions">
              <button className="button button--secondary" type="button" disabled={saving} onClick={toggleAvailability}>
                {profile?.available ? "Set unavailable" : "Set available"}
              </button>
              <button className="button button--quiet" type="button" disabled={loading} onClick={loadData}>Refresh</button>
            </div>
            <form className="inline-form" onSubmit={updateDonationDate}>
              <label className="field">
                <span>Last donation date</span>
                <input type="date" required={Boolean(profile?.lastDonationDate)} max={new Date().toISOString().slice(0, 10)} value={donationDate} onChange={(event) => setDonationDate(event.target.value)} />
                {profile?.lastDonationDate && <span className="form-help">Correct a recorded date only if it is inaccurate; the 90-day rule is based on this date.</span>}
              </label>
              <button className="button button--secondary" disabled={saving}>{saving ? "Saving…" : "Update date"}</button>
            </form>
          </section>

          <section className="panel requests-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">MATCHED FOR YOU</p>
                <h2>Nearby blood requests</h2>
              </div>
              <span className="count-badge">{eligibility.eligible ? requests.length : "—"}</span>
            </div>
            {!eligibility.eligible ? (
              <div className="empty-state">
                <span className="empty-state__icon" aria-hidden="true">!</span>
                <h3>Matching is paused</h3>
                <p>{eligibility.reason} You can still review and update your profile; requests remain protected until eligibility requirements are met.</p>
                <button className="button button--secondary" type="button" onClick={() => navigate("/profile")}>Review profile</button>
              </div>
            ) : requestsLoading ? (
              <p className="loading-state" role="status">Finding nearby requests…</p>
            ) : requestsError ? (
              <div className="alert-card alert-card--warning" role="alert">
                <p>{requestsError}</p>
                <button className="button button--secondary" type="button" onClick={() => navigate("/profile")}>Review profile</button>
              </div>
            ) : requests.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state__icon" aria-hidden="true">✓</span>
                <h3>No matching requests right now</h3>
                <p>Your profile is eligible. We’ll show open requests when a compatible need is available nearby.</p>
              </div>
            ) : (
              <div className="request-list">
                {requests.map((request) => (
                  <article className="request-card" key={request.id}>
                    <div className="request-card__top">
                      <span className="blood-tag">{fromApiBloodGroup(request.bloodGroup)} · {request.unitsRequired} unit{request.unitsRequired === 1 ? "" : "s"}</span>
                      <span className="status-pill status-pill--neutral">{displayRequestStatus(request.status)}</span>
                    </div>
                    <h3>{request.hospitalDisplayName || request.hospitalName || "Hospital"}</h3>
                    <p>{request.locationDescription}</p>
                    <div className="request-meta">
                      <span>Needed {new Date(request.requiredBy).toLocaleString()}</span>
                      {request.distanceKm != null && <span>{request.distanceKm.toFixed(1)} km away</span>}
                    </div>
                    <div className="panel-actions">
                      {request.contactNumber && <a className="button button--secondary" href={`tel:${request.contactNumber}`}>Call hospital</a>}
                      <button className="button button--primary" type="button" onClick={() => startChat(request)}>Message hospital</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
