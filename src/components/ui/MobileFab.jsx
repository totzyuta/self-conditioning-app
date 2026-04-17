import React from "react";
import { BOTTOM_NAV_TOTAL_PX } from "../layout/BottomNav.jsx";

export default function MobileFab({ onClick, title = "記録する", label = "+", hidden = false }) {
  if (hidden) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={title}
      title={title}
      style={{
        position: "fixed",
        right: 16,
        bottom: `calc(${BOTTOM_NAV_TOTAL_PX}px + 16px + env(safe-area-inset-bottom))`,
        width: 56,
        height: 56,
        borderRadius: 999,
        border: "none",
        background: "var(--terra)",
        color: "#fff",
        boxShadow: "0 10px 28px rgba(196,97,58,.38)",
        zIndex: 60,
        display: "grid",
        placeItems: "center",
        fontSize: 28,
        fontWeight: 700,
        lineHeight: 1,
        cursor: "pointer",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {label}
    </button>
  );
}

