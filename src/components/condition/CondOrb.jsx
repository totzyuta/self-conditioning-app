import React from "react";
import { condColor } from "../../lib/format.js";

export default function CondOrb({ value, size = 42 }) {
  const c = condColor(value);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `${c}18`, border: `1.5px solid ${c}50`,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <span style={{
        fontSize: size * 0.26, fontWeight: 700, color: c,
        fontVariantNumeric: "tabular-nums", letterSpacing: "-0.5px",
      }}>
        {value != null ? value.toFixed(1) : "—"}
      </span>
    </div>
  );
}
