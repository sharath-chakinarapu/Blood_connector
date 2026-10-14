import { useNavigate } from "react-router-dom";
import HeroSection from "../components/HeroSection";
import { useAuth } from "../auth/useAuth";
import { fromApiRole } from "../api/domain";

export default function Home() {
  const navigate = useNavigate();
  const { user, status } = useAuth();
  const role = fromApiRole(user?.role);
  const dashboardPath = role === "HOSPITAL" || role === "hospital" ? "/dashboard" : "/find-donors";

  return (
    <main style={{ background: "#f8fafc", minHeight: "100vh", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 1220, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14, padding: "18px 0" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 999, background: "#fee2e2", color: "#b91c1c", fontWeight: 700, fontSize: 14 }}>
            🩸 BloodBridge
          </div>
          {status === "authenticated" && user ? (
            <button onClick={() => navigate(dashboardPath)}>Go to dashboard</button>
          ) : (
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => navigate("/login")}>Sign in</button>
              <button onClick={() => navigate("/register")}>Register</button>
            </div>
          )}
        </div>
        <HeroSection onRequestNow={() => navigate(status === "authenticated" ? dashboardPath : "/login")} />
        <section style={{ marginTop: 24, padding: 24, background: "white", borderRadius: 20 }}>
          <h2>Blood Connector</h2>
          <p>Donors can review relevant open requests and hospitals can find eligible nearby donors. Create an account or sign in to continue.</p>
          {status === "verification-error" && <p role="alert">Your saved session could not be verified. Visit the dashboard after the API connection is restored.</p>}
        </section>
      </div>
    </main>
  );
}
