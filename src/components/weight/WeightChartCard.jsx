import React, { useMemo, useRef, useState } from "react";
import SmoothLineChart from "../charts/SmoothLineChart.jsx";
import { PERIODS } from "../condition/chartConstants.js";
import { fmtDate } from "../../lib/format.js";
import { useIsMobile } from "../../hooks/useIsMobile.js";
import { useElementWidth } from "../../hooks/useElementWidth.js";

const LINE = "#2D5A27";

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function pickWeightTickStep(range, maxTicks = 7) {
  const steps = [0.5, 1, 2, 5];
  const safeRange = Math.max(0, Number(range) || 0);
  if (safeRange <= 0) return 0.5;

  // Prefer finer steps, but keep tick count within maxTicks.
  for (const step of steps) {
    const ticks = Math.floor(safeRange / step) + 1;
    if (ticks <= maxTicks) return step;
  }
  return 5;
}

function niceBounds(minV, maxV, step, padSteps = 2) {
  const pad = (Number(step) || 1) * padSteps;
  const min = Number(minV);
  const max = Number(maxV);
  const lo = Number.isFinite(min) ? min - pad : 40;
  const hi = Number.isFinite(max) ? max + pad : 80;
  const s = Number(step) || 1;

  const niceMin = Math.floor(lo / s) * s;
  const niceMax = Math.ceil(hi / s) * s;
  return { niceMin, niceMax };
}

function buildTicks(yMin, yMax, step, maxTicks = 7) {
  const s = Number(step) || 1;
  const start = Number(yMin);
  const end = Number(yMax);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return [];

  const ticks = [];
  const limit = maxTicks + 2; // just in case
  for (let i = 0; i < 200; i++) {
    const v = start + s * i;
    if (v > end + 1e-9) break;
    // Normalize float noise (0.5 steps)
    const vv = s === 0.5 ? Math.round(v * 2) / 2 : Math.round(v);
    ticks.push(vv);
    if (ticks.length >= limit) break;
  }
  // If still too many (shouldn't happen), downsample evenly.
  if (ticks.length > maxTicks) {
    const keep = [];
    const stepIdx = (ticks.length - 1) / (maxTicks - 1);
    for (let i = 0; i < maxTicks; i++) {
      keep.push(ticks[Math.round(i * stepIdx)]);
    }
    return keep;
  }
  return ticks;
}

export default function WeightChartCard({ v2, defaultPeriod = "1m", height = 140 }) {
  const [period, setPeriod] = useState(defaultPeriod);
  const isMobile = useIsMobile(520);
  const chartWrapRef = useRef(null);
  const wrapW = useElementWidth(chartWrapRef);
  const chartW = wrapW ? Math.max(320, Math.min(700, Math.round(wrapW))) : 640;

  const periodDays = PERIODS.find(p => p.key === period)?.days ?? 30;
  const cutoff = Date.now() - periodDays * 86400000;

  const chartPoints = useMemo(() => {
    return Object.entries(v2.weightByDate || {})
      .filter(([d, row]) => row && row.weight != null && new Date(`${d}T00:00:00`).getTime() >= cutoff)
      .map(([d, row]) => ({
        x: new Date(`${d}T00:00:00`).getTime(),
        y: Number(row.weight),
        label: fmtDate(d).short,
      }))
      .sort((a, b) => a.x - b.x);
  }, [v2, cutoff]);

  const ys = chartPoints.map(p => p.y);
  const avg = ys.length ? (ys.reduce((a, b) => a + b, 0) / ys.length) : null;
  const maxV = ys.length ? Math.max(...ys) : null;
  const minV = ys.length ? Math.min(...ys) : null;

  const range = (minV != null && maxV != null) ? (maxV - minV) : 0;
  const tickStep = pickWeightTickStep(range, 7);
  const { niceMin, niceMax } = niceBounds(minV, maxV, tickStep, 2);
  const yMin = clamp(niceMin, -200, 500);
  const yMax = clamp(niceMax, -200, 500);
  const ticks = buildTicks(yMin, yMax, tickStep, 7);

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10, padding: "18px 18px 12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 8 }}>
        <div style={{ fontSize: 9, letterSpacing: ".18em", color: "var(--muted)", textTransform: "uppercase", whiteSpace: "nowrap" }}>
          体重推移
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

      <div ref={chartWrapRef}>
        {chartPoints.length >= 2 ? (
          <>
            <SmoothLineChart
              points={chartPoints}
              w={chartW}
              h={isMobile ? Math.round(height * 1.5) : height}
              color={LINE}
              showNeutral={false}
              showDateLabels={true}
              axisFontSize={11}
              dateFontSize={11}
              yMinFixed={yMin}
              yMaxFixed={yMax}
              yTicks={ticks}
            />
            <div style={{ display: "flex", borderTop: "1px solid var(--border)", marginTop: 12 }}>
              {[
                { label: "平均", val: avg != null ? avg.toFixed(1) : "—" },
                { label: "最高", val: maxV != null ? maxV.toFixed(1) : "—" },
                { label: "最低", val: minV != null ? minV.toFixed(1) : "—" },
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
            この期間の体重データがありません
          </div>
        )}
      </div>
    </div>
  );
}

