export default function DonorStatusPanel({ profile }) {
  const available = profile?.available ?? false;
  const isLoggedIn = Boolean(profile);
  const isDonor = Boolean(profile);

  return (
    <section className="card" style={{ display: "grid", gap: 20, padding: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#e11d48" }}>Donor Status</div>
          <h2 style={{ margin: "10px 0 0", fontSize: 22, color: "#111827" }}>Logged-in donor</h2>
        </div>
        {isDonor && (
          <div
            style={{
              padding: "10px 16px",
              borderRadius: 999,
              background: available ? "#dcfce7" : "#fee2e2",
              color: available ? "#166534" : "#991b1b",
              fontWeight: 700,
            }}>
            {available ? "🟢 Available" : "🔴 Not Available"}
          </div>
        )}
      </div>

      {!isLoggedIn ? (
        <div style={{ color: "#475569", lineHeight: 1.8 }}>
          Sign in as a donor to manage your availability and stay visible to nearby alerts.
        </div>
      ) : !isDonor ? (
        <div style={{ color: "#475569", lineHeight: 1.8 }}>
          Only donor accounts can update availability here.
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gap: 12, color: "#475569" }}>
            <div>
              <strong style={{ color: "#111827" }}>{profile.name}</strong> • {profile.bloodGroup || "Unknown"}
            </div>
            <div>Last donation: {profile.lastDonationDate ? profile.lastDonationDate.split("T")[0] : "Not recorded"}</div>
            <div>Donor matching requires availability and at least 90 days since your last donation.</div>
          </div>
          <div>Manage availability from your donor dashboard.</div>
        </>
      )}

      <div style={{ color: "#475569", fontSize: 14, lineHeight: 1.7 }}>
        * If deactivated it tells you you're not available to donate blood now.
      </div>
    </section>
  );
}
