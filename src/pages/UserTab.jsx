import React from "react";

export default function UserTab({ syncUserId, syncErr, onLogout, onOpenSettings }) {
  return (
    <div className="fade-up" style={{ padding: "24px 24px 56px" }}>
      <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: ".05em" }}>ユーザー</h2>

      <div style={{
        marginTop: 14,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "14px 16px",
      }}>
        <div style={{ fontSize: 9, letterSpacing: ".18em", color: "var(--muted)", textTransform: "uppercase" }}>
          Active user
        </div>
        <div style={{ marginTop: 6, fontSize: 14, fontWeight: 800, letterSpacing: ".01em", color: "var(--text)" }}>
          @{syncUserId || "—"}
        </div>
      </div>

      {syncErr && (
        <div style={{
          marginTop: 12,
          background: "rgba(196,97,58,.10)",
          border: "1px solid rgba(196,97,58,.28)",
          borderRadius: 12,
          padding: "12px 14px",
          color: "#7A3C22",
          fontSize: 12,
          lineHeight: 1.5,
        }}>
          同期エラー: {String(syncErr)}
        </div>
      )}

      <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
        <button
          type="button"
          onClick={onOpenSettings}
          style={{
            width: "100%",
            padding: "12px 14px",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: ".02em",
            color: "var(--text)",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          設定 / バックアップ / 更新
        </button>

        <button
          type="button"
          onClick={onLogout}
          style={{
            width: "100%",
            padding: "12px 14px",
            background: "none",
            border: "1px solid rgba(196,97,58,.35)",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: ".02em",
            color: "var(--terra)",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          ログアウト
        </button>
      </div>
    </div>
  );
}

