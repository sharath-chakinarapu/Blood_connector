import axios from "axios";

const rawBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";
const normalizedBase = rawBase.replace(/\/+$/, "");
const BASE = normalizedBase.endsWith("/api") ? normalizedBase : `${normalizedBase}/api`;

const API = axios.create({
  baseURL: BASE,
});

// attach token automatically
API.interceptors.request.use((req) => {
  try {
    const session = JSON.parse(localStorage.getItem("blood-connector-session") || "null");
    if (session?.accessToken) req.headers.Authorization = `Bearer ${session.accessToken}`;
  } catch {
    localStorage.removeItem("blood-connector-session");
  }
  return req;
});

export default API;