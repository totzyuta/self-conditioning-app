import { createClient } from "@supabase/supabase-js";
import { checkSyncAuth } from "./lib/syncAuth.js";

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

export default async function handler(req, res) {
  // same-origin expected, but keep CORS preflight friendly
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-sync-password");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }

  const auth = checkSyncAuth(req);
  if (!auth.ok) return json(res, auth.status, { ok: false, error: auth.message });

  const stateId = auth.userId;

  try {
    const supabase = getSupabase();

    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("app_state")
        .select("logs_json, updated_at")
        .eq("id", stateId)
        .maybeSingle();
      if (error) return json(res, 500, { ok: false, error: error.message });

      return json(res, 200, {
        ok: true,
        id: stateId,
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
          .eq("id", stateId)
          .maybeSingle();
        if (curErr) return json(res, 500, { ok: false, error: curErr.message });
        if (cur) {
          const serverMs = cur.updated_at ? Date.parse(cur.updated_at) : 0;
          const clientMs = Date.parse(String(clientLast));
          if (Number.isFinite(clientMs) && serverMs && serverMs > clientMs) {
            return json(res, 409, {
              ok: false,
              error: "Conflict",
              conflict: true,
              server: {
                id: stateId,
                logs: cur.logs_json ?? [],
                updatedAt: cur.updated_at ?? null,
              },
            });
          }
        }
      }

      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("app_state")
        .upsert({ id: stateId, logs_json: logs, updated_at: nowIso }, { onConflict: "id" })
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

