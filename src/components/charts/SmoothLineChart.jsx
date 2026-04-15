import React, { useState, useRef } from "react";

export default function SmoothLineChart({
  points,
  w = 640,
  h = 130,
  showNeutral = true,
  showDateLabels = false,
  color = "#9B9890",
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
      style={{
        display: "block",
        overflow: "visible",
        cursor: "crosshair",
        // Avoid preventDefault on touchmove (passive listeners); still block scroll-steal on chart scrub
        touchAction: "none",
      }}
      onMouseMove={handlePointer}
      onMouseLeave={() => setHovered(null)}
      onTouchStart={handlePointer}
      onTouchMove={handlePointer}
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
