import React, { useEffect, useMemo, useRef, useState } from "react";
import SmoothLineChart from "../charts/SmoothLineChart.jsx";
import { PERIODS, LABEL_S } from "./chartConstants.js";
import { useIsMobile } from "../../hooks/useIsMobile.js";
import { useElementWidth } from "../../hooks/useElementWidth.js";
import { condColor, fmtDate, todayISO } from "../../lib/format.js";

export default function ConditionChartCard({ v2, defaultPeriod = "1m", height = 140, showRecord = false, onUpdateCondition }) {
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
