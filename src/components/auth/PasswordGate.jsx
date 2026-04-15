import React, { useEffect, useRef, useState } from "react";
import { LOGIN_ALLOWED } from "../../lib/constants.js";
import { writeSession, defaultLoginUserId } from "../../lib/session.js";

export default function PasswordGate({ onAuth }) {
  const [userIdIn, setUserIdIn] = useState(() => defaultLoginUserId());
  const [val, setVal]           = useState("");
  const [err, setErr]           = useState(false);
  const [shake, setShake]       = useState(false);
  const passRef = useRef(null);

  useEffect(() => { passRef.current && passRef.current.focus(); }, []);

  const attempt = () => {
    const uid = String(userIdIn || "").trim();
    const ok = LOGIN_ALLOWED.some(x => x.userId === uid && x.password === val);
    if (ok) {
      writeSession(uid, val);
      onAuth({ userId: uid, password: val });
    } else {
      setErr(true);
      setShake(true);
      setVal("");
      setTimeout(() => setShake(false), 400);
      setTimeout(() => setErr(false), 2200);
    }
  };

  const handleKey = e => { if (e.key === "Enter") attempt(); };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "var(--bg)", padding: "24px",
    }}>
      {/* Brand */}
      <div style={{ textAlign: "center", marginBottom: 48, animation: "fadeDown .5s both" }}>
        <div style={{
          fontSize: 9, letterSpacing: ".32em", color: "var(--muted)",
          textTransform: "uppercase", marginBottom: 10,
        }}>PERSONAL HEALTH LOG</div>
        <h1 style={{ fontSize: 22, fontWeight: 200, color: "var(--green)", letterSpacing: ".02em" }}>
          Self Conditioning App
        </h1>
        <div style={{ width: 32, height: 1, background: "var(--border)", margin: "18px auto 0" }} />
      </div>

      {/* Form box */}
      <div style={{
        width: "100%", maxWidth: 340,
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 12, padding: "32px 28px",
        animation: "fadeUp .5s .1s both",
        boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
      }}>
        {/* Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%",
            background: "var(--green-dim)", border: "1.5px solid var(--green)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 700, color: "var(--green)",
          }}>T</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>@totzyu</div>
            <div style={{ fontSize: 10, color: "var(--muted)", letterSpacing: ".06em", marginTop: 2 }}>PERSONAL ACCOUNT</div>
          </div>
        </div>

        <div style={{
          fontSize: 10, letterSpacing: ".14em", color: "var(--muted)",
          textTransform: "uppercase", marginBottom: 10,
        }}>ユーザーID</div>
        <input
          type="text"
          autoComplete="username"
          value={userIdIn}
          onChange={e => setUserIdIn(e.target.value)}
          onKeyDown={handleKey}
          placeholder="totzyu または totzyu_dev"
          style={{
            width: "100%", border: "1px solid var(--border)",
            background: "var(--surface)",
            padding: "11px 14px", fontSize: 15, fontFamily: "inherit",
            color: "var(--text)", borderRadius: 7, outline: "none",
            marginBottom: 14,
            letterSpacing: "0.04em",
          }}
        />

        <div style={{
          fontSize: 10, letterSpacing: ".14em", color: "var(--muted)",
          textTransform: "uppercase", marginBottom: 10,
        }}>パスワード</div>

        <div className={shake ? "shake" : ""}>
          <input
            ref={passRef}
            type="password"
            autoComplete="current-password"
            value={val}
            onChange={e => setVal(e.target.value)}
            onKeyDown={handleKey}
            placeholder="••••••••••"
            style={{
              width: "100%", border: `1px solid ${err ? "#C4613A" : "var(--border)"}`,
              background: err ? "#FBF0EB" : "var(--surface)",
              padding: "11px 14px", fontSize: 15, fontFamily: "inherit",
              color: "var(--text)", borderRadius: 7, outline: "none",
              transition: "border-color .2s, background .2s",
              letterSpacing: "0.15em",
            }}
          />
          {err && (
            <div style={{ fontSize: 11, color: "#C4613A", marginTop: 6, letterSpacing: ".03em" }}>
              ユーザーIDまたはパスワードが正しくありません
            </div>
          )}
        </div>

        <button
          onClick={attempt}
          style={{
            marginTop: 20, width: "100%", padding: "13px",
            background: "var(--green)", color: "#fff", border: "none",
            borderRadius: 7, fontSize: 14, fontWeight: 600,
            letterSpacing: ".07em", fontFamily: "inherit",
            transition: "opacity .15s",
            boxShadow: "0 3px 14px rgba(45,90,39,.22)",
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = ".85"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
        >
          ログイン
        </button>
      </div>

      <div style={{
        marginTop: 32, fontSize: 9, color: "#D0CDC5",
        letterSpacing: ".15em", animation: "fadeIn .5s .4s both",
      }}>
        OS SYSTEM · 5.0 NEUTRAL
      </div>
    </div>
  );
}
