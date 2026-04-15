import React from "react";
import { fmtDate, formatRepsForDisplay, formatExerciseLine } from "../../lib/format.js";

export default function SessionMiniCard({ summary, label }) {
  if (!summary) return null;
  const isRest = summary.type === "rest";
  const d = fmtDate(summary.date);
  const mainNames = (summary.main || []).map(it => it.exerciseName).filter(Boolean).join(" / ");
  const mainDetails = (summary.main || []).map(it => [it.weight, formatRepsForDisplay(it.reps)].filter(Boolean).join(" ")).filter(Boolean).join(" / ");
  const subLine = (summary.sub || []).map(formatExerciseLine).filter(l => l && l !== "—").join(" · ");
  return (
    <div style={{ paddingBottom: 14, marginBottom: 14, borderBottom: "1px solid #F0EDE7" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 9, letterSpacing: ".15em", color: "var(--muted)", textTransform: "uppercase" }}>{label}</div>
        <div style={{ fontSize: 10, color: "var(--muted)" }}>{d.month}{d.day}日（{d.wdJA}）</div>
      </div>
      {isRest ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--muted)", fontSize: 13 }}>
          <span>🌿</span>
          <span>休息 {summary.note ? `— ${summary.note.slice(0, 30)}${summary.note.length > 30 ? "…" : ""}` : ""}</span>
        </div>
      ) : (
        <div>
          {mainNames && (
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: subLine ? 6 : 0 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--green)" }}>{mainNames}</span>
              {!!mainDetails && (
                <span style={{ fontSize: 12, color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{mainDetails}</span>
              )}
            </div>
          )}
          {!!subLine && (
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Sub: {subLine}</div>
          )}
        </div>
      )}
    </div>
  );
}
