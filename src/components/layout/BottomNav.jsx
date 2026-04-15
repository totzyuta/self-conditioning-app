import React from "react";
import { TABS } from "../../lib/constants.js";
import { iconForKey } from "../icons/TabIcons.jsx";

const BAR_H = 64;

export default function BottomNav({ tab, setTab }) {
  return (
    <nav
      aria-label="メインメニュー"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        background: "rgba(250, 248, 244, 0.86)",
        borderTop: "1px solid var(--border)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        paddingBottom: "calc(8px + env(safe-area-inset-bottom))",
      }}
    >
      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          height: BAR_H,
          display: "grid",
          gridTemplateColumns: `repeat(${TABS.length}, minmax(0, 1fr))`,
          alignItems: "center",
        }}
      >
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-current={active ? "page" : undefined}
              style={{
                background: "none",
                border: "none",
                padding: "10px 6px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 5,
                color: active ? "var(--green)" : "var(--muted)",
                fontWeight: active ? 700 : 600,
                letterSpacing: ".02em",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              <span style={{ lineHeight: 1, display: "flex" }}>
                {iconForKey(t.icon)}
              </span>
              <span style={{ fontSize: 10, whiteSpace: "nowrap" }}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export const BOTTOM_NAV_TOTAL_PX = BAR_H + 8;

