import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import API from "../api/axios";
import { AuthContext } from "./context";

const SESSION_KEY = "blood-connector-session";

function readSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
    if (session?.accessToken && session?.user?.role) return session;
  } catch {
    localStorage.removeItem(SESSION_KEY);
  }
  return null;
}

function normalizeUser(user) {
  if (!user?.id || !["DONOR", "HOSPITAL"].includes(user.role)) {
    throw new Error("The API returned an invalid account profile.");
  }
  return { ...user, role: user.role };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(readSession);
  const [status, setStatus] = useState(session ? "checking" : "anonymous");
  const [authError, setAuthError] = useState("");
  const sessionRef = useRef(session);

  const saveSession = useCallback((response) => {
    if (!response?.accessToken || !response?.user) {
      throw new Error("The API did not return a valid authentication response.");
    }
    const nextSession = {
      accessToken: response.accessToken,
      user: normalizeUser(response.user),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
    setStatus("authenticated");
    setAuthError("");
    return nextSession;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    ["token", "role", "userId", "userName"].forEach((key) => localStorage.removeItem(key));
    setSession(null);
    setStatus("anonymous");
    setAuthError("");
  }, []);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    if (!session?.accessToken) return;
    let active = true;

    API.get("/auth/me")
      .then(({ data }) => {
        if (!active) return;
        const validSession = { ...sessionRef.current, user: normalizeUser(data) };
        localStorage.setItem(SESSION_KEY, JSON.stringify(validSession));
        setSession(validSession);
        setStatus("authenticated");
        setAuthError("");
      })
      .catch((error) => {
        if (!active) return;
        if (error.response?.status === 401 || error.response?.status === 403) {
          logout();
          return;
        }
        setStatus("verification-error");
        setAuthError("Could not verify your session with the Java API. Check the API URL and connection, then retry.");
      });

    return () => {
      active = false;
    };
  }, [logout, session?.accessToken]);

  const retryVerification = useCallback(() => {
    if (session?.accessToken) {
      setStatus("checking");
      setAuthError("");
      API.get("/auth/me")
        .then(({ data }) => {
          const validSession = { ...session, user: normalizeUser(data) };
          localStorage.setItem(SESSION_KEY, JSON.stringify(validSession));
          setSession(validSession);
          setStatus("authenticated");
        })
        .catch((error) => {
          if (error.response?.status === 401 || error.response?.status === 403) {
            logout();
            return;
          }
          setStatus("verification-error");
          setAuthError("Could not verify your session with the Java API. Check the API URL and connection, then retry.");
        });
    }
  }, [logout, session]);

  const value = useMemo(() => ({
    session,
    user: status === "authenticated" ? session?.user ?? null : null,
    status,
    authError,
    saveSession,
    logout,
    retryVerification,
  }), [authError, logout, retryVerification, saveSession, session, status]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
