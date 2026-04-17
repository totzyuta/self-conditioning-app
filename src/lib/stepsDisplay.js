/**
 * 歩数タブ: 未入力日は表示上 0 歩。DB / 同期の形は変えない。
 */

/** @param {{ steps?: number | null, note?: string } | null | undefined} row */
export function displayStepsValue(row) {
  if (!row) return 0;
  if (row.steps != null) {
    const n = Number(row.steps);
    return Number.isFinite(n) ? Math.trunc(n) : 0;
  }
  return 0;
}

/** 最古月算出用: 歩数またはメモが保存されている行 */
export function rowHasStoredStepsOrNote(row) {
  if (!row) return false;
  if (row.steps != null) return true;
  return String(row.note || "").trim().length > 0;
}

/**
 * stepsByDate 上で歩数・メモのいずれかがある最古の月 `YYYY-MM`。
 * 無ければ null。
 * @param {Record<string, { steps?: number | null, note?: string }>} stepsByDate
 */
export function earliestMonthWithStepsData(stepsByDate) {
  let min = null;
  for (const [date, row] of Object.entries(stepsByDate || {})) {
    if (!rowHasStoredStepsOrNote(row)) continue;
    const ym = date.slice(0, 7);
    if (!/^\d{4}-\d{2}$/.test(ym)) continue;
    if (min == null || ym < min) min = ym;
  }
  return min;
}

/** @param {string} ym `YYYY-MM` */
export function addCalendarMonths(ym, delta) {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** @param {string} ym */
export function clampMonth(ym, minYm, maxYm) {
  if (ym < minYm) return minYm;
  if (ym > maxYm) return maxYm;
  return ym;
}

/**
 * 今日を含む過去 n 日分の暦日（ローカル）を古い順で返す。
 * @param {number} dayCount
 */
export function localDatesAscEndingTodayInclusive(dayCount) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const dates = [];
  for (let i = dayCount - 1; i >= 0; i--) {
    const t = new Date(d.getFullYear(), d.getMonth(), d.getDate() - i);
    const iso = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
    dates.push(iso);
  }
  return dates;
}

/**
 * 月内の日付（`YYYY-MM-DD`）を新しい日付が先頭になるよう列挙。`todayIso` より未来は含めない。
 * @param {string} ym `YYYY-MM`
 * @param {string} todayIso `YYYY-MM-DD`
 */
export function monthDatesDescWithin(ym, todayIso) {
  const [y, m] = ym.split("-").map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  const out = [];
  for (let day = lastDay; day >= 1; day--) {
    const ds = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (ds > todayIso) continue;
    out.push(ds);
  }
  return out;
}
