import React from "react";
import { TABS } from "../../lib/constants.js";

export default function AppHeaderTabs({ syncUserId, tab, setTab, onToggleSettings }) {
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

          <button
            type="button"
            onClick={onToggleSettings}
            style={{
              background: "none", border: "none", padding: "6px",
              cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", color: "var(--muted)",
              transition: "color .2s", width: 32, height: 32,
              marginLeft: 4,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--green)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted)"; }}
            title="設定"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="2.5" />
              <circle cx="12" cy="12" r="8" />
              <line x1="12" y1="2" x2="12" y2="4" />
              <line x1="12" y1="20" x2="12" y2="22" />
              <line x1="2" y1="12" x2="4" y2="12" />
              <line x1="20" y1="12" x2="22" y2="12" />
              <line x1="4.93" y1="4.93" x2="6.36" y2="6.36" />
              <line x1="17.64" y1="17.64" x2="19.07" y2="19.07" />
              <line x1="19.07" y1="4.93" x2="17.64" y2="6.36" />
              <line x1="6.36" y1="17.64" x2="4.93" y2="19.07" />
            </svg>
          </button>
        </div>
      </div>

      <nav style={{ display: "flex", overflow: "hidden" }}>
        {TABS.map(t => (
          <button key={t.id} type="button" onClick={() => setTab(t.id)} style={{
            background: "none", border: "none", flex: 1,
            borderBottom: tab === t.id ? "2.5px solid var(--green)" : "2.5px solid transparent",
            padding: "8px 4px", fontSize: 11,
            color: tab === t.id ? "var(--green)" : "var(--muted)",
            fontWeight: tab === t.id ? 700 : 400,
            letterSpacing: ".01em", marginBottom: -1,
            transition: "color .2s,border-color .2s",
            whiteSpace: "nowrap",
          }}>
            {t.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
