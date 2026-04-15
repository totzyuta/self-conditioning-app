import React from "react";

export default function UpdateAvailableBar({ visible, onOpenSettings }) {
  if (!visible) return null;
  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
      zIndex: 998, padding: "12px 16px", borderRadius: 8,
      background: "var(--terra)", color: "#fff",
      fontSize: 12, fontWeight: 600, letterSpacing: ".05em",
      boxShadow: "0 4px 12px rgba(196,97,58,.3)",
      animation: "slideUp .3s ease",
      cursor: "pointer",
      maxWidth: "90vw",
    }}
    onClick={onOpenSettings}
    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onOpenSettings(); }}
    role="button"
    tabIndex={0}
    title="設定を開く"
    >
      ✓ 新しいバージョンが利用可能 — タップして更新
    </div>
  );
}
