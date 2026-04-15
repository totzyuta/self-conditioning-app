import { safeJsonParse } from "./safeJson.js";

export const SESSION_KEY = "phl_sync_session_v2";

export function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    const p = safeJsonParse(raw);
    if (!p || typeof p.exp !== "number" || !p.userId || typeof p.password !== "string") return null;
    if (p.exp <= Date.now()) return null;
    return p;
  } catch {
    return null;
  }
}

export function writeSession(userId, password) {
  const exp = Date.now() + 30 * 24 * 60 * 60 * 1000;
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId, password, exp }));
  } catch {}
}

export function defaultLoginUserId() {
  try {
    const h = String(window.location?.hostname || "").toLowerCase();
    if (h === "localhost" || h === "127.0.0.1" || h === "::1" || h === "[::1]") return "totzyu_dev";
  } catch {}
  return "totzyu";
}
