import { safeJsonParse } from "./safeJson.js";

export function storageSk2(uid) {
  return `phl_tracker_v2__${uid}`;
}

export function loadLocalV2(userId) {
  if (!userId) return { state: null, updatedAtMs: 0 };
  const raw = localStorage.getItem(storageSk2(userId));
  if (!raw) return { state: null, updatedAtMs: 0 };
  const parsed = safeJsonParse(raw);
  if (!parsed || typeof parsed !== "object") return { state: null, updatedAtMs: 0 };
  const updatedAtMs = typeof parsed.updatedAtMs === "number" ? parsed.updatedAtMs : 0;
  const state = parsed.state && typeof parsed.state === "object" ? parsed.state : null;
  return { state, updatedAtMs };
}

export function saveLocalV2(userId, state, updatedAtMs = Date.now()) {
  if (!userId) return;
  try { localStorage.setItem(storageSk2(userId), JSON.stringify({ state, updatedAtMs })); } catch {}
}
