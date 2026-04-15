import { createClient } from "@supabase/supabase-js";
import { checkSyncAuth } from "../lib/syncAuth.js";

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

/** FK: conditions / training_* reference public.users(id). Ensure row exists (idempotent). */
async function ensurePublicUser(supabase, userId) {
  const { error } = await supabase.from("users").upsert({ id: userId }, { onConflict: "id" });
  return error;
}

function asIsoDate(s) {
  const t = String(s || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return null;
  return t;
}

/** True when Postgres/PostgREST reports missing conditions.note (migration not applied yet). */
function isMissingConditionsNoteError(err) {
  const m = String(err?.message || "").toLowerCase();
  if (!m.includes("note")) return false;
  const aboutConditions = m.includes("conditions");
  const missing =
    m.includes("does not exist") ||
    m.includes("could not find") ||
    m.includes("unknown column") ||
    m.includes("schema cache");
  return aboutConditions && missing;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-sync-password");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }

  const auth = checkSyncAuth(req);
  if (!auth.ok) return json(res, auth.status, { ok: false, error: auth.message });

  try {
    const supabase = getSupabase();
    const userId = auth.userId;

    const userErr = await ensurePublicUser(supabase, userId);
    if (userErr) return json(res, 500, { ok: false, error: userErr.message });

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

      let conds = await rangeFilter(supabase.from("conditions").select("date, score, note, updated_at"));
      if (conds.error && isMissingConditionsNoteError(conds.error)) {
        conds = await rangeFilter(supabase.from("conditions").select("date, score, updated_at"));
        if (!conds.error && conds.data) {
          conds = { ...conds, data: conds.data.map((r) => ({ ...r, note: "" })) };
        }
      }

      const [sessions, items] = await Promise.all([
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
      const conditionNote = typeof body.conditionNote === "string" ? body.conditionNote : undefined;
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

      if (conditionScore !== undefined || conditionNote !== undefined) {
        let ex = await supabase
          .from("conditions")
          .select("score, note")
          .eq("user_id", userId)
          .eq("date", date)
          .maybeSingle();
        if (ex.error && isMissingConditionsNoteError(ex.error)) {
          ex = await supabase
            .from("conditions")
            .select("score")
            .eq("user_id", userId)
            .eq("date", date)
            .maybeSingle();
        }
        if (ex.error) return json(res, 500, { ok: false, error: ex.error.message });
        const prev = ex.data || null;
        const mergedScore = conditionScore !== undefined ? conditionScore : (prev?.score ?? null);
        const mergedNote = conditionNote !== undefined ? conditionNote : String(prev?.note ?? "");
        let up = await supabase
          .from("conditions")
          .upsert(
            { user_id: userId, date, score: mergedScore, note: mergedNote },
            { onConflict: "user_id,date" },
          )
          .select("updated_at")
          .single();
        if (up.error && isMissingConditionsNoteError(up.error)) {
          up = await supabase
            .from("conditions")
            .upsert(
              { user_id: userId, date, score: mergedScore },
              { onConflict: "user_id,date" },
            )
            .select("updated_at")
            .single();
        }
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

