import React from "react";

export default function AppHeaderTabs({ syncUserId }) {
  return (
    <header style={{
      padding: "20px 24px 0",
      borderBottom: "1px solid var(--border)",
      position: "sticky", top: 0,
      background: "var(--bg)", zIndex: 10,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 9, letterSpacing: ".28em", color: "var(--muted)", textTransform: "uppercase", marginBottom: 3 }}>
            PERSONAL HEALTH LOG
          </div>
          <h1 style={{ fontSize: 17, fontWeight: 300, color: "var(--green)", letterSpacing: ".01em" }}>
            Self Conditioning App
          </h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <div style={{
            width: 30, height: 30, borderRadius: "50%",
            background: "var(--green-dim)", border: "1.5px solid var(--green)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 700, color: "var(--green)",
            letterSpacing: "0",
          }}>T</div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text)", letterSpacing: ".01em" }}>@{syncUserId || "—"}</div>
            <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: ".06em", marginTop: 1 }}>ACTIVE</div>
          </div>
        </div>
      </div>
    </header>
  );
}
