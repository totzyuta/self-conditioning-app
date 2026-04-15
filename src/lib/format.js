export function asNullableScore(value) {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function condColor(v) {
  if (v == null) return "#9B9890";
  if (v >= 7.5) return "#1F4A1A";
  if (v >= 6.5) return "#2D5A27";
  if (v >= 5.5) return "#4A8A44";
  if (v >= 5.0) return "#7CB877";
  if (v >= 4.0) return "#9B9890";
  if (v >= 3.0) return "#C48A6A";
  return "#C4613A";
}

/**
 * 0–10 スコアの帯ラベル（5.0 がニュートラル軸）。
 * 端は "Too low/high" ではなく Very low/high（価値判断を弱めた自己観察向けの語感）。
 *
 * 閾値: [0,3) [3,4.5) [4.5,5.5] (5.5,7] (7,10]
 */
export function condLabel(v) {
  if (v == null) return "—";
  if (v < 3) return "Very low";
  if (v < 4.5) return "Low";
  if (v <= 5.5) return "Neutral";
  if (v <= 7) return "High";
  return "Very high";
}

const WD_JA = ["日", "月", "火", "水", "木", "金", "土"];
const WD_EN = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MO_JA = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];

export function fmtDate(ds) {
  const d = new Date(ds + "T00:00:00");
  return {
    day: d.getDate(),
    month: MO_JA[d.getMonth()],
    year: d.getFullYear(),
    wdJA: WD_JA[d.getDay()],
    wdEN: WD_EN[d.getDay()],
    short: `${d.getMonth() + 1}/${d.getDate()}`,
    full: `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`,
    ts: d.getTime(),
  };
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatRepsForDisplay(reps) {
  const r = String(reps || "").trim();
  if (!r || r === "—") return "";
  return r.startsWith("(") && r.endsWith(")") ? r : `(${r})`;
}

export function formatExerciseLine(it) {
  const parts = [String(it.exerciseName || "").trim()].filter(Boolean);
  const w = String(it.weight || "").trim();
  if (w && w !== "—") parts.push(w);
  const rep = formatRepsForDisplay(it.reps);
  if (rep) parts.push(rep);
  return parts.join(" ") || "—";
}
