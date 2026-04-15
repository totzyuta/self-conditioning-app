/**
 * Shared sync auth: SYNC_PASSWORD + ALLOWED_SYNC_USERS (comma-separated).
 * Requires req.query.user_id to match an allowed id.
 */
export function getAllowedUserIds() {
  const raw = process.env.ALLOWED_SYNC_USERS || "totzyu,totzyu_dev";
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

/**
 * @returns {{ ok: true, userId: string } | { ok: false, status: number, message: string }}
 */
export function checkSyncAuth(req) {
  const expected = process.env.SYNC_PASSWORD;
  if (!expected) return { ok: false, status: 500, message: "Missing SYNC_PASSWORD" };
  const got = req.headers["x-sync-password"];
  if (!got || got !== expected) return { ok: false, status: 401, message: "Unauthorized" };

  const q = req.query || {};
  const userId = (q.user_id || "").toString().trim();
  if (!userId) return { ok: false, status: 400, message: "user_id query parameter required" };

  const allowed = getAllowedUserIds();
  if (!allowed.includes(userId)) return { ok: false, status: 403, message: "Forbidden user_id" };

  return { ok: true, userId };
}
