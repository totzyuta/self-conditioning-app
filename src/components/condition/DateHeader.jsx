import React from "react";
import { fmtDate } from "../../lib/format.js";

export default function DateHeader({ dateStr }) {
  const d = fmtDate(dateStr);
  return (
    <div style={{
      display: "flex", alignItems: "baseline", gap: 10,
      justifyContent: "center",
      animation: "fadeDown .4s .05s both",
      userSelect: "none",
    }}>
      <span style={{
        fontSize: 13, color: "var(--muted)", letterSpacing: ".06em",
        fontVariantNumeric: "tabular-nums",
      }}>
        {d.month} {d.day}日
      </span>
      <span style={{ fontSize: 10, color: "#C8C4BC", letterSpacing: ".12em" }}>
        {d.wdJA}曜日
      </span>
    </div>
  );
}
