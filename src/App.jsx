import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import DashboardTab from "./pages/DashboardTab.jsx";
import ConditionTabPage from "./pages/ConditionTab.jsx";
import TrainingTabPage from "./pages/TrainingTab.jsx";
import { V2_SEED_DAYS } from "./seed/v2Seed.js";
import { APP_VERSION, LOGIN_ALLOWED, TABS } from "./lib/constants.js";
import { SESSION_KEY, readSession, writeSession, defaultLoginUserId } from "./lib/session.js";
import { storageSk2, loadLocalV2, saveLocalV2 } from "./lib/storageV2.js";
import { fetchRemoteStateV2, putRemoteDayV2, wipeRemoteStateV2 } from "./lib/apiV2.js";
import {
  emptyV2State,
  buildV2StateFromRemote,
  daySummariesFromV2,
  v2ItemsToFormRows,
  formRowsToV2Items,
} from "./lib/v2State.js";
import {
  asNullableScore,
  condColor,
  condLabel,
  fmtDate,
  todayISO,
  formatRepsForDisplay,
  formatExerciseLine,
} from "./lib/format.js";

/* ═══ Password Gate ═════════════════════════════════════ */
function PasswordGate({ onAuth }) {
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

/* ═══ Smooth SVG Line Chart ══════════════════════════════ */
function SmoothLineChart({
  points,
  w = 640,
  h = 130,
  showNeutral = true,
  showDateLabels = false,
  color = "#2D5A27",
  axisFontSize = 11,
  dateFontSize = 11,
  yMinFixed = 0,
  yMaxFixed = 10,
  yTicks = null, // e.g. [0,2,4,6,8,10]
}) {
  const [hovered, setHovered] = useState(null); // index of hovered point
  const svgRef = useRef(null);

  if (!points || points.length < 1) return null;
  const pad = {
    t: 22,
    r: 20,
    b: showDateLabels ? (dateFontSize + 26) : 28,
    l: axisFontSize >= 11 ? 40 : 32,
  };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;

  const xMin = points[0].x, xMax = points[points.length - 1].x;
  const yVals = points.map(p => p.y);
  // Keep y-axis stable (native-app-like): fixed 0..10 unless overridden.
  const yMin = typeof yMinFixed === "number" ? yMinFixed : Math.max(0, Math.min(...yVals) - 0.8);
  const yMax = typeof yMaxFixed === "number" ? yMaxFixed : Math.min(10, Math.max(...yVals) + 0.8);
  const yRange = yMax - yMin || 1;
  const xRange = xMax - xMin || 1;

  const toX = v => pad.l + ((v - xMin) / xRange) * iw;
  const toY = v => pad.t + ih - ((v - yMin) / yRange) * ih;

  const pts = points.map(p => ({ ...p, px: toX(p.x), py: toY(p.y) }));

  function catmullRom(arr) {
    if (arr.length < 2) return arr.length === 1 ? `M${arr[0].px},${arr[0].py}` : "";
    const t = 0.12;
    let d = `M${arr[0].px},${arr[0].py}`;
    for (let i = 0; i < arr.length - 1; i++) {
      const p0 = arr[Math.max(0, i-1)], p1 = arr[i];
      const p2 = arr[i+1], p3 = arr[Math.min(arr.length-1, i+2)];
      const cp1x = p1.px + (p2.px - p0.px) * t;
      const cp1y = p1.py + (p2.py - p0.py) * t;
      const cp2x = p2.px - (p3.px - p1.px) * t;
      const cp2y = p2.py - (p3.py - p1.py) * t;
      d += ` C${cp1x},${cp1y},${cp2x},${cp2y},${p2.px},${p2.py}`;
    }
    return d;
  }

  // Find nearest point to pointer X
  const handlePointer = (e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = w / rect.width;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const svgX = (clientX - rect.left) * scaleX;
    let best = 0, bestDist = Infinity;
    pts.forEach((p, i) => {
      const d = Math.abs(p.px - svgX);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    setHovered(best);
  };

  const linePath = catmullRom(pts);
  const last = pts[pts.length - 1];
  const areaPath = `${linePath} L${last.px},${pad.t+ih} L${pts[0].px},${pad.t+ih} Z`;
  const neutralY = toY(5.0);

  const yLabels = Array.isArray(yTicks) && yTicks.length
    ? yTicks.slice()
    : (() => {
      const ys = [];
      for (let v = Math.ceil(yMin); v <= Math.floor(yMax); v++) {
        ys.push(v);
      }
      return ys;
    })();

  const hp = hovered != null ? pts[hovered] : null;
  const tooltipX = hp ? Math.min(Math.max(hp.px, pad.l + 24), pad.l + iw - 24) : 0;
  const TOOLTIP_W = 64;
  const TOOLTIP_H = 50;
  const TOOLTIP_GAP = 14; // space between point and tooltip (finger-friendly)
  const tooltipTop = hp ? Math.max(hp.py - (TOOLTIP_H + TOOLTIP_GAP), pad.t + 2) : 0;

  // Date labels: show up to ~6 evenly-spaced labels along x axis
  const dateLabels = [];
  if (showDateLabels && pts.length >= 2) {
    const step = Math.max(1, Math.ceil(pts.length / 6));
    pts.forEach((p, i) => {
      if (i === 0 || i === pts.length - 1 || i % step === 0) {
        dateLabels.push(p);
      }
    });
    // deduplicate by px, then drop colliding labels (left -> right)
    const seen = new Set();
    const deduped = dateLabels.filter(p => {
      const k = Math.round(p.px);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).sort((a, b) => a.px - b.px);

    const approxTextW = (label) => {
      // Rough width estimate for "M/D" in proportional fonts
      const len = (label || "").length;
      return Math.max(18, len * dateFontSize * 0.62);
    };

    const safeL = pad.l + 2;
    const safeR = pad.l + iw - 2;
    const GAP = 8; // px between labels to avoid overlap

    const kept = [];
    let prevRight = -Infinity;
    deduped.forEach((p, i) => {
      const label = p.label;
      const wText = approxTextW(label);
      const isFirst = i === 0;
      const isLast = i === deduped.length - 1;

      // Anchor + x clamp to keep edges inside chart area
      let anchor = "middle";
      let x = p.px;
      if (isFirst) anchor = "start";
      if (isLast) anchor = "end";

      if (anchor === "start") x = Math.max(safeL, Math.min(x, safeR - wText));
      else if (anchor === "end") x = Math.max(safeL + wText, Math.min(x, safeR));
      else x = Math.max(safeL + wText / 2, Math.min(x, safeR - wText / 2));

      const left = anchor === "start" ? x : anchor === "end" ? (x - wText) : (x - wText / 2);
      const right = anchor === "start" ? (x + wText) : anchor === "end" ? x : (x + wText / 2);

      if (left >= prevRight + GAP) {
        kept.push({ ...p, px: x, _anchor: anchor });
        prevRight = right;
      }
    });

    dateLabels.length = 0;
    kept.forEach(p => dateLabels.push(p));
  }

  return (
    <svg
      ref={svgRef}
      width="100%" viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block", overflow: "visible", cursor: "crosshair" }}
      onMouseMove={handlePointer}
      onMouseLeave={() => setHovered(null)}
      onTouchStart={handlePointer}
      onTouchMove={e => { e.preventDefault(); handlePointer(e); }}
      onTouchEnd={() => setHovered(null)}
    >
      {yLabels.map(v => (
        <line key={v} x1={pad.l} y1={toY(v)} x2={pad.l+iw} y2={toY(v)}
          stroke="#E4E1D8" strokeWidth={1} />
      ))}
      {showNeutral && neutralY >= pad.t && neutralY <= pad.t+ih && (
        <line x1={pad.l} y1={neutralY} x2={pad.l+iw} y2={neutralY}
          stroke="#9B9890" strokeWidth={1} strokeDasharray="4,3" opacity={0.6} />
      )}
      <path d={areaPath} fill={`${color}12`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={2.5}
        strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.px} cy={p.py}
          r={hovered === i ? 7 : 4}
          fill={color} stroke="var(--bg)" strokeWidth={2.5}
          style={{ transition: "r .1s" }}
        />
      ))}
      {yLabels.map(v => (
        <text key={v} x={pad.l - 5} y={toY(v) + 3.5} textAnchor="end"
          fontSize={axisFontSize} fill="#9B9890">{v}</text>
      ))}
      {showNeutral && neutralY >= pad.t && neutralY <= pad.t+ih && (
        <text x={pad.l + iw + 4} y={neutralY + 3} fontSize={axisFontSize} fill="#9B9890">±0</text>
      )}
      {/* Date labels along x axis */}
      {showDateLabels && dateLabels.map((p, i) => (
        <text key={i} x={p.px} y={pad.t + ih + (dateFontSize + 8)}
          textAnchor={p._anchor || "middle"} fontSize={dateFontSize} fill="#9B9890">{p.label}</text>
      ))}
      {/* Hover tooltip */}
      {hp && (
        <g>
          <line x1={hp.px} y1={pad.t} x2={hp.px} y2={pad.t+ih}
            stroke={color} strokeWidth={1} strokeDasharray="3,2" opacity={0.35} />
          <rect x={tooltipX - (TOOLTIP_W / 2)} y={tooltipTop} width={TOOLTIP_W} height={TOOLTIP_H}
            rx={6} fill={color} opacity={0.93} />
          <text x={tooltipX} y={tooltipTop + 18} textAnchor="middle"
            fontSize={11} fill="#fff" opacity={0.9}>{hp.label}</text>
          <text x={tooltipX} y={tooltipTop + 38} textAnchor="middle"
            fontSize={16} fill="#fff" fontWeight="700">{hp.y.toFixed(1)}</text>
        </g>
      )}
    </svg>
  );
}

/* ═══ Date Header (compact, subdued) ════════════════════ */
function DateHeader({ dateStr }) {
  const d = fmtDate(dateStr);
  return (
    <div style={{
      display: "flex", alignItems: "baseline", gap: 10,
      justifyContent: "center",
      animation: "fadeDown .4s .05s both",
      userSelect: "none",
    }}>
      <span style={{
        fontSize: 13, color: "var(--muted)", letterSpacing: ".06em",
        fontVariantNumeric: "tabular-nums",
      }}>
        {d.month} {d.day}日
      </span>
      <span style={{ fontSize: 10, color: "#C8C4BC", letterSpacing: ".12em" }}>
        {d.wdJA}曜日
      </span>
    </div>
  );
}

/* ═══ Condition Chart Card (shared module) ═══════════════ */
const PERIODS = [
  { key: "1w", label: "1W", days: 7 },
  { key: "1m", label: "1M", days: 30 },
  { key: "3m", label: "3M", days: 90 },
  { key: "6m", label: "6M", days: 180 },
  { key: "1y", label: "1Y", days: 365 },
];

const LABEL_S = {
  display: "block", fontSize: 10, letterSpacing: ".15em",
  color: "var(--muted)", textTransform: "uppercase", marginBottom: 10,
};

function useIsMobile(breakpointPx = 520) {
  const [isMobile, setIsMobile] = useState(() => {
    try { return window.matchMedia(`(max-width:${breakpointPx}px)`).matches; } catch { return false; }
  });

  useEffect(() => {
    let mql;
    try { mql = window.matchMedia(`(max-width:${breakpointPx}px)`); } catch { return; }
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    if (mql.addEventListener) mql.addEventListener("change", onChange);
    else mql.addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener("change", onChange);
      else mql.removeListener(onChange);
    };
  }, [breakpointPx]);

  return isMobile;
}

function useElementWidth(ref) {
  const [w, setW] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => setW(el.getBoundingClientRect().width || 0);
    update();

    if (!("ResizeObserver" in window)) {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }

    const ro = new ResizeObserver(() => update());
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  return w;
}

function ConditionChartCard({ v2, defaultPeriod = "1m", height = 140, showRecord = false, onUpdateCondition }) {
  const [period, setPeriod]   = useState(defaultPeriod);
  const [date, setDate]       = useState(todayISO());
  const [cond, setCond]       = useState(5.0);
  const [saved, setSaved]     = useState(false);
  const isMobile = useIsMobile(520);
  const chartWrapRef = useRef(null);
  const wrapW = useElementWidth(chartWrapRef);
  const chartW = wrapW ? Math.max(320, Math.min(700, Math.round(wrapW))) : 640;

  useEffect(() => {
    const row = v2.conditionsByDate?.[date];
    const v = row?.score;
    setCond(v != null ? Number(v) : 5.0);
  }, [date, v2]);

  const periodDays = PERIODS.find(p => p.key === period).days;
  const cutoff = Date.now() - periodDays * 86400000;

  const chartPoints = useMemo(() => {
    return Object.entries(v2.conditionsByDate || {})
      .filter(([d, row]) => row && row.score != null && new Date(`${d}T00:00:00`).getTime() >= cutoff)
      .map(([d, row]) => ({
        x: new Date(`${d}T00:00:00`).getTime(),
        y: Number(row.score),
        label: fmtDate(d).short,
      }))
      .sort((a, b) => a.x - b.x);
  }, [v2, period, cutoff]);

  const withCond = chartPoints.map(p => p.y);
  const avg  = withCond.length ? (withCond.reduce((a,b)=>a+b,0)/withCond.length) : null;
  const maxV = withCond.length ? Math.max(...withCond) : null;
  const minV = withCond.length ? Math.min(...withCond) : null;

  const existingRow = v2.conditionsByDate?.[date];
  const existingCond = existingRow?.score != null ? Number(existingRow.score) : null;
  const cv = parseFloat(cond);
  const cc = condColor(cv);
  const pct = (cv / 10) * 100;

  const handleSave = () => {
    if (onUpdateCondition) {
      onUpdateCondition(date, cv);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 10, padding: "18px 18px 12px",
    }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 8 }}>
        <div style={{ fontSize: 9, letterSpacing: ".18em", color: "var(--muted)", textTransform: "uppercase", whiteSpace: "nowrap" }}>
          コンディション推移
        </div>
        {/* Period selector — wraps on very narrow screens */}
        <div style={{ display: "flex", gap: 3, flexWrap: "nowrap" }}>
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => setPeriod(p.key)} style={{
              background: period === p.key ? "var(--green)" : "none",
              color: period === p.key ? "#fff" : "var(--muted)",
              border: `1px solid ${period === p.key ? "var(--green)" : "var(--border)"}`,
              borderRadius: 4, padding: "4px 7px",
              fontSize: 9, fontWeight: 700, letterSpacing: ".04em",
              minWidth: 28, textAlign: "center",
              transition: "all .15s",
            }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {chartPoints.length >= 2 ? (
        <>
          <div ref={chartWrapRef}>
            <SmoothLineChart
              points={chartPoints}
              w={chartW}
              h={isMobile ? Math.round(height * 1.5) : height}
              showNeutral={true}
              showDateLabels={true}
              axisFontSize={11}
              dateFontSize={11}
              yMinFixed={0}
              yMaxFixed={10}
              yTicks={[0, 2, 4, 6, 8, 10]}
            />
          </div>
          {/* Stats row */}
          <div style={{ display: "flex", borderTop: "1px solid var(--border)", marginTop: 12 }}>
            {[
              { label: "平均", val: avg != null ? avg.toFixed(2) : "—" },
              { label: "最高", val: maxV != null ? maxV.toFixed(1) : "—" },
              { label: "最低", val: minV != null ? minV.toFixed(1) : "—" },
              { label: "記録", val: withCond.length },
            ].map((s, i) => (
              <div key={i} style={{
                flex: 1, textAlign: "center", padding: "10px 4px",
                borderRight: i < 3 ? "1px solid var(--border)" : "none",
              }}>
                <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: ".08em", marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontSize: 15, fontWeight: 300, color: "var(--green)", letterSpacing: "-0.5px" }}>{s.val}</div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted)", fontSize: 12 }}>
          この期間のコンディションデータがありません
        </div>
      )}

      {/* Optional record form */}
      {showRecord && (
        <div style={{ borderTop: "1px solid var(--border)", marginTop: 16, paddingTop: 18 }}>
          <div style={{ fontSize: 10, letterSpacing: ".15em", color: "var(--muted)", textTransform: "uppercase", marginBottom: 14 }}>
            記録する
          </div>
          <div style={{ marginBottom: 18, overflow: "hidden" }}>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box", padding: "7px 6px", fontSize: "16px" }} />
            {existingCond != null && (
              <div style={{ marginTop: 5, fontSize: 11, color: "var(--muted)" }}>
                記録済み: <span style={{ color: condColor(existingCond), fontWeight: 700 }}>{existingCond.toFixed(1)}</span>（上書き可）
              </div>
            )}
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 9, letterSpacing: ".15em", color: "var(--muted)", textTransform: "uppercase" }}>コンディション</span>
              <span style={{ fontSize: 24, fontWeight: 100, color: cc, letterSpacing: "-1px", fontVariantNumeric: "tabular-nums" }}>{cv.toFixed(1)}</span>
              <span style={{ fontSize: 9, color: cc, fontWeight: 700 }}>{cv >= 5 ? "+" : ""}{(cv-5).toFixed(1)}</span>
            </div>
            <input type="range" min="0" max="10" step="0.1" value={cond}
              onChange={e => setCond(e.target.value)}
              style={{ background: `linear-gradient(to right, ${cc} ${pct}%, var(--border) ${pct}%)` }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--muted)", marginTop: 4 }}>
              <span>0</span><span>NEUTRAL 5.0</span><span>10</span>
            </div>
          </div>
          <button onClick={handleSave} style={{
            width: "100%", padding: "12px",
            background: saved ? "var(--green)" : "var(--terra)",
            color: "#fff", border: "none", borderRadius: 7,
            fontSize: 13, fontWeight: 600, letterSpacing: ".06em",
            transition: "background .35s",
          }}>
            {saved ? "✓  保存しました" : "記録する"}
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══ Condition Orb ══════════════════════════════════════ */
function CondOrb({ value, size = 42 }) {
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

/* ═══ OS Bar ═════════════════════════════════════════════ */
function OSBar({ value }) {
  const pct = (value / 10) * 100;
  const c = condColor(value);
  const diff = value - 5.0;
  return (
    <div>
      <div style={{
        display: "flex", justifyContent: "space-between",
        fontSize: 9, color: "var(--muted)", letterSpacing: "0.08em", marginBottom: 8,
      }}>
        <span>0</span><span>NEUTRAL  5.0</span><span>10</span>
      </div>
      <div style={{ height: 4, background: "var(--border)", borderRadius: 2, position: "relative" }}>
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0,
          width: `${pct}%`, borderRadius: 2,
          background: `linear-gradient(to right, var(--border) 50%, ${c} 50%)`,
          transition: "width .7s cubic-bezier(.34,1.56,.64,1)",
        }} />
        <div style={{
          position: "absolute", left: "50%", top: -5, bottom: -5,
          width: 1.5, background: "var(--muted)", opacity: .45, transform: "translateX(-50%)",
        }} />
        <div style={{
          position: "absolute", left: `${pct}%`, top: "50%",
          transform: "translate(-50%,-50%)",
          width: 13, height: 13, borderRadius: "50%",
          background: c, border: "2.5px solid var(--bg)",
          boxShadow: `0 0 0 1.5px ${c}60`,
          transition: "left .7s cubic-bezier(.34,1.56,.64,1)",
        }} />
      </div>
      <div style={{ marginTop: 10, textAlign: "center", fontSize: 10, color: "var(--muted)", letterSpacing: "0.07em" }}>
        OS DELTA:{" "}
        <span style={{ color: c, fontWeight: 700 }}>{diff >= 0 ? "+" : ""}{diff.toFixed(1)}</span>
        <span style={{ margin: "0 8px", opacity: .4 }}>·</span>
        <span style={{ color: c }}>{condLabel(value)}</span>
      </div>
    </div>
  );
}

/* ═══ Session Mini Card ═════════════════════════════════ */
function SessionMiniCard({ summary, label }) {
  if (!summary) return null;
  const isRest = summary.type === "rest";
  const d = fmtDate(summary.date);
  const mainNames = (summary.main || []).map(it => it.exerciseName).filter(Boolean).join(" / ");
  const mainDetails = (summary.main || []).map(it => [it.weight, formatRepsForDisplay(it.reps)].filter(Boolean).join(" ")).filter(Boolean).join(" / ");
  const subLine = (summary.sub || []).map(formatExerciseLine).filter(l => l && l !== "—").join(" · ");
  return (
    <div style={{ paddingBottom: 14, marginBottom: 14, borderBottom: "1px solid #F0EDE7" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 9, letterSpacing: ".15em", color: "var(--muted)", textTransform: "uppercase" }}>{label}</div>
        <div style={{ fontSize: 10, color: "var(--muted)" }}>{d.month}{d.day}日（{d.wdJA}）</div>
      </div>
      {isRest ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--muted)", fontSize: 13 }}>
          <span>🌿</span>
          <span>休息 {summary.note ? `— ${summary.note.slice(0, 30)}${summary.note.length > 30 ? "…" : ""}` : ""}</span>
        </div>
      ) : (
        <div>
          {mainNames && (
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", marginBottom: subLine ? 6 : 0 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "var(--green)" }}>{mainNames}</span>
              {!!mainDetails && (
                <span style={{ fontSize: 12, color: "var(--muted)", fontVariantNumeric: "tabular-nums" }}>{mainDetails}</span>
              )}
            </div>
          )}
          {!!subLine && (
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>Sub: {subLine}</div>
          )}
        </div>
      )}
    </div>
  );
}

function TrainingRecordScreen({ onClose, onSubmit, onDelete, v2, initialDate, editDate }) {
  const [date, setDate] = useState(initialDate || todayISO());
  const [mainExs, setMainExs] = useState([{ name: "", weight: "", reps: "" }]);
  const [subExs, setSubExs]   = useState([{ name: "", weight: "", reps: "" }]);
  const [note, setNote]       = useState("");
  const [saved, setSaved]     = useState(false);

  useEffect(() => {
    const d = editDate || initialDate || todayISO();
    setDate(d);
  }, [editDate, initialDate]);

  useEffect(() => {
    const tr = v2.trainingByDate?.[date];
    setMainExs(v2ItemsToFormRows(tr?.items?.main));
    setSubExs(v2ItemsToFormRows(tr?.items?.sub));
    setNote(tr?.note || "");
    setSaved(false);
  }, [date, v2]);

  const canDelete = useMemo(() => {
    const tr = v2.trainingByDate?.[date];
    const m = (tr?.items?.main || []).filter(it => String(it.exerciseName || "").trim()).length;
    const s = (tr?.items?.sub || []).filter(it => String(it.exerciseName || "").trim()).length;
    const n = (tr?.note || "").trim().length;
    return m + s > 0 || n > 0;
  }, [date, v2]);

  const updMain = (i, k, v) => setMainExs(a => { const n=[...a]; n[i]={...n[i],[k]:v}; return n; });
  const updSub  = (i, k, v) => setSubExs(a  => { const n=[...a]; n[i]={...n[i],[k]:v}; return n; });

  const handleSubmit = (e) => {
    e.preventDefault();
    const conditionScore = v2.conditionsByDate?.[date]?.score ?? null;
    onSubmit({
      __v2form: true,
      date,
      conditionScore: conditionScore == null ? null : Number(conditionScore),
      note,
      mainRows: mainExs,
      subRows: subExs,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDelete = () => {
    if (!canDelete) return;
    const ok = window.confirm("このトレーニング記録を削除しますか？（元に戻せません）");
    if (!ok) return;
    try {
      onDelete?.(date);
    } finally {
      onClose?.();
    }
  };

  return (
    <div className="fade-up" style={{ padding: "18px 16px 56px" }}>
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: "18px 18px 22px",
        boxShadow: "0 6px 26px rgba(0,0,0,.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "1px solid var(--border)",
              color: "var(--muted)",
              padding: "7px 10px",
              borderRadius: 10,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: ".04em",
              whiteSpace: "nowrap",
            }}
            title="一覧に戻る"
          >
            ← 戻る
          </button>
          <h2 style={{ flex: 1, textAlign: "center", fontSize: 14, fontWeight: 800, letterSpacing: ".02em" }}>
            {editDate ? "トレーニングを編集" : "トレーニングを記録"}
          </h2>
          {canDelete ? (
            <button
              type="button"
              onClick={handleDelete}
              style={{
                width: 70,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                background: "none",
                border: "none",
                color: "var(--muted)",
                padding: 0,
              }}
              title="削除"
              aria-label="削除"
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--terra)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7h16" />
                <path d="M9 7V5.5c0-.83.67-1.5 1.5-1.5h3C14.83 4 15.5 4.67 15.5 5.5V7" />
                <path d="M7 7l1 14h8l1-14" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
              </svg>
            </button>
          ) : (
            <div style={{ width: 70 }} />
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 18, overflow: "hidden" }}>
            <div style={LABEL_S}>日付</div>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
              style={{ width: "100%", boxSizing: "border-box", padding: "7px 6px", fontSize: "16px" }}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={LABEL_S}>メイン種目</div>
            {mainExs.map((ex, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 76px 100px", gap: 6, marginBottom: 6 }}>
                <input type="text" placeholder="種目名 (例: BP)" value={ex.name} onChange={e => updMain(i,"name",e.target.value)} />
                <input type="text" placeholder="重量" value={ex.weight} onChange={e => updMain(i,"weight",e.target.value)} />
                <input type="text" placeholder="回数 7,6,4" value={ex.reps} onChange={e => updMain(i,"reps",e.target.value)} />
              </div>
            ))}
            <AddBtn onClick={() => setMainExs(a => [...a, {name:"",weight:"",reps:""}])} label="+ 種目を追加" />
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={LABEL_S}>サブ種目</div>
            {subExs.map((ex, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 76px 100px", gap: 6, marginBottom: 6 }}>
                <input type="text" placeholder="種目名 (例: DBP)" value={ex.name} onChange={e => updSub(i,"name",e.target.value)} />
                <input type="text" placeholder="重量" value={ex.weight} onChange={e => updSub(i,"weight",e.target.value)} />
                <input type="text" placeholder="回数 9,8,7" value={ex.reps} onChange={e => updSub(i,"reps",e.target.value)} />
              </div>
            ))}
            <AddBtn onClick={() => setSubExs(a => [...a, {name:"",weight:"",reps:""}])} label="+ 種目を追加" />
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={LABEL_S}>メモ・備考</div>
            <textarea placeholder="気づいたこと、体の状態など..." value={note} onChange={e => setNote(e.target.value)} />
          </div>

          <button type="submit" style={{
            width: "100%", padding: "14px",
            background: saved ? "var(--green)" : "var(--terra)",
            color: "#fff", border: "none", borderRadius: 7,
            fontSize: 14, fontWeight: 600, letterSpacing: ".07em",
            transition: "background .35s",
            boxShadow: `0 3px 14px ${saved ? "rgba(45,90,39,.25)" : "rgba(196,97,58,.25)"}`,
          }}>
            {saved ? "✓  保存しました" : "記録する"}
          </button>
        </form>
      </div>
    </div>
  );
}

function AddBtn({ onClick, label }) {
  return (
    <button type="button" onClick={onClick} style={{
      background: "none", border: "1px dashed #C8C4BC", color: "var(--muted)",
      padding: "6px 14px", borderRadius: 6, fontSize: 11, letterSpacing: ".05em",
      transition: "all .15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor="var(--green)"; e.currentTarget.style.color="var(--green)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor="#C8C4BC"; e.currentTarget.style.color="var(--muted)"; }}
    >{label}</button>
  );
}

export default function App() {
  const sessionInit = readSession();
  const [authed, setAuthed] = useState(() => !!sessionInit);
  const [syncUserId, setSyncUserId] = useState(() => sessionInit?.userId ?? null);
  const [syncPassword, setSyncPassword] = useState(() => sessionInit?.password ?? null);
  const [hiding, setHiding] = useState(false);
  const [v2, setV2] = useState(() => {
    const s = readSession();
    if (!s?.userId) return emptyV2State("");
    try {
      const { state } = loadLocalV2(s.userId);
      if (state) return state;
    } catch {}
    return emptyV2State(s.userId);
  });
  const daySummaries = useMemo(() => daySummariesFromV2(v2), [v2]);
  const [syncErr, setSyncErr] = useState(null);
  /** 全画面ブロックは「シードデータにリセット」実行中のみ */
  const [seedResetBlocking, setSeedResetBlocking] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const swRef = useRef(null);
  const [backupTick, setBackupTick] = useState(0);
  /** 本番ホストではシード／全削除などの危険な操作を UI から隠す */
  const [isLocalhost, setIsLocalhost] = useState(false);
  useEffect(() => {
    try {
      const h = String(window.location?.hostname || "").toLowerCase();
      setIsLocalhost(
        h === "localhost" || h === "127.0.0.1" || h === "::1" || h === "[::1]",
      );
    } catch {
      setIsLocalhost(false);
    }
  }, []);

  const sk2 = syncUserId ? storageSk2(syncUserId) : "";
  const latestLocalBackup = useMemo(() => {
    if (!sk2) return null;
    let latestKey = null;
    let latestTs = -1;
    const prefix = `${sk2}_backup_`
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (!k.startsWith(prefix)) continue;
        const ts = parseInt(k.slice(prefix.length), 10);
        if (!Number.isFinite(ts)) continue;
        if (ts > latestTs) { latestTs = ts; latestKey = k; }
      }
    } catch {}
    return latestKey ? { key: latestKey, ts: latestTs } : null;
  }, [sk2, v2, backupTick]);

  const latestRemoteBackup = useMemo(() => {
    if (!sk2) return null;
    let latestKey = null;
    let latestTs = -1;
    const prefix = `${sk2}_remote_backup_`
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (!k.startsWith(prefix)) continue;
        const ts = parseInt(k.slice(prefix.length), 10);
        if (!Number.isFinite(ts)) continue;
        if (ts > latestTs) { latestTs = ts; latestKey = k; }
      }
    } catch {}
    return latestKey ? { key: latestKey, ts: latestTs } : null;
  }, [sk2, v2, backupTick]);

  const handleGateAuth = ({ userId, password }) => {
    setSyncUserId(userId);
    setSyncPassword(password);
    const { state } = loadLocalV2(userId);
    setV2(state || emptyV2State(userId));
    setHiding(true);
    setTimeout(() => setAuthed(true), 350);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {}
    setShowSettings(false);
    setSyncErr(null);
    setAuthed(false);
    setHiding(false);
    setSyncUserId(null);
    setSyncPassword(null);
    setV2(emptyV2State(""));
    setTab("dashboard");
  };

  const handleForceUpdate = () => {
    console.log("[App] Force update triggered");
    if (swRef.current) {
      swRef.current.waiting?.postMessage({ type: "SKIP_WAITING" });
      setTimeout(() => {
        window.location.reload(true);
      }, 500);
    }
  };

  useEffect(() => {
    if (!syncUserId) return;
    saveLocalV2(syncUserId, v2, Date.now());
  }, [v2, syncUserId]);

  const refetchRemoteV2 = useCallback(async () => {
    if (!syncUserId || !syncPassword) return;
    const remote = await fetchRemoteStateV2(syncUserId, syncPassword);
    setV2(buildV2StateFromRemote(remote));
  }, [syncUserId, syncPassword]);

  useEffect(() => {
    if (!authed || !syncUserId || !syncPassword) return;
    let cancelled = false;
    (async () => {
      setSyncErr(null);
      try {
        const remote = await fetchRemoteStateV2(syncUserId, syncPassword);
        if (cancelled) return;
        setV2(buildV2StateFromRemote(remote));
      } catch (e) {
        if (!cancelled) setSyncErr(e?.message || "sync failed");
      }
    })();
    return () => { cancelled = true; };
  }, [authed, syncUserId, syncPassword]);

  // v2 writes are done per-day by update handlers (no bulk push-on-change here).

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").then((reg) => {
      swRef.current = reg;

      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "UPDATE_AVAILABLE") {
          setUpdateAvailable(true);
        }
      });

      const interval = setInterval(() => {
        if (reg.installing) return;
        reg.update().catch(() => {});
      }, 3600000);

      return () => clearInterval(interval);
    });
  }, []);

  const addLog = useCallback(async (log) => {
    if (!log?.date) return;
    const date = log.date;

    // Delete training for day (keep condition if any)
    if (log.__delete) {
      try {
        await putRemoteDayV2({
          userId: syncUserId,
          password: syncPassword,
          date,
          conditionScore: v2.conditionsByDate?.[date]?.score ?? null,
          note: "",
          items: [],
          clientLast: {
            conditionsUpdatedAt: v2.conditionsByDate?.[date]?.updatedAt || null,
            trainingSessionUpdatedAt: v2.trainingByDate?.[date]?.updatedAt || null,
            trainingItemsUpdatedAtMax: v2.trainingByDate?.[date]?.itemsUpdatedAtMax || null,
          },
        });
        setSyncErr(null);
        setV2(prev => {
          const next = { ...prev };
          next.trainingByDate = { ...(prev.trainingByDate || {}) };
          next.trainingByDate[date] = {
            note: "",
            updatedAt: new Date().toISOString(),
            items: { main: [], sub: [] },
            itemsUpdatedAtMax: new Date().toISOString(),
          };
          return next;
        });
      } catch (e) {
        const msg = e?.code === 409 ? "サーバー側が先に更新されています。再同期しました。" : (e?.message || "sync failed");
        setSyncErr(msg);
        if (e?.code === 409) {
          try { await refetchRemoteV2(); } catch (_) {}
        }
      }
      setTab("training");
      return;
    }

    if (!log.__v2form) return;

    const conditionScore = log.conditionScore === undefined || log.conditionScore === null
      ? (v2.conditionsByDate?.[date]?.score ?? null)
      : Number(log.conditionScore);
    const note = typeof log.note === "string" ? log.note : "";
    const items = formRowsToV2Items(log.mainRows, log.subRows);

    try {
      await putRemoteDayV2({
        userId: syncUserId,
        password: syncPassword,
        date,
        conditionScore,
        note,
        items,
        clientLast: {
          conditionsUpdatedAt: v2.conditionsByDate?.[date]?.updatedAt || null,
          trainingSessionUpdatedAt: v2.trainingByDate?.[date]?.updatedAt || null,
          trainingItemsUpdatedAtMax: v2.trainingByDate?.[date]?.itemsUpdatedAtMax || null,
        },
      });
      setSyncErr(null);
      setV2(prev => {
        const next = { ...prev };
        next.conditionsByDate = { ...(prev.conditionsByDate || {}) };
        next.trainingByDate = { ...(prev.trainingByDate || {}) };
        next.conditionsByDate[date] = { score: conditionScore, updatedAt: new Date().toISOString() };

        const mainItems = items.filter(it => it.category === "main").map(it => ({ ...it, id: `local_${date}_m_${it.sortOrder}` }));
        const subItems = items.filter(it => it.category === "sub").map(it => ({ ...it, id: `local_${date}_s_${it.sortOrder}` }));
        next.trainingByDate[date] = {
          note,
          updatedAt: new Date().toISOString(),
          items: { main: mainItems, sub: subItems },
          itemsUpdatedAtMax: new Date().toISOString(),
        };
        return next;
      });
    } catch (e) {
      const msg = e?.code === 409 ? "サーバー側が先に更新されています。再同期しました。" : (e?.message || "sync failed");
      setSyncErr(msg);
      if (e?.code === 409) {
        try { await refetchRemoteV2(); } catch (_) {}
      }
    }

    setTab("training");
  }, [v2, refetchRemoteV2, syncUserId, syncPassword]);

  const updateCondition = useCallback(async (date, value) => {
    const conditionScore = asNullableScore(value);
    const note = v2.trainingByDate?.[date]?.note || "";
    const items = [
      ...(v2.trainingByDate?.[date]?.items?.main || []).map(it => ({ ...it, category: "main" })),
      ...(v2.trainingByDate?.[date]?.items?.sub || []).map(it => ({ ...it, category: "sub" })),
    ];
    try {
      await putRemoteDayV2({
        userId: syncUserId,
        password: syncPassword,
        date,
        conditionScore,
        note,
        items,
        clientLast: {
          conditionsUpdatedAt: v2.conditionsByDate?.[date]?.updatedAt || null,
          trainingSessionUpdatedAt: v2.trainingByDate?.[date]?.updatedAt || null,
          trainingItemsUpdatedAtMax: v2.trainingByDate?.[date]?.itemsUpdatedAtMax || null,
        },
      });
      setSyncErr(null);
      setV2(prev => {
        const next = { ...prev };
        next.conditionsByDate = { ...(prev.conditionsByDate || {}) };
        next.conditionsByDate[date] = { score: conditionScore, updatedAt: new Date().toISOString() };
        return next;
      });
    } catch (e) {
      const msg = e?.code === 409 ? "サーバー側が先に更新されています。再同期しました。" : (e?.message || "sync failed");
      setSyncErr(msg);
      if (e?.code === 409) {
        try { await refetchRemoteV2(); } catch (_) {}
      }
    }
  }, [v2, refetchRemoteV2, syncUserId, syncPassword]);

  const saveLocalBackupNow = useCallback(() => {
    if (!syncUserId) return;
    try {
      const sk = storageSk2(syncUserId);
      const raw = localStorage.getItem(sk);
      if (!raw) {
        window.alert("ローカルデータが見つかりませんでした。");
        return;
      }
      const ts = Date.now();
      localStorage.setItem(`${sk}_backup_${ts}`, raw);
      setBackupTick(t => t + 1);
      window.alert(`バックアップを保存しました: ${new Date(ts).toLocaleString()}`);
    } catch {
      window.alert("バックアップ保存に失敗しました。");
    }
  }, [syncUserId]);

  const setSeedData = useCallback(() => {
    if (!isLocalhost) {
      window.alert("この操作はlocalhost環境でのみ利用できます。");
      return;
    }
    const ok = window.confirm(
      "シードデータにリセットします。リモート（V2/DB）の該当ユーザーデータを全削除してから、正規化シードを投入します。ローカルはバックアップを保存してから置き換えます。実行しますか？",
    );
    if (!ok) return;
    setShowSettings(false);
    try {
      const rawV2 = localStorage.getItem(storageSk2(syncUserId));
      if (rawV2) localStorage.setItem(`${storageSk2(syncUserId)}_backup_${Date.now()}`, rawV2);
    } catch {}
    (async () => {
      try {
        setSeedResetBlocking(true);
        setSyncErr(null);

        await wipeRemoteStateV2(syncUserId, syncPassword);

        const days = [...V2_SEED_DAYS].sort((a, b) => String(a.date).localeCompare(String(b.date)));
        for (const day of days) {
          const items = (day.items || []).map((it, idx) => ({
            category: it.category === "sub" ? "sub" : "main",
            exerciseName: String(it.exerciseName || "").trim(),
            weight: String(it.weight || "").trim(),
            reps: String(it.reps || "").trim(),
            sets: it.sets ?? null,
            sortOrder: typeof it.sortOrder === "number" ? it.sortOrder : idx,
          }));

          await putRemoteDayV2({
            userId: syncUserId,
            password: syncPassword,
            date: day.date,
            conditionScore: day.conditionScore === undefined ? null : day.conditionScore,
            note: typeof day.note === "string" ? day.note : "",
            items,
            clientLast: null,
          });
        }

        const remote = await fetchRemoteStateV2(syncUserId, syncPassword);
        setV2(buildV2StateFromRemote(remote));
        setBackupTick(t => t + 1);
        window.alert("シードデータにリセットしました（V2/DB反映）。");
      } catch (e) {
        window.alert(`シードデータのリセットに失敗しました: ${e?.message || "unknown error"}`);
      } finally {
        setSeedResetBlocking(false);
      }
    })();
  }, [isLocalhost, syncUserId, syncPassword]);

  const deleteAllData = useCallback(() => {
    if (!isLocalhost) {
      window.alert("この操作はlocalhost環境でのみ利用できます。");
      return;
    }
    const ok = window.confirm("データを全て削除します（ローカルの全ログが空になります）。現在のローカルデータはバックアップを保存してから削除します。実行しますか？");
    if (!ok) return;
    try {
      const rawV2 = localStorage.getItem(storageSk2(syncUserId));
      if (rawV2) localStorage.setItem(`${storageSk2(syncUserId)}_backup_${Date.now()}`, rawV2);
    } catch {}
    setV2(emptyV2State(syncUserId));
    saveLocalV2(syncUserId, emptyV2State(syncUserId), Date.now());
    setBackupTick(t => t + 1);
    window.alert("データを全て削除しました（ローカルのみ / V2）。");
  }, [isLocalhost, syncUserId]);

  const restoreLatestLocalBackup = useCallback(() => {
    if (!syncUserId) return;
    const sk = storageSk2(syncUserId);
    const prefix = `${sk}_backup_`;
    let latestKey = null;
    let latestTs = -1;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        if (!k.startsWith(prefix)) continue;
        const ts = parseInt(k.slice(prefix.length), 10);
        if (!Number.isFinite(ts)) continue;
        if (ts > latestTs) { latestTs = ts; latestKey = k; }
      }
    } catch {}
    if (!latestKey) {
      window.alert("バックアップが見つかりませんでした。");
      return;
    }
    const ok = window.confirm(`最新バックアップ（${new Date(latestTs).toLocaleString()}）からローカルデータを復元しますか？`);
    if (!ok) return;
    try {
      const raw = localStorage.getItem(latestKey);
      if (!raw) throw new Error("empty");
      localStorage.setItem(sk, raw);
      setBackupTick(t => t + 1);
      window.alert("復元しました（ローカルのみ）。画面を再読み込みします。");
      window.setTimeout(() => window.location.reload(), 300);
    } catch {
      window.alert("復元に失敗しました。");
    }
  }, [syncUserId]);

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", minHeight: "100vh" }}>
      {seedResetBlocking && authed && (
        <div
          role="status"
          aria-live="polite"
          aria-busy="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            background: "rgba(28, 28, 26, 0.42)",
            backdropFilter: "blur(2px)",
            WebkitBackdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "28px 32px",
              maxWidth: 320,
              width: "100%",
              textAlign: "center",
              boxShadow: "0 12px 40px rgba(0,0,0,.12)",
            }}
          >
            <div className="sync-overlay-spinner" style={{ margin: "0 auto 16px" }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", letterSpacing: ".02em", lineHeight: 1.5 }}>
              シードデータにリセット中…
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 8, letterSpacing: ".04em" }}>
              しばらくお待ちください
            </div>
          </div>
        </div>
      )}

      {!authed && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          opacity: hiding ? 0 : 1,
          transition: "opacity .35s ease",
          pointerEvents: hiding ? "none" : "auto",
        }}>
          <PasswordGate onAuth={handleGateAuth} />
        </div>
      )}

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
              onClick={() => setShowSettings(!showSettings)}
              style={{
                background: "none", border: "none", padding: "6px",
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", color: "var(--muted)",
                transition: "color .2s", width: 32, height: 32,
                marginLeft: 4,
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = "var(--green)"}
              onMouseLeave={(e) => e.currentTarget.style.color = "var(--muted)"}
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
            <button key={t.id} onClick={() => setTab(t.id)} style={{
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

      <main>
        {tab === "dashboard" && (
          <DashboardTab
            key="db"
            v2={v2}
            daySummaries={daySummaries}
            todayISO={todayISO}
            condColor={condColor}
            condLabel={condLabel}
            DateHeader={DateHeader}
            OSBar={OSBar}
            ConditionChartCard={ConditionChartCard}
            SessionMiniCard={SessionMiniCard}
          />
        )}
        {tab === "condition" && (
          <ConditionTabPage
            key="cond"
            v2={v2}
            onUpdateCondition={updateCondition}
            ConditionChartCard={ConditionChartCard}
          />
        )}
        {tab === "training" && (
          <TrainingTabPage
            key="train"
            v2={v2}
            daySummaries={daySummaries}
            onUpsert={addLog}
            todayISO={todayISO}
            fmtDate={fmtDate}
            CondOrb={CondOrb}
            TrainingRecordScreen={TrainingRecordScreen}
          />
        )}
      </main>

      {showSettings && (
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
                onClick={() => setShowSettings(false)}
                style={{
                  background: "none", border: "none", fontSize: 20,
                  cursor: "pointer", color: "var(--muted)", padding: "4px 8px",
                }}
              >
                ✕
              </button>
            </div>

            <div style={{  gap: 16, display: "flex", flexDirection: "column" }}>
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
                  onClick={() => {
                    setShowSettings(false);
                    handleForceUpdate();
                  }}
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
                  onMouseEnter={(e) => e.target.style.opacity = "0.85"}
                  onMouseLeave={(e) => e.target.style.opacity = "1"}
                >
                  {updateAvailable ? "アップデートを更新" : "最新版を確認"}
                </button>
              </div>

              <div style={{ paddingTop: 16, borderTop: "1px solid var(--border)" }}>
                <div style={{ fontSize: 11, color: "var(--muted)", letterSpacing: ".06em", marginBottom: 10 }}>
                  データ
                </div>
                <button
                  onClick={saveLocalBackupNow}
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
                  onClick={restoreLatestLocalBackup}
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
                      onClick={setSeedData}
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
                      onClick={deleteAllData}
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
                  onClick={handleLogout}
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
                  {APP_VERSION}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {updateAvailable && !showSettings && (
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
        onClick={() => setShowSettings(true)}
        title="設定を開く"
        >
          ✓ 新しいバージョンが利用可能 — タップして更新
        </div>
      )}

      <footer style={{
        padding: "24px", textAlign: "center",
        borderTop: "1px solid var(--border)",
        fontSize: 9, color: "#D0CDC5", letterSpacing: ".15em",
      }}>
        SELF CONDITIONING APP  ·  {APP_VERSION}
      </footer>
    </div>
  );
}
