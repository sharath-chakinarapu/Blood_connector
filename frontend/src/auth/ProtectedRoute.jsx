import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";

export default function ProtectedRoute({ roles }) {
  const { status, user, authError, retryVerification } = useAuth();
  const location = useLocation();

  if (status === "checking") {
    return <main role="status" style={{ padding: 32 }}>Verifying your session…</main>;
  }

  if (status === "verification-error") {
    return (
      <main role="alert" style={{ padding: 32, color: "#991b1b" }}>
        <p>{authError}</p>
        <button type="button" onClick={retryVerification}>Retry</button>
      </main>
    );
  }

  if (status !== "authenticated" || !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={user.role === "HOSPITAL" ? "/dashboard" : "/find-donors"} replace />;
  }

  return <Outlet />;
}
