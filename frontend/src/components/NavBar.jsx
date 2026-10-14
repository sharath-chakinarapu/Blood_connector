import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import API from "../api/axios";
import { useAuth } from "../auth/useAuth";
import { apiErrorMessage, fromApiRole } from "../api/domain";

export default function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, status, logout } = useAuth();
  const role = fromApiRole(user?.role);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadError, setUnreadError] = useState("");

  const isHome = location.pathname === "/";
  const isDashboard = location.pathname === "/dashboard" || location.pathname === "/find-donors";
  const isLoggedIn = status === "authenticated" && Boolean(user);

  useEffect(() => {
    if (!isLoggedIn) return undefined;
    let active = true;
    const loadUnread = async () => {
      try {
        const res = await API.get("/chats");
        if (!active) return;
        const count = res.data.reduce((total, conversation) => total + (conversation.unreadCount || 0), 0);
        setUnreadCount(count);
        setUnreadError("");
      } catch (requestError) {
        if (active) {
          setUnreadCount(0);
          setUnreadError(apiErrorMessage(requestError, "Unread message count could not be refreshed."));
        }
      }
    };
    loadUnread();
    return () => {
      active = false;
    };
  }, [location, isLoggedIn]);

  return (
    <div style={{ background: "white", color: "#0f172a", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", borderBottom: "1px solid #fee2e2" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <Link to="/" style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ fontWeight: 700, fontSize: 22 }}>BloodBridge</div>
          <div style={{ fontSize: 12, color: "#b91c1c" }}>Bridge between donor & receiver</div>
        </Link>
        {isDashboard && (
          <Link style={{ background: "#f87171", color: "white", borderRadius: 12, padding: "10px 14px", textDecoration: "none", fontWeight: 600 }} to="/">Home</Link>
        )}
        {isHome && isLoggedIn && (
          <Link style={{ background: "#f87171", color: "white", borderRadius: 12, padding: "10px 14px", textDecoration: "none", fontWeight: 600 }} to={role === "hospital" ? "/dashboard" : "/find-donors"}>Dashboard</Link>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {role === "hospital" && (
          <button title="Create SOS alert" style={{ background: "#fecaca", border: "none", borderRadius: 12, padding: "10px 14px", color: "#991b1b", cursor: "pointer", fontSize: 16 }} onClick={() => navigate("/dashboard")}>SOS</button>
        )}
        {isLoggedIn ? (
          <>
            <button title="Chats" style={{ background: "#f87171", border: "none", borderRadius: 12, padding: "10px 14px", color: "white", cursor: "pointer", fontSize: 16 }} onClick={() => navigate("/chats")}>💬{unreadCount > 0 && <span style={{ marginLeft: 6, background: "#ef4444", borderRadius: "50%", width: 18, height: 18, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>{unreadCount}</span>}</button>
            {unreadError && <span role="status" title={unreadError} style={{ color: "#991b1b", fontSize: 12 }}>Unread count unavailable</span>}
            <button title="Profile" style={{ background: "#f87171", border: "none", borderRadius: 12, padding: "10px 14px", color: "white", cursor: "pointer", fontSize: 16 }} onClick={() => navigate("/profile")}>👤</button>
            <button style={{ background: "#f87171", border: "none", borderRadius: 12, padding: "10px 14px", color: "white", cursor: "pointer" }} onClick={() => { logout(); navigate("/login"); }}>Logout</button>
          </>
        ) : (
          <>
            <Link style={{ background: "#b91c1c", color: "white", borderRadius: 12, padding: "10px 14px", textDecoration: "none", fontWeight: 600 }} to="/login">Sign In</Link>
            <Link style={{ background: "#ef4444", color: "white", borderRadius: 12, padding: "10px 14px", textDecoration: "none", fontWeight: 600 }} to="/register">Sign Up</Link>
          </>
        )}
      </div>
    </div>
  );
}
