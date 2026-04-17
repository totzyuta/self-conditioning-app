import React, { useMemo, useRef, useState } from "react";
import BarChart from "../charts/BarChart.jsx";
import { PERIODS } from "../condition/chartConstants.js";
import { fmtDate } from "../../lib/format.js";
import { displayStepsValue, localDatesAscEndingTodayInclusive } from "../../lib/stepsDisplay.js";
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

  const { chartPoints, recordedDaysInPeriod } = useMemo(() => {
    const by = v2.stepsByDate || {};
    const dates = localDatesAscEndingTodayInclusive(periodDays);
    let recorded = 0;
    const pts = dates.map((d) => {
      const row = by[d];
      if (row && row.steps != null) recorded += 1;
      const y = displayStepsValue(row);
      return {
        x: new Date(`${d}T00:00:00`).getTime(),
        y,
        label: fmtDate(d).short,
      };
    });
    return { chartPoints: pts, recordedDaysInPeriod: recorded };
  }, [v2, periodDays]);

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

      <div ref={chartWrapRef}>
        {chartPoints.length >= 1 ? (
          <>
            <BarChart
              points={chartPoints}
              w={chartW}
              h={isMobile ? Math.round(height * 1.5) : height}
              color={LINE}
              showDateLabels={true}
              axisFontSize={11}
              dateFontSize={11}
              yMinFixed={0}
              yMaxFixed={yTicks[yTicks.length - 1]}
              yTicks={yTicks}
              formatY={(v) => {
                const n = Math.round(Number(v));
                return Number.isFinite(n) ? n.toLocaleString() : "—";
              }}
            />
            <div style={{ display: "flex", borderTop: "1px solid var(--border)", marginTop: 12 }}>
              {[
                { label: "平均", val: avg != null ? `${avg.toLocaleString()}` : "—" },
                { label: "最高", val: maxV != null ? `${maxV.toLocaleString()}` : "—" },
                { label: "最低", val: minV != null ? `${minV.toLocaleString()}` : "—" },
                { label: "記録", val: recordedDaysInPeriod },
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
            この期間のデータを表示できません
          </div>
        )}
      </div>
    </div>
  );
}

