import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../auth/useAuth";
import { fromApiRole } from "../api/domain";

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, status, logout } = useAuth();
  const role = fromApiRole(user?.role);
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadError, setUnreadError] = useState(false);
  const isLoggedIn = status === "authenticated" && Boolean(user);
  const dashboardPath = role === "hospital" ? "/dashboard" : "/find-donors";

  useEffect(() => {
    if (!isLoggedIn) return undefined;
    let active = true;
    API.get("/chats")
      .then(({ data }) => {
        if (!active) return;
        setUnreadCount(data.reduce((total, conversation) => total + (conversation.unreadCount || 0), 0));
        setUnreadError(false);
      })
      .catch(() => {
        if (!active) return;
        setUnreadCount(0);
        setUnreadError(true);
      });
    return () => {
      active = false;
    };
  }, [isLoggedIn, location.pathname]);

  return (
    <header className="site-header">
      <div className="navbar">
        <Link className="brand" to="/" aria-label="Blood Connector home" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark" aria-hidden="true">+</span>
          <span className="brand-copy"><strong>Blood Connector</strong><small>Care, connected.</small></span>
        </Link>
        <button
          className="menu-toggle"
          type="button"
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span /><span /><span />
        </button>
        <nav id="primary-navigation" className={`nav-links ${menuOpen ? "nav-links--open" : ""}`} aria-label="Main navigation">
          <NavLink className={({ isActive }) => `nav-link${isActive ? " nav-link--active" : ""}`} to="/" onClick={() => setMenuOpen(false)}>Home</NavLink>
          {isLoggedIn ? (
            <>
              <NavLink className={({ isActive }) => `nav-link${isActive ? " nav-link--active" : ""}`} to={dashboardPath} onClick={() => setMenuOpen(false)}>Dashboard</NavLink>
              <NavLink className={({ isActive }) => `nav-link${isActive ? " nav-link--active" : ""}`} to="/chats" onClick={() => setMenuOpen(false)}>
                Messages
                {unreadCount > 0 && <span className="unread-badge" aria-label={`${unreadCount} unread messages`}>{unreadCount}</span>}
              </NavLink>
              {unreadError && <span className="nav-status" role="status">Unread count unavailable</span>}
              <NavLink className={({ isActive }) => `nav-link${isActive ? " nav-link--active" : ""}`} to="/profile" onClick={() => setMenuOpen(false)}>Profile</NavLink>
              <button className="button button--quiet nav-logout" type="button" onClick={() => { setMenuOpen(false); logout(); navigate("/login"); }}>Sign out</button>
            </>
          ) : (
            <>
              <NavLink className={({ isActive }) => `nav-link${isActive ? " nav-link--active" : ""}`} to="/login" onClick={() => setMenuOpen(false)}>Sign in</NavLink>
              <Link className="button button--primary nav-register" to="/register" onClick={() => setMenuOpen(false)}>Create account</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
