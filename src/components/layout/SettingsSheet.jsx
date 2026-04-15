import React from "react";

export default function SettingsSheet({
  onClose,
  updateAvailable,
  onConfirmUpdate,
  onBackup,
  onRestore,
  latestLocalBackup,
  latestRemoteBackup,
  isLocalhost,
  onSeed,
  onDeleteAll,
  onLogout,
  appVersion,
}) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "rgba(0,0,0,.4)", display: "flex",
      alignItems: "flex-end", justifyContent: "center",
      animation: "fadeUp .25s ease",
    }}>
      <div style={{
        background: "var(--surface)", borderRadius: "16px 16px 0 0",
        padding: "28px 24px", maxWidth: "100%", width: "100%",
        maxHeight: "80vh", overflowY: "auto",
        borderTop: "1px solid var(--border)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, letterSpacing: ".02em" }}>設定</h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none", border: "none", fontSize: 20,
              cursor: "pointer", color: "var(--muted)", padding: "4px 8px",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ gap: 16, display: "flex", flexDirection: "column" }}>
          <div>
            <div style={{
              fontSize: 11,
              color: updateAvailable ? "var(--terra)" : "var(--muted)",
              fontWeight: 700,
              letterSpacing: ".06em",
              marginBottom: 10,
            }}>
              {updateAvailable ? "新しいバージョンが利用可能です" : "すでに最新版です"}
            </div>
            <button
              type="button"
              onClick={onConfirmUpdate}
              style={{
                width: "100%",
                padding: "12px",
                background: updateAvailable ? "var(--terra)" : "var(--green)",
                color: "#fff",
                border: "none",
                borderRadius: 7,
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: ".06em",
                cursor: "pointer",
                transition: "opacity .2s",
              }}
              onMouseEnter={(e) => { e.target.style.opacity = "0.85"; }}
              onMouseLeave={(e) => { e.target.style.opacity = "1"; }}
            >
              {updateAvailable ? "アップデートを更新" : "最新版を確認"}
            </button>
          </div>

          <div style={{ paddingTop: 16, borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: ".06em", marginBottom: 10 }}>
              データ
            </div>
            <button
              type="button"
              onClick={onBackup}
              style={{
                width: "100%",
                padding: "12px",
                marginBottom: 10,
                background: "none",
                color: "var(--muted)",
                border: "1px solid var(--border)",
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: ".04em",
                cursor: "pointer",
              }}
            >
              ローカルにバックアップを保存
            </button>
            <button
              type="button"
              onClick={onRestore}
              style={{
                width: "100%",
                padding: "12px",
                background: "none",
                color: "var(--muted)",
                border: "1px solid var(--border)",
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: ".04em",
                cursor: "pointer",
              }}
            >
              最新バックアップから復元
            </button>
            <div style={{ marginTop: 10, fontSize: 11, color: "var(--muted)", lineHeight: 1.5, textAlign: "center" }}>
              最新バックアップ: {isLocalhost
                ? (latestLocalBackup ? new Date(latestLocalBackup.ts).toLocaleString() : "なし")
                : (latestRemoteBackup ? new Date(latestRemoteBackup.ts).toLocaleString() : "なし")}
            </div>

            {isLocalhost && (
              <>
                <button
                  type="button"
                  onClick={onSeed}
                  style={{
                    width: "100%",
                    padding: "12px",
                    marginTop: 12,
                    background: "none",
                    color: "var(--muted)",
                    border: "1px solid var(--border)",
                    borderRadius: 7,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: ".04em",
                    cursor: "pointer",
                  }}
                >
                  シードデータにリセット
                </button>

                <button
                  type="button"
                  onClick={onDeleteAll}
                  style={{
                    width: "100%",
                    padding: "12px",
                    marginTop: 10,
                    background: "none",
                    color: "var(--terra)",
                    border: "1px solid var(--terra)",
                    borderRadius: 7,
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: ".04em",
                    cursor: "pointer",
                  }}
                >
                  データを全て削除する
                </button>
              </>
            )}
          </div>

          <div style={{ paddingTop: 16, borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: ".06em", marginBottom: 10 }}>
              アカウント
            </div>
            <button
              type="button"
              onClick={onLogout}
              style={{
                width: "100%",
                padding: "12px",
                background: "none",
                color: "var(--text)",
                border: "1px solid var(--border)",
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: ".04em",
                cursor: "pointer",
              }}
            >
              ログアウト
            </button>
          </div>

          <div style={{ padding: "16px 0", borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: ".06em", marginBottom: 8 }}>
              アプリバージョン
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
              {appVersion}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
