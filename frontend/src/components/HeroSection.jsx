export default function HeroSection({ onRequestNow }) {
  // The hero section introduces the app and directs users to the SOS panel.
  return (
    <section style={{
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 32,
      alignItems: "center",
      padding: "48px 0",
      maxWidth: 1160,
      margin: "0 auto",
      minHeight: 420,
    }}>
      <div style={{ maxWidth: 560 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            borderRadius: 999,
            background: "#fee2e2",
            color: "#b91c1c",
            padding: "10px 16px",
            fontWeight: 700,
            fontSize: 14,
          }}>
          <span>🚑</span>
          Emergency Response
        </div>

        <h1
          style={{
            fontSize: "3rem",
            margin: "24px 0 16px",
            lineHeight: 1.05,
            color: "#111827",
          }}>
          Find Blood Donors Instantly
        </h1>

        <p style={{ fontSize: "1rem", lineHeight: 1.8, color: "#475569", marginBottom: 28 }}>
          Connect with nearby donors in emergencies. Fast donor matching, SOS alerts,
          and status tracking for a cleaner, more intentional emergency tool.
        </p>

        <button
          type="button"
          onClick={onRequestNow}
          className="button-hover"
          style={{
            background: "#e53935",
            color: "white",
            border: "none",
            padding: "16px 24px",
            borderRadius: 16,
            cursor: "pointer",
            fontSize: 16,
            fontWeight: 700,
            boxShadow: "0 18px 40px rgba(229, 57, 53, 0.2)",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
          }}>
          🚨 Request Blood Now
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <div
          style={{
            width: "100%",
            maxWidth: 460,
            borderRadius: 28,
            background: "linear-gradient(180deg, #ffffff 0%, #fee2e2 100%)",
            padding: 28,
            boxShadow: "0 28px 60px rgba(15, 23, 42, 0.12)",
          }}>
          <div
            style={{
              height: 300,
              borderRadius: 24,
              background: "#fff",
              border: "1px solid #fca5a5",
              position: "relative",
              padding: 24,
            }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 24,
              }}>
              <div>
                <div style={{ fontSize: 16, color: "#ef4444", fontWeight: 700 }}>BloodBridge</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>Example Dashboard</div>
              </div>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 18,
                  background: "#fee2e2",
                  display: "grid",
                  placeItems: "center",
                  fontSize: 24,
                }}>
                ❤️
              </div>
            </div>
            <div style={{ display: "grid", gap: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div style={{ flex: 1, padding: 16, borderRadius: 18, background: "#fef2f2", color: "#991b1b" }}>
                  <div style={{ fontSize: 14, marginBottom: 6 }}>Active donors</div>
                    <div style={{ fontSize: 28, fontWeight: 700 }}>—</div>
                </div>
                <div style={{ flex: 1, padding: 16, borderRadius: 18, background: "#fef2f2", color: "#991b1b" }}>
                  <div style={{ fontSize: 14, marginBottom: 6 }}>Requests today</div>
                  <div style={{ fontSize: 28, fontWeight: 700 }}>—</div>
                </div>
              </div>
              <div style={{ padding: 18, borderRadius: 18, background: "#fff5f5", color: "#7f1d1d" }}>
                <div style={{ fontSize: 14, marginBottom: 8 }}>Fast response</div>
                <div style={{ fontWeight: 700, fontSize: 20 }}>View updates in your account</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
