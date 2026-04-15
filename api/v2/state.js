import { createClient } from "@supabase/supabase-js";

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

function asIsoDate(s) {
  const t = String(s || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null;
  return t;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-sync-password");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }

  const auth = checkAuth(req);
  if (!auth.ok) return json(res, auth.status, { ok: false, error: auth.message });

  try {
    const supabase = getSupabase();
    const userId = (req.query?.user_id || "user_default").toString();

    if (req.method === "DELETE") {
      const delItems = await supabase.from("training_items").delete().eq("user_id", userId);
      if (delItems.error) return json(res, 500, { ok: false, error: delItems.error.message });
      const delSessions = await supabase.from("training_sessions").delete().eq("user_id", userId);
      if (delSessions.error) return json(res, 500, { ok: false, error: delSessions.error.message });
      const delConds = await supabase.from("conditions").delete().eq("user_id", userId);
      if (delConds.error) return json(res, 500, { ok: false, error: delConds.error.message });
      return json(res, 200, { ok: true, userId, wiped: true });
    }

    if (req.method === "GET") {
      const from = req.query?.from ? asIsoDate(req.query.from) : null;
      const to = req.query?.to ? asIsoDate(req.query.to) : null;

      const rangeFilter = (q) => {
        let out = q.eq("user_id", userId);
        if (from) out = out.gte("date", from);
        if (to) out = out.lte("date", to);
        return out;
      };

      const [conds, sessions, items] = await Promise.all([
        rangeFilter(supabase.from("conditions").select("date, score, updated_at")),
        rangeFilter(supabase.from("training_sessions").select("date, note, updated_at")),
        rangeFilter(supabase.from("training_items").select("id, date, category, exercise_name, weight, reps, sets, sort_order, updated_at").order("date", { ascending: true }).order("sort_order", { ascending: true })),
      ]);

      if (conds.error) return json(res, 500, { ok: false, error: conds.error.message });
      if (sessions.error) return json(res, 500, { ok: false, error: sessions.error.message });
      if (items.error) return json(res, 500, { ok: false, error: items.error.message });

      return json(res, 200, {
        ok: true,
        userId,
        conditions: conds.data || [],
        trainingSessions: sessions.data || [],
        trainingItems: items.data || [],
      });
    }

    if (req.method === "PUT") {
      const body = typeof req.body === "string" ? (parseJsonMaybe(req.body) || {}) : (req.body || {});

      // Minimal payload: write a single day atomically-ish
      const date = asIsoDate(body.date);
      if (!date) return json(res, 400, { ok: false, error: "Invalid body: date (YYYY-MM-DD) required" });

      let conditionScore;
      if (body.conditionScore === null) conditionScore = null;
      else if (typeof body.conditionScore === "number" && Number.isFinite(body.conditionScore)) conditionScore = body.conditionScore;
      else if (typeof body.conditionScore === "string" && body.conditionScore.trim() !== "") {
        const n = Number(body.conditionScore);
        if (Number.isFinite(n)) conditionScore = n;
      }
      const note = typeof body.note === "string" ? body.note : undefined;
      const items = Array.isArray(body.items) ? body.items : undefined;

      // Optional optimistic concurrency: client can send last known timestamps for this date.
      const clientLast = body.clientLast || null; // { conditionsUpdatedAt, trainingSessionUpdatedAt, trainingItemsUpdatedAtMax }

      if (clientLast) {
        const checks = await Promise.all([
          supabase.from("conditions").select("updated_at").eq("user_id", userId).eq("date", date).maybeSingle(),
          supabase.from("training_sessions").select("updated_at").eq("user_id", userId).eq("date", date).maybeSingle(),
          supabase.from("training_items").select("updated_at").eq("user_id", userId).eq("date", date).order("updated_at", { ascending: false }).limit(1),
        ]);
        const [c0, s0, i0] = checks;
        if (c0.error) return json(res, 500, { ok: false, error: c0.error.message });
        if (s0.error) return json(res, 500, { ok: false, error: s0.error.message });
        if (i0.error) return json(res, 500, { ok: false, error: i0.error.message });

        const newer = (serverIso, clientIso) => {
          if (!serverIso || !clientIso) return false;
          const sm = Date.parse(serverIso);
          const cm = Date.parse(clientIso);
          return Number.isFinite(sm) && Number.isFinite(cm) && sm > cm;
        };

        const serverItemsMax = (i0.data && i0.data[0]?.updated_at) ? i0.data[0].updated_at : null;
        if (
          newer(c0.data?.updated_at, clientLast.conditionsUpdatedAt) ||
          newer(s0.data?.updated_at, clientLast.trainingSessionUpdatedAt) ||
          newer(serverItemsMax, clientLast.trainingItemsUpdatedAtMax)
        ) {
          return json(res, 409, { ok: false, conflict: true, error: "Conflict" });
        }
      }

      if (conditionScore !== undefined) {
        const up = await supabase
          .from("conditions")
          .upsert({ user_id: userId, date, score: conditionScore }, { onConflict: "user_id,date" })
          .select("updated_at")
          .single();
        if (up.error) return json(res, 500, { ok: false, error: up.error.message });
      }

      if (note !== undefined) {
        const up = await supabase
          .from("training_sessions")
          .upsert({ user_id: userId, date, note }, { onConflict: "user_id,date" })
          .select("updated_at")
          .single();
        if (up.error) return json(res, 500, { ok: false, error: up.error.message });
      }

      if (items !== undefined) {
        // Replace-all for the day: delete then insert. (Simple + predictable.)
        const del = await supabase.from("training_items").delete().eq("user_id", userId).eq("date", date);
        if (del.error) return json(res, 500, { ok: false, error: del.error.message });

        const rows = items
          .map((it, idx) => ({
            user_id: userId,
            date,
            category: it?.category === "sub" ? "sub" : "main",
            exercise_name: String(it?.exerciseName || "").trim(),
            weight: String(it?.weight || "").trim(),
            reps: String(it?.reps || "").trim(),
            sets: (typeof it?.sets === "number" ? it.sets : null),
            sort_order: typeof it?.sortOrder === "number" ? it.sortOrder : idx,
          }))
          .filter(r => r.exercise_name);

        if (rows.length) {
          const ins = await supabase.from("training_items").insert(rows);
          if (ins.error) return json(res, 500, { ok: false, error: ins.error.message });
        }
      }

      return json(res, 200, { ok: true });
    }

    return json(res, 405, { ok: false, error: "Method not allowed" });
  } catch (e) {
    return json(res, 500, { ok: false, error: e?.message || "Server error" });
  }
}

