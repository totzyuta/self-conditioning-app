import React, { useRef, useState } from "react";

export default function BarChart({
  points,
  w = 640,
  h = 130,
  color = "#2D5A27",
  axisFontSize = 11,
  dateFontSize = 11,
  yMinFixed = 0,
  yMaxFixed = 10,
  yTicks = null,
  showDateLabels = true,
  formatY,
}) {
  const [hovered, setHovered] = useState(null);
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

  const yVals = points.map(p => p.y);
  const yMin = typeof yMinFixed === "number" ? yMinFixed : Math.min(...yVals);
  const yMax = typeof yMaxFixed === "number" ? yMaxFixed : Math.max(...yVals);
  const yRange = yMax - yMin || 1;
  const toY = v => pad.t + ih - ((v - yMin) / yRange) * ih;
  const baselineY = toY(yMinFixed ?? 0);

  const count = points.length;
  const stepX = count > 1 ? (iw / count) : iw;
  const barW = Math.max(2, Math.min(18, Math.floor(stepX * 0.68)));

  const bars = points.map((p, i) => {
    const cx = pad.l + stepX * i + stepX / 2;
    const x = Math.round(cx - barW / 2);
    const yPx = Math.round(toY(p.y));
    const y0 = Math.round(toY(yMinFixed ?? 0));
    const top = Math.min(yPx, y0);
    const bottom = Math.max(yPx, y0);
    return { ...p, i, cx, x, yPx, top, bottom, h: Math.max(1, bottom - top) };
  });

  const yLabels = Array.isArray(yTicks) && yTicks.length
    ? yTicks.slice()
    : (() => {
      const ys = [];
      for (let v = Math.ceil(yMin); v <= Math.floor(yMax); v++) ys.push(v);
      return ys;
    })();

  const fmtY = typeof formatY === "function" ? formatY : (v => String(v));
  const hp = hovered != null ? bars[hovered] : null;
  const tooltipX = hp ? Math.min(Math.max(hp.cx, pad.l + 28), pad.l + iw - 28) : 0;
  const TOOLTIP_W = 80;
  const TOOLTIP_H = 50;
  const TOOLTIP_GAP = 14;
  const tooltipTop = hp ? Math.max(hp.top - (TOOLTIP_H + TOOLTIP_GAP), pad.t + 2) : 0;

  const handlePointer = (e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const touch = e.touches ? e.touches[0] : null;
    const clientX = touch ? touch.clientX : e.clientX;
    const clientY = touch ? touch.clientY : e.clientY;

    // Map client -> SVG coordinates correctly (accounts for viewBox/preserveAspectRatio).
    let svgX;
    try {
      const ctm = svg.getScreenCTM?.();
      if (ctm) {
        const pt = svg.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const sp = pt.matrixTransform(ctm.inverse());
        svgX = sp.x;
      }
    } catch {
      // ignore
    }
    if (svgX == null) {
      const rect = svg.getBoundingClientRect();
      const scaleX = w / rect.width;
      svgX = (clientX - rect.left) * scaleX;
    }
    let best = 0;
    let bestDist = Infinity;
    bars.forEach((b, idx) => {
      const d = Math.abs(b.cx - svgX);
      if (d < bestDist) { bestDist = d; best = idx; }
    });
    setHovered(best);
  };

  // Date labels: show up to ~6 labels
  const dateLabels = [];
  if (showDateLabels && bars.length >= 2) {
    const step = Math.max(1, Math.ceil(bars.length / 6));
    bars.forEach((b, i) => {
      if (i === 0 || i === bars.length - 1 || i % step === 0) dateLabels.push(b);
    });
  }

  return (
    <svg
      ref={svgRef}
      width="100%"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block", overflow: "visible", cursor: "crosshair", touchAction: "none" }}
      onMouseMove={handlePointer}
      onMouseLeave={() => setHovered(null)}
      onTouchStart={handlePointer}
      onTouchMove={handlePointer}
      onTouchEnd={() => setHovered(null)}
    >
      {yLabels.map(v => (
        <line key={v} x1={pad.l} y1={toY(v)} x2={pad.l + iw} y2={toY(v)} stroke="#E4E1D8" strokeWidth={1} />
      ))}

      <line x1={pad.l} y1={baselineY} x2={pad.l + iw} y2={baselineY} stroke="#E4E1D8" strokeWidth={1} />

      {bars.map((b) => {
        const active = hovered === b.i;
        return (
          <rect
            key={b.i}
            x={b.x}
            y={b.top}
            width={barW}
            height={b.h}
            rx={4}
            fill={color}
            opacity={active ? 0.95 : 0.75}
          />
        );
      })}

      {yLabels.map(v => (
        <text key={v} x={pad.l - 5} y={toY(v) + 3.5} textAnchor="end" fontSize={axisFontSize} fill="#9B9890">
          {v}
        </text>
      ))}

      {showDateLabels && dateLabels.map((b, i) => (
        <text
          key={i}
          x={b.cx}
          y={pad.t + ih + (dateFontSize + 8)}
          textAnchor="middle"
          fontSize={dateFontSize}
          fill="#9B9890"
        >
          {b.label}
        </text>
      ))}

      {hp && (
        <g>
          <line x1={hp.cx} y1={pad.t} x2={hp.cx} y2={pad.t + ih} stroke={color} strokeWidth={1} strokeDasharray="3,2" opacity={0.35} />
          <rect x={tooltipX - (TOOLTIP_W / 2)} y={tooltipTop} width={TOOLTIP_W} height={TOOLTIP_H} rx={6} fill={color} opacity={0.93} />
          <text x={tooltipX} y={tooltipTop + 18} textAnchor="middle" fontSize={11} fill="#fff" opacity={0.9}>
            {hp.label}
          </text>
          <text x={tooltipX} y={tooltipTop + 38} textAnchor="middle" fontSize={16} fill="#fff" fontWeight="700">
            {fmtY(hp.y)}
          </text>
        </g>
      )}
    </svg>
  );
}

