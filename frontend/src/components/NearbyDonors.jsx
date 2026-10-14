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
    if (!profile || profile.latitude == null || profile.longitude == null) return;

    const fetchDonors = async () => {
      try {
        const params = new URLSearchParams({
          bloodGroup: toApiBloodGroup(bloodGroup),
          latitude: profile.latitude,
          longitude: profile.longitude,
          maxDistanceKm: "30",
        });
        const res = await API.get(`/request/donors?${params}`);
        setDonors(res.data);
        setError("");
      } catch (requestError) {
        setError(apiErrorMessage(requestError, "Unable to fetch donors."));
        setDonors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDonors();
  }, [profile, bloodGroup]);

  if (!profile) return null;

  return (
    <section className="card" style={{ padding: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 14, color: "#e11d48", fontWeight: 700 }}>Nearby donors</div>
          <h2 style={{ margin: "6px 0 0", fontSize: 22, color: "#111827" }}>Real donors near your hospital</h2>
        </div>
        <label>Blood group{" "}
          <select value={bloodGroup} onChange={(event) => setBloodGroup(event.target.value)}>
            {bloodGroups.map((group) => <option key={group}>{group}</option>)}
          </select>
        </label>
      </div>

      {profile.latitude == null || profile.longitude == null ? (
        <div role="alert" style={{ padding: 24, borderRadius: 18, background: "#fee2e2", color: "#991b1b" }}>Hospital location is required to load donors.</div>
      ) : loading ? (
        <div style={{ padding: 24, borderRadius: 18, background: "#f8fafc", color: "#475569" }}>Loading active donors...</div>
      ) : error ? (
        <div style={{ padding: 24, borderRadius: 18, background: "#fee2e2", color: "#991b1b" }}>{error}</div>
      ) : donors.length === 0 ? (
        <div style={{ padding: 24, borderRadius: 18, background: "#f8fafc", color: "#475569" }}>No active donors available right now.</div>
      ) : (
        <div style={{ display: "grid", gap: 18 }}>
          {donors.map((donor) => (
            <DonorCard key={donor.id} donor={donor} />
          ))}
        </div>
      )}
    </section>
  );
}
