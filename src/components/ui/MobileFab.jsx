import React from "react";
import { createPortal } from "react-dom";
import { BOTTOM_NAV_TOTAL_PX } from "../layout/BottomNav.jsx";

export default function MobileFab({ onClick, title = "記録する", label = "+", hidden = false }) {
  if (hidden) return null;
  const node = (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: `calc(${BOTTOM_NAV_TOTAL_PX}px + 16px + env(safe-area-inset-bottom))`,
        zIndex: 60,
        pointerEvents: "none",
      }}
    >
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "0 16px" }}>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClick}
            aria-label={title}
            title={title}
            style={{
              pointerEvents: "auto",
              width: 56,
              height: 56,
              borderRadius: 999,
              border: "none",
              background: "var(--terra)",
              color: "#fff",
              boxShadow: "0 10px 28px rgba(196,97,58,.38)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              userSelect: "none",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            {label === "+" ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
              </svg>
            ) : (
              <span style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{label}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  // `fade-up` animation uses transform; on iOS Safari a transformed ancestor can
  // break `position: fixed`. Portaling to body ensures viewport-fixed behavior.
  if (typeof document !== "undefined" && document.body) {
    return createPortal(node, document.body);
  }
  return node;
}

