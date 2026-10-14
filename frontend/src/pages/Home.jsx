import { useNavigate } from "react-router-dom";
import HeroSection from "../components/HeroSection";
import { useAuth } from "../auth/useAuth";
import { fromApiRole } from "../api/domain";

export default function Home() {
  const navigate = useNavigate();
  const { user, status, authError } = useAuth();
  const role = fromApiRole(user?.role);
  const dashboardPath = role === "hospital" ? "/dashboard" : "/find-donors";
  const authenticated = status === "authenticated" && Boolean(user);

  return (
    <main className="home-page">
      <div className="home-container">
        <HeroSection
          authenticated={authenticated}
          onRequestNow={() => navigate(authenticated ? dashboardPath : "/login")}
        />
        {status === "verification-error" && (
          <div className="alert-card alert-card--warning" role="alert">{authError}</div>
        )}
        <section className="home-intro">
          <div>
            <p className="eyebrow">BUILT FOR BOTH SIDES OF CARE</p>
            <h2>One trusted place to coordinate.</h2>
          </div>
          <div className="home-intro__grid">
            <article className="feature-card">
              <span className="feature-icon" aria-hidden="true">01</span>
              <h3>For donors</h3>
              <p>Manage your availability, review eligible nearby requests, and talk directly with a hospital through private conversations.</p>
            </article>
            <article className="feature-card">
              <span className="feature-icon" aria-hidden="true">02</span>
              <h3>For hospitals</h3>
              <p>Create and manage your own blood requests, find eligible nearby donors, and coordinate urgent needs.</p>
            </article>
            <article className="feature-card">
              <span className="feature-icon" aria-hidden="true">03</span>
              <h3>Privacy by design</h3>
              <p>Accounts are role-protected. Matching follows availability, location, blood group, and the 90-day donation interval.</p>
            </article>
          </div>
        </section>
        <footer className="home-footer">
          <span className="brand-mark brand-mark--small" aria-hidden="true">+</span>
          <span>Blood Connector</span>
          <span className="home-footer__note">A coordination tool — not a substitute for emergency medical services.</span>
        </footer>
      </div>
    </main>
  );
}
