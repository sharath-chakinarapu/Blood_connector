import { Link } from "react-router-dom";

export default function HeroSection({ onRequestNow, authenticated }) {
  return (
    <section className="hero-section">
      <div className="hero-copy">
        <span className="eyebrow hero-eyebrow">A clearer way to connect</span>
        <h1>When blood is needed, connection matters.</h1>
        <p className="hero-lead">
          Blood Connector helps donors and hospitals coordinate around nearby blood needs, with secure accounts and role-specific tools.
        </p>
        <div className="hero-actions">
          <button className="button button--primary button--large" type="button" onClick={onRequestNow}>
            {authenticated ? "Open your dashboard" : "Sign in"}
            <span aria-hidden="true">→</span>
          </button>
          {!authenticated && <Link className="button button--secondary button--large" to="/register">Create an account</Link>}
        </div>
        <p className="hero-note">Donor matching is private, location-based, and subject to donor eligibility.</p>
      </div>
      <div className="hero-visual" aria-label="Donors and hospitals coordinating care">
        <div className="hero-visual__glow" />
        <div className="hero-visual__card">
          <div className="hero-visual__card-top">
            <span className="brand-mark brand-mark--small" aria-hidden="true">+</span>
            <div><span className="hero-visual__overline">BLOOD CONNECTOR</span><strong>Care starts together</strong></div>
          </div>
          <div className="connection-graphic" aria-hidden="true">
            <div className="connection-node connection-node--donor"><span>●</span><small>Donor</small></div>
            <div className="connection-line"><i /><i /><i /></div>
            <div className="connection-node connection-node--hospital"><span>+</span><small>Hospital</small></div>
          </div>
          <div className="hero-visual__message">
            <span className="message-dot" />
            <div><strong>Find the right connection</strong><small>Securely. Nearby. When eligible.</small></div>
          </div>
        </div>
        <div className="hero-orbit hero-orbit--one" />
        <div className="hero-orbit hero-orbit--two" />
      </div>
    </section>
  );
}
