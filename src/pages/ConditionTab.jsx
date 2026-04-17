import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import CondOrb from "../components/condition/CondOrb.jsx";
import { addCalendarMonths, clampMonth } from "../lib/stepsDisplay.js";
import { useIsMobile } from "../hooks/useIsMobile.js";
import MobileFab from "../components/ui/MobileFab.jsx";

export default function ConditionTab({
  v2,
  onSaveConditionDay,
  todayISO,
  fmtDate,
  ConditionChartCard,
  ConditionRecordScreen,
  hideTopChart = false,
}) {
  const isMobile = useIsMobile(520);
  const [openRec, setOpenRec] = useState(false);
  const [editDate, setEditDate] = useState(null);
  const [initialDate, setInitialDate] = useState(todayISO());
  const [expanded, setExpanded] = useState(new Set());
  const maxMonth = todayISO().slice(0, 7);

  const rows = useMemo(() => {
    return Object.entries(v2.conditionsByDate || {})
      .filter(([, row]) => row && (row.score != null || String(row.note || "").trim()))
      .map(([date, row]) => ({
        date,
        score: row.score,
        note: String(row.note || ""),
      }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [v2]);

  const minMonth = useMemo(() => {
    if (!rows.length) return maxMonth;
    return rows[rows.length - 1].date.slice(0, 7);
  }, [rows, maxMonth]);
  const [viewMonth, setViewMonth] = useState(() => maxMonth);

  useEffect(() => {
    setViewMonth((prev) => clampMonth(prev, minMonth, maxMonth));
  }, [minMonth, maxMonth]);

  const filtered = useMemo(() => rows.filter(r => r.date.startsWith(viewMonth)), [rows, viewMonth]);

  const toggle = id => setExpanded(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  if (openRec) {
    const node = (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 80,
          background: "var(--bg)",
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <ConditionRecordScreen
          v2={v2}
          onClose={() => { setOpenRec(false); setEditDate(null); }}
          onSubmit={(payload) => {
            onSaveConditionDay(payload);
            setOpenRec(false);
            setEditDate(null);
          }}
          initialDate={initialDate}
          editDate={editDate}
        />
      </div>
    );
    // This tab is also embedded inside KokoroTab; portal to body so the record
    // screen behaves like other tabs (full-screen) instead of expanding inline.
    if (typeof document !== "undefined" && document.body) {
      return createPortal(node, document.body);
    }
    return node;
  }

  return (
    <div className="fade-up" style={{ paddingBottom: 48 }}>
      <div style={{ padding: "24px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: ".05em" }}>コンディション</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>{filtered.length} entries</span>
          {!isMobile && (
            <button
              type="button"
              onClick={() => { setEditDate(null); setInitialDate(todayISO()); setOpenRec(true); }}
              style={{
                background: "var(--terra)", color: "#fff", border: "none",
                padding: "8px 12px", borderRadius: 9, fontSize: 11, fontWeight: 700,
                letterSpacing: ".06em", boxShadow: "0 3px 14px rgba(196,97,58,.22)",
              }}
              title="コンディションを記録"
            >
              記録する
            </button>
          )}
        </div>
      </div>

      {!hideTopChart && (
        <div style={{ padding: "14px 24px 0" }}>
          <ConditionChartCard
            v2={v2}
            defaultPeriod="1m"
            height={140}
            showRecord={false}
          />
        </div>
      )}

      <div style={{ display: "flex", gap: 8, padding: "18px 24px 0", alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          disabled={viewMonth <= minMonth}
          onClick={() => {
            if (viewMonth <= minMonth) return;
            setViewMonth((prev) => clampMonth(addCalendarMonths(prev, -1), minMonth, maxMonth));
          }}
          aria-label="前の月"
          style={{
            background: viewMonth > minMonth ? "var(--surface)" : "transparent",
            color: viewMonth > minMonth ? "var(--text)" : "var(--muted)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "6px 11px",
            fontSize: 12,
            fontWeight: 700,
            cursor: viewMonth > minMonth ? "pointer" : "not-allowed",
            opacity: viewMonth > minMonth ? 1 : 0.45,
          }}
        >
          ←
        </button>
        <input
          type="month"
          value={viewMonth}
          min={minMonth}
          max={maxMonth}
          onChange={(e) => {
            const v = e.target.value;
            if (!v) return;
            setViewMonth(clampMonth(v, minMonth, maxMonth));
          }}
          style={{
            width: 150,
            padding: "5px 12px",
            borderRadius: 100,
            border: "1px solid var(--border)",
            background: "var(--bg)",
            color: "var(--muted)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: ".02em",
            outline: "none",
          }}
          title="表示する月"
        />
        <button
          type="button"
          disabled={viewMonth >= maxMonth}
          onClick={() => {
            if (viewMonth >= maxMonth) return;
            setViewMonth((prev) => clampMonth(addCalendarMonths(prev, 1), minMonth, maxMonth));
          }}
          aria-label="次の月"
          style={{
            background: viewMonth < maxMonth ? "var(--surface)" : "transparent",
            color: viewMonth < maxMonth ? "var(--text)" : "var(--muted)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "6px 11px",
            fontSize: 12,
            fontWeight: 700,
            cursor: viewMonth < maxMonth ? "pointer" : "not-allowed",
            opacity: viewMonth < maxMonth ? 1 : 0.45,
          }}
        >
          →
        </button>
      </div>

      <div style={{ padding: "12px 24px 0" }}>
        <table style={{ width: "100%", tableLayout: "fixed" }}>
          <thead>
            <tr>
              <th style={{ width: 64 }}>日付</th>
              <th style={{ width: 52 }}>スコア</th>
              <th>コンディションメモ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, idx) => {
              const d = fmtDate(row.date);
              const id = `c_${row.date}`;
              const isExp = expanded.has(id);
              const hasNote = row.note && row.note.length > 0;
              const isLong = row.note && row.note.length > 48;

              const openEdit = () => {
                setEditDate(row.date);
                setInitialDate(row.date);
                setOpenRec(true);
              };

              return (
                <tr
                  key={row.date}
                  onClick={openEdit}
                  style={{
                    animation: `rowIn .3s ease ${Math.min(idx, 8) * 0.04}s both`,
                    cursor: "pointer",
                  }}
                  title="タップで編集"
                >
                  <td>
                    <div style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700, fontSize: 13 }}>{d.short}</div>
                    <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 1 }}>{d.wdJA}</div>
                  </td>
                  <td style={{ paddingTop: 11, paddingBottom: 11 }}>
                    <CondOrb value={row.score} size={40} palette="band" />
                  </td>
                  <td>
                    {hasNote ? (
                      <div
                        onClick={(e) => { e.stopPropagation(); isLong && toggle(id); }}
                        style={{ cursor: isLong ? "pointer" : "default" }}
                        title={isLong ? "タップで展開/折りたたみ" : undefined}
                      >
                        <div style={{
                          fontSize: 11, color: "#555", lineHeight: 1.65,
                          display: isExp ? "block" : "-webkit-box",
                          WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                        }}>
                          {row.note}
                        </div>
                        {isLong && (
                          <div style={{ fontSize: 9, color: "var(--terra)", marginTop: 2 }}>
                            {isExp ? "▲ 閉じる" : "▼ 展開"}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: "#D0CDC5", fontSize: 11 }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <MobileFab
        hidden={!isMobile}
        onClick={() => { setEditDate(null); setInitialDate(todayISO()); setOpenRec(true); }}
        title="コンディションを記録"
      />
    </div>
  );
}
