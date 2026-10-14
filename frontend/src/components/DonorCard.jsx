export default function DonorCard({ donor }) {
  // Visual status color is based on donor availability.
  const statusColor = "#16a34a";

  return (
    <div
      style={{
        background: "white",
        borderRadius: 24,
        padding: 24,
        boxShadow: "0 24px 50px rgba(15, 23, 42, 0.08)",
        display: "grid",
        gap: 18,
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>{donor.name}</div>
          <div style={{ color: "#475569", marginTop: 6 }}>{donor.bloodGroup} • {Number(donor.distanceKm).toFixed(1)} km</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              background: statusColor,
              display: "inline-block",
            }}></span>
          <span style={{ color: "#475569", fontWeight: 700 }}>Eligible</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {donor.lastDonationDate && <div>Last donation: {donor.lastDonationDate}</div>}
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <a
          href={`tel:${donor.phone}`}
          style={{
            flex: 1,
            textDecoration: "none",
            textAlign: "center",
            background: "#f8fafc",
            color: "#0f172a",
            padding: "12px 18px",
            borderRadius: 16,
            border: "1px solid #e2e8f0",
            fontWeight: 700,
          }}>
          Call
        </a>
        {/* <button
          type="button"
          onClick={() => alert(`Request sent to ${donor.name}`)}
          className="button-hover"
          style={{
            flex: 1,
            border: "none",
            background: "#e53935",
            color: "white",
            padding: "12px 18px",
            borderRadius: 16,
            cursor: "pointer",
            fontWeight: 700,
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          }}>
          Request
        </button> */}
      </div>
    </div>
  );
}
