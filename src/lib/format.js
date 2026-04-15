export function asNullableScore(value) {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function _parseHex(hex) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(String(hex || "").trim());
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function _mixHex(hexA, hexB, t) {
  const A = _parseHex(hexA);
  const B = _parseHex(hexB);
  if (!A || !B) return hexA;
  const u = Math.max(0, Math.min(1, t));
  const r = Math.round(A.r + (B.r - A.r) * u);
  const g = Math.round(A.g + (B.g - A.g) * u);
  const bl = Math.round(A.b + (B.b - A.b) * u);
  const h = (n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(bl)}`;
}

/**
 * スコア 0–10 の表示色（数値・スライダー・Orb・チャート線など）。
 * 5.0 を中立（--muted 相当）とし、低いほどクール、高いほどウォームへ連続変化。
 * 「高い＝良い」ではなく、両端はニュートラルからの偏りとして色分けする設計。
 */
export function condColor(v) {
  if (v == null) return "#9B9890";
  const n = Number(v);
  if (!Number.isFinite(n)) return "#9B9890";
  const x = Math.max(0, Math.min(10, n));
  const coolEnd = "#5A6470";
  const neutral = "#9B9890";
  const warmEnd = "#9D5E4E";
  if (x <= 5) {
    return _mixHex(coolEnd, neutral, x / 5);
  }
  return _mixHex(neutral, warmEnd, (x - 5) / 5);
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

/**
 * Tier color for condLabel() text only (Very low … Very high).
 * Discrete steps; same cool/warm story as condColor (not merit-based).
 */
export function condLabelColor(v) {
  if (v == null) return "#9B9890";
  const n = Number(v);
  if (!Number.isFinite(n)) return "#9B9890";
  if (n < 3) return "#5A6470";
  if (n < 4.5) return "#6D8E99";
  if (n <= 5.5) return "#6F7B68";
  if (n <= 7) return "#A77752";
  return "#9D5E4E";
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
