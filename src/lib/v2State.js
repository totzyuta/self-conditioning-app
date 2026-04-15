export function emptyV2State(userId = "") {
  return {
    userId,
    conditionsByDate: {},
    trainingByDate: {},
  };
}

/** GET /api/v2/state のレスポンスをクライアント v2 状態に変換 */
export function buildV2StateFromRemote(remote) {
  const next = emptyV2State(remote.userId || "");
  next.userId = remote.userId || "";
  (remote.conditions || []).forEach(r => {
    if (!r?.date) return;
    next.conditionsByDate[r.date] = { score: r.score ?? null, updatedAt: r.updated_at || null };
  });
  (remote.trainingSessions || []).forEach(r => {
    if (!r?.date) return;
    next.trainingByDate[r.date] = {
      note: r.note || "",
      updatedAt: r.updated_at || null,
      items: { main: [], sub: [] },
      itemsUpdatedAtMax: null,
    };
  });
  (remote.trainingItems || []).forEach(r => {
    if (!r?.date) return;
    const slot = next.trainingByDate[r.date] || {
      note: "",
      updatedAt: null,
      items: { main: [], sub: [] },
      itemsUpdatedAtMax: null,
    };
    const cat = r.category === "sub" ? "sub" : "main";
    slot.items[cat].push({
      id: r.id,
      category: cat,
      exerciseName: r.exercise_name || "",
      weight: r.weight || "",
      reps: r.reps || "",
      sets: r.sets ?? null,
      sortOrder: r.sort_order ?? 0,
      updatedAt: r.updated_at || null,
    });
    if (r.updated_at) {
      slot.itemsUpdatedAtMax = !slot.itemsUpdatedAtMax || Date.parse(r.updated_at) > Date.parse(slot.itemsUpdatedAtMax)
        ? r.updated_at
        : slot.itemsUpdatedAtMax;
    }
    next.trainingByDate[r.date] = slot;
  });
  Object.keys(next.trainingByDate).forEach(d => {
    const t = next.trainingByDate[d];
    t.items.main.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    t.items.sub.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  });
  return next;
}

/** UI 用: V2 正規化データから日付一覧（文字列パースなし） */
export function daySummariesFromV2(v2) {
  const dates = new Set();
  Object.keys(v2.conditionsByDate || {}).forEach(d => dates.add(d));
  Object.keys(v2.trainingByDate || {}).forEach(d => dates.add(d));
  return Array.from(dates).sort().map(date => {
    const score = v2.conditionsByDate?.[date]?.score ?? null;
    const tr = v2.trainingByDate?.[date];
    const main = (tr?.items?.main || []).map(it => ({
      exerciseName: String(it.exerciseName || "").trim(),
      weight: String(it.weight || "").trim(),
      reps: String(it.reps || "").trim(),
    }));
    const sub = (tr?.items?.sub || []).map(it => ({
      exerciseName: String(it.exerciseName || "").trim(),
      weight: String(it.weight || "").trim(),
      reps: String(it.reps || "").trim(),
    }));
    const hasNote = !!(tr?.note && String(tr.note).trim());
    const hasItems = main.length > 0 || sub.length > 0;
    const type = (hasItems || hasNote) ? "training" : "rest";
    return {
      id: `v2_${date}`,
      date,
      condition: score,
      type,
      note: tr?.note || "",
      main,
      sub,
    };
  });
}

export function v2ItemsToFormRows(items) {
  const rows = (items || [])
    .map(it => ({
      name: String(it.exerciseName || "").trim(),
      weight: String(it.weight || "").trim(),
      reps: String(it.reps || "").trim(),
    }))
    .filter(r => r.name || r.weight || r.reps);
  return rows.length ? rows : [{ name: "", weight: "", reps: "" }];
}

export function formRowsToV2Items(mainRows, subRows) {
  const main = (mainRows || [])
    .filter(r => String(r.name || "").trim())
    .map((r, idx) => ({
      category: "main",
      exerciseName: String(r.name || "").trim(),
      weight: String(r.weight || "").trim(),
      reps: String(r.reps || "").trim(),
      sets: null,
      sortOrder: idx,
    }));
  const sub = (subRows || [])
    .filter(r => String(r.name || "").trim())
    .map((r, idx) => ({
      category: "sub",
      exerciseName: String(r.name || "").trim(),
      weight: String(r.weight || "").trim(),
      reps: String(r.reps || "").trim(),
      sets: null,
      sortOrder: idx,
    }));
  return [...main, ...sub];
}
