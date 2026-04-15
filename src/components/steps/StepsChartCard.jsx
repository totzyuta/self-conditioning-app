import React, { useMemo, useRef, useState } from "react";
import SmoothLineChart from "../charts/SmoothLineChart.jsx";
import { PERIODS } from "../condition/chartConstants.js";
import { fmtDate } from "../../lib/format.js";
import { useIsMobile } from "../../hooks/useIsMobile.js";
import { useElementWidth } from "../../hooks/useElementWidth.js";

const LINE = "#2D5A27";

function ticks(max) {
  if (!max || max <= 0) return [0, 2000, 4000, 6000, 8000, 10000];
  const step = max <= 8000 ? 1000 : max <= 15000 ? 2500 : 5000;
  const m = Math.ceil(max / step) * step;
  const out = [];
  for (let v = 0; v <= m; v += step) out.push(v);
  return out;
}

export default function StepsChartCard({ v2, defaultPeriod = "1m", height = 140 }) {
  const [period, setPeriod] = useState(defaultPeriod);
  const isMobile = useIsMobile(520);
  const chartWrapRef = useRef(null);
  const wrapW = useElementWidth(chartWrapRef);
  const chartW = wrapW ? Math.max(320, Math.min(700, Math.round(wrapW))) : 640;

  const periodDays = PERIODS.find(p => p.key === period)?.days ?? 30;
  const cutoff = Date.now() - periodDays * 86400000;

  const chartPoints = useMemo(() => {
    return Object.entries(v2.stepsByDate || {})
      .filter(([d, row]) => row && row.steps != null && new Date(`${d}T00:00:00`).getTime() >= cutoff)
      .map(([d, row]) => ({
        x: new Date(`${d}T00:00:00`).getTime(),
        y: Number(row.steps),
        label: fmtDate(d).short,
      }))
      .sort((a, b) => a.x - b.x);
  }, [v2, cutoff]);

  const ys = chartPoints.map(p => p.y);
  const avg = ys.length ? Math.round(ys.reduce((a, b) => a + b, 0) / ys.length) : null;
  const maxV = ys.length ? Math.max(...ys) : null;
  const minV = ys.length ? Math.min(...ys) : null;
  const yMax = maxV != null ? Math.max(2000, maxV) : 10000;
  const yTicks = ticks(yMax);

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "18px 18px 12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 8 }}>
        <div style={{ fontSize: 9, letterSpacing: ".18em", color: "var(--muted)", textTransform: "uppercase", whiteSpace: "nowrap" }}>
          歩数推移
        </div>
        <div style={{ display: "flex", gap: 3, flexWrap: "nowrap" }}>
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              style={{
                background: period === p.key ? "var(--green)" : "none",
                color: period === p.key ? "#fff" : "var(--muted)",
                border: `1px solid ${period === p.key ? "var(--green)" : "var(--border)"}`,
                borderRadius: 4,
                padding: "4px 7px",
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: ".04em",
                minWidth: 28,
                textAlign: "center",
                transition: "all .15s",
              }}
            >
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
              color={LINE}
              showNeutral={false}
              showDateLabels={true}
              axisFontSize={11}
              dateFontSize={11}
              yMinFixed={0}
              yMaxFixed={yTicks[yTicks.length - 1]}
              yTicks={yTicks}
            />
          </div>
          <div style={{ display: "flex", borderTop: "1px solid var(--border)", marginTop: 12 }}>
            {[
              { label: "平均", val: avg != null ? `${avg.toLocaleString()}` : "—" },
              { label: "最高", val: maxV != null ? `${maxV.toLocaleString()}` : "—" },
              { label: "最低", val: minV != null ? `${minV.toLocaleString()}` : "—" },
              { label: "記録", val: ys.length },
            ].map((s, i) => (
              <div
                key={s.label}
                style={{
                  flex: 1,
                  textAlign: "center",
                  padding: "10px 4px",
                  borderRight: i < 3 ? "1px solid var(--border)" : "none",
                }}
              >
                <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: ".08em", marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontSize: 15, fontWeight: 300, color: "var(--text)", letterSpacing: "-0.5px", fontVariantNumeric: "tabular-nums" }}>
                  {s.val}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div style={{ textAlign: "center", padding: "32px 0", color: "var(--muted)", fontSize: 12 }}>
          この期間の歩数データがありません
        </div>
      )}
    </div>
  );
}

