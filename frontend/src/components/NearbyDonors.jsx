import { useEffect, useState } from "react";
import API from "../api/axios";
import DonorCard from "./DonorCard";
import { apiErrorMessage, bloodGroups, toApiBloodGroup } from "../api/domain";

export default function NearbyDonors({ profile }) {
  const [donors, setDonors] = useState([]);
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!profile || profile.latitude == null || profile.longitude == null) {
      return undefined;
    }
    let active = true;
    const params = new URLSearchParams({
      bloodGroup: toApiBloodGroup(bloodGroup),
      latitude: profile.latitude,
      longitude: profile.longitude,
      maxDistanceKm: "30",
    });
    API.get(`/request/donors?${params}`)
      .then(({ data }) => {
        if (active) setDonors(data);
      })
      .catch((requestError) => {
        if (!active) return;
        setError(apiErrorMessage(requestError, "Unable to fetch eligible donors."));
        setDonors([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [profile, bloodGroup]);

  if (!profile) return null;

  return (
    <section className="panel">
      <div className="panel-heading">
        <div><p className="eyebrow">DONOR MATCHING</p><h2>Nearby donors</h2></div>
      </div>
      <div className="search-controls">
        <p className="page-lead">Eligible, available donors within 30 km.</p>
        <label className="field">Blood group
          <select value={bloodGroup} onChange={(event) => {
            setLoading(true);
            setError("");
            setBloodGroup(event.target.value);
          }}>
            {bloodGroups.map((group) => <option key={group}>{group}</option>)}
          </select>
        </label>
      </div>
      {profile.latitude == null || profile.longitude == null ? (
        <div className="alert-card alert-card--warning" role="status">Add your hospital location to search nearby donors.</div>
      ) : loading ? (
        <p className="loading-state" role="status">Finding eligible donors…</p>
      ) : error ? (
        <div className="alert-card alert-card--error" role="alert">{error}</div>
      ) : donors.length === 0 ? (
        <div className="empty-state"><h3>No matching donors found</h3><p>No available donor matching this blood group is currently within 30 km.</p></div>
      ) : (
        <div className="donor-list">{donors.map((donor) => <DonorCard key={donor.id} donor={donor} />)}</div>
      )}
    </section>
  );
}
