/**
 * Base URL for sync API. In the browser (Vercel) use same-origin relative paths.
 * In Capacitor, set `VITE_API_BASE_URL` at build time to your deployed origin, e.g. `https://your-app.vercel.app`
 * (no trailing slash).
 */
export function getApiBaseUrl() {
  const raw = typeof import.meta !== "undefined" && import.meta.env?.VITE_API_BASE_URL;
  const s = raw != null ? String(raw).trim() : "";
  if (s) return s.replace(/\/$/, "");
  return "";
}

/** Prefix for `/api/...` fetches. Empty string means same-origin (web). */
export function apiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  const base = getApiBaseUrl();
  return base ? `${base}${p}` : p;
}
