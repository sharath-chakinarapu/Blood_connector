export default function StatsCards({ activeDonors = null, requestsToday = null }) {
  const stats = [
    { icon: "🩸", label: "Active Donors", value: activeDonors },
    { icon: "🚨", label: "Requests Today", value: requestsToday },
  ];

  return (
    <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 24 }}>
      {stats.map((item) => (
        <div
          key={item.label}
          style={{
            background: "white",
            borderRadius: 24,
            padding: 24,
            boxShadow: "0 20px 40px rgba(15, 23, 42, 0.06)",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              display: "grid",
              placeItems: "center",
              background: "#fee2e2",
              fontSize: 24,
            }}>
            {item.icon}
          </div>
          <div>
            <div style={{ fontSize: 14, color: "#475569", marginBottom: 6 }}>{item.label}</div>
            <div style={{ fontSize: 28, color: "#111827", fontWeight: 700 }}>{item.value === null ? "—" : item.value}</div>
          </div>
        </div>
      ))}
    </section>
  );
}
