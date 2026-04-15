import React from "react";
import { condColor } from "../../lib/format.js";

export default function OSBar({ value }) {
  const pct = (value / 10) * 100;
  const c = condColor(value);
  const diff = value - 5.0;
  return (
    <div>
      <div style={{
        display: "flex", justifyContent: "space-between",
        fontSize: 9, color: "var(--muted)", letterSpacing: "0.08em", marginBottom: 8,
      }}>
        <span>0</span><span>NEUTRAL  5.0</span><span>10</span>
      </div>
      <div style={{ height: 4, background: "var(--border)", borderRadius: 2, position: "relative" }}>
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0,
          width: `${pct}%`, borderRadius: 2,
          background: `linear-gradient(to right, var(--border) 50%, ${c} 50%)`,
          transition: "width .7s cubic-bezier(.34,1.56,.64,1)",
        }} />
        <div style={{
          position: "absolute", left: "50%", top: -5, bottom: -5,
          width: 1.5, background: "var(--muted)", opacity: .45, transform: "translateX(-50%)",
        }} />
        <div style={{
          position: "absolute", left: `${pct}%`, top: "50%",
          transform: "translate(-50%,-50%)",
          width: 13, height: 13, borderRadius: "50%",
          background: c, border: "2.5px solid var(--bg)",
          boxShadow: `0 0 0 1.5px ${c}60`,
          transition: "left .7s cubic-bezier(.34,1.56,.64,1)",
        }} />
      </div>
      <div style={{ marginTop: 10, textAlign: "center", fontSize: 11, letterSpacing: "0.02em" }}>
        <span style={{ color: c, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
          {diff >= 0 ? "+" : ""}{diff.toFixed(1)}
        </span>
      </div>
    </div>
  );
}
