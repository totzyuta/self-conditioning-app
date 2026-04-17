import React, { useMemo } from "react";

const WD = ["日", "月", "火", "水", "木", "金", "土"];

function daysInMonth(year, month1) {
  return new Date(year, month1, 0).getDate();
}

/**
 * @param {{
 *  ym: string, // YYYY-MM
 *  todayIso: string, // YYYY-MM-DD
 *  summaryByDate: Record<string, any>,
 *  onSelectDate: (dateIso: string) => void,
 * }} props
 */
export default function TrainingMonthCalendar({ ym, todayIso, summaryByDate, onSelectDate }) {
  const grid = useMemo(() => {
    const [y, m] = ym.split("-").map(Number);
    const first = new Date(y, m - 1, 1);
    const pad = first.getDay(); // 0=Sun
    const dim = daysInMonth(y, m);
    const cells = [];
    for (let i = 0; i < pad; i++) cells.push(null);
    for (let d = 1; d <= dim; d++) {
      const ds = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const s = summaryByDate?.[ds] || null;
      cells.push({
        ds,
        day: d,
        isFuture: ds > todayIso,
        hasTraining: s?.type === "training",
      });
    }
    return cells;
  }, [ym, todayIso, summaryByDate]);

  return (
    <div style={{ padding: "10px 24px 0" }}>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 12px 10px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 8 }}>
          {WD.map((w, i) => (
            <div key={w} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: i === 0 ? "var(--terra)" : "var(--muted)" }}>
              {w}
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
          {grid.map((c, idx) => {
            if (!c) return <div key={`e_${idx}`} />;
            const active = c.hasTraining;
            const disabled = c.isFuture;
            return (
              <button
                key={c.ds}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && onSelectDate(c.ds)}
                style={{
                  background: active ? "rgba(45,90,39,.10)" : "var(--bg)",
                  border: `1px solid ${active ? "rgba(45,90,39,.25)" : "var(--border)"}`,
                  borderRadius: 10,
                  padding: "8px 0 7px",
                  cursor: disabled ? "not-allowed" : "pointer",
                  userSelect: "none",
                  opacity: disabled ? 0.45 : 1,
                }}
                title={disabled ? "未来の日付" : (active ? "トレーニング記録あり" : "未記録")}
              >
                <div style={{ fontSize: 12, fontWeight: 800, color: active ? "var(--green)" : "var(--text)", fontVariantNumeric: "tabular-nums" }}>
                  {c.day}
                </div>
                <div style={{ height: 6, marginTop: 3, display: "grid", placeItems: "center" }}>
                  {active ? <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--green)", display: "block" }} /> : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

