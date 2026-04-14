import { createClient } from "@supabase/supabase-js";

const STATE_ID = process.env.SYNC_STATE_ID || "default";

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function parseJsonMaybe(s) {
  try { return JSON.parse(s); } catch { return null; }
}

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

function checkAuth(req) {
  const expected = process.env.SYNC_PASSWORD;
  if (!expected) return { ok: false, status: 500, message: "Missing SYNC_PASSWORD" };
  const got = req.headers["x-sync-password"];
  if (!got || got !== expected) return { ok: false, status: 401, message: "Unauthorized" };
  return { ok: true };
}

export default async function handler(req, res) {
  // same-origin expected, but keep CORS preflight friendly
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-sync-password");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }

  const auth = checkAuth(req);
  if (!auth.ok) return json(res, auth.status, { ok: false, error: auth.message });

  try {
    const supabase = getSupabase();

    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("app_state")
        .select("logs_json, updated_at")
        .eq("id", STATE_ID)
        .single();
      if (error) return json(res, 500, { ok: false, error: error.message });

      return json(res, 200, {
        ok: true,
        id: STATE_ID,
        logs: data?.logs_json ?? [],
        updatedAt: data?.updated_at ?? null,
      });
    }

    if (req.method === "PUT") {
      const body = typeof req.body === "string" ? (parseJsonMaybe(req.body) || {}) : (req.body || {});
      const logs = Array.isArray(body.logs) ? body.logs : null;
      if (!logs) return json(res, 400, { ok: false, error: "Invalid body: logs must be an array" });

      // Optimistic concurrency: client can send x-last-updated-at (ISO string)
      // If the server has newer data, return 409 with current state.
      const clientLast = req.headers["x-last-updated-at"];
      if (clientLast) {
        const { data: cur, error: curErr } = await supabase
          .from("app_state")
          .select("logs_json, updated_at")
          .eq("id", STATE_ID)
          .single();
        if (curErr) return json(res, 500, { ok: false, error: curErr.message });
        const serverMs = cur?.updated_at ? Date.parse(cur.updated_at) : 0;
        const clientMs = Date.parse(String(clientLast));
        if (Number.isFinite(clientMs) && serverMs && serverMs > clientMs) {
          return json(res, 409, {
            ok: false,
            error: "Conflict",
            conflict: true,
            server: {
              id: STATE_ID,
              logs: cur?.logs_json ?? [],
              updatedAt: cur?.updated_at ?? null,
            },
          });
        }
      }

      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("app_state")
        .upsert({ id: STATE_ID, logs_json: logs, updated_at: nowIso }, { onConflict: "id" })
        .select("updated_at")
        .single();
      if (error) return json(res, 500, { ok: false, error: error.message });

      return json(res, 200, { ok: true, updatedAt: data?.updated_at ?? null });
    }

    return json(res, 405, { ok: false, error: "Method not allowed" });
  } catch (e) {
    return json(res, 500, { ok: false, error: e?.message || "Server error" });
  }
}

