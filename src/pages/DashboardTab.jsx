import React, { useMemo } from "react";
import { condLabelColor } from "../lib/format.js";

export default function DashboardTab({
  v2,
  daySummaries,
  todayISO,
  condLabel,
  DateHeader,
  OSBar,
  ConditionChartCard,
  SessionMiniCard,
}) {
  const today = todayISO();
  const summaries = daySummaries || [];

  const todayCond = v2.conditionsByDate?.[today]?.score;
  const todayCondNote = (v2.conditionsByDate?.[today]?.note || "").trim();
  const bandLabelColor = todayCond != null ? condLabelColor(Number(todayCond)) : "#9B9890";

  const recentSessions = useMemo(() => {
    const sorted = [...summaries].sort((a, b) => new Date(b.date) - new Date(a.date));
    return sorted
      .filter(s => s.type === "training" || (s.type === "rest" && (s.main || []).some(m => m.exerciseName && m.exerciseName !== "—")))
      .slice(0, 2);
  }, [summaries]);

  return (
    <div style={{ padding: "32px 24px 48px" }}>
      <div style={{ marginBottom: 20 }}>
        <DateHeader dateStr={today} />
      </div>

      <div style={{
        textAlign: "center", marginBottom: 28,
        animation: "fadeUp .5s .2s both",
      }}>
        <div style={{ fontSize: 9, letterSpacing: ".28em", color: "var(--muted)", textTransform: "uppercase", marginBottom: 10 }}>
          Condition
        </div>
        <div style={{
          fontSize: 104, fontWeight: 100, color: "var(--green)",
          lineHeight: 1, letterSpacing: "-7px",
          fontVariantNumeric: "tabular-nums",
          animation: "countUp .6s .3s cubic-bezier(.22,1,.36,1) both",
        }}>
          {todayCond != null ? Number(todayCond).toFixed(1) : "—"}
        </div>
        <div style={{ marginTop: 10, animation: "fadeUp .4s .5s both" }}>
          {todayCond != null ? (
            <span style={{ fontSize: 12, color: bandLabelColor }}>{condLabel(Number(todayCond))}</span>
          ) : (
            <span style={{ fontSize: 11, color: "var(--muted)" }}>本日の記録なし</span>
          )}
        </div>
      </div>

      {todayCond != null && (
        <div style={{ marginBottom: 28, animation: "fadeUp .4s .6s both" }}>
          <OSBar value={Number(todayCond)} />
        </div>
      )}

      <div style={{ animation: "fadeUp .45s .7s both" }}>
        <ConditionChartCard v2={v2} defaultPeriod="1m" height={110} />
      </div>

      {todayCondNote.length > 0 && (
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 10, padding: "14px 18px", marginTop: 16,
          animation: "fadeUp .45s .75s both",
        }}>
          <div style={{ fontSize: 9, letterSpacing: ".28em", color: "var(--muted)", textTransform: "uppercase", marginBottom: 8 }}>
            Condition memo
          </div>
          <div style={{
            fontSize: 11, color: "#555", lineHeight: 1.65,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {todayCondNote}
          </div>
        </div>
      )}

      {recentSessions.length > 0 && (
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 10, padding: "16px 20px 4px", marginTop: 16,
          animation: "fadeUp .45s .8s both",
        }}>
          <div style={{ fontSize: 9, letterSpacing: ".28em", color: "var(--muted)", textTransform: "uppercase", marginBottom: 10 }}>
            Training Note
          </div>
          {recentSessions.map((s, i) => (
            <SessionMiniCard
              key={s.id}
              summary={s}
              label={s.date === today ? "Today" : i === 0 ? "Latest" : "Previous"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
