import React, { useEffect, useMemo, useState } from "react";
import { fmtDate, todayISO } from "../lib/format.js";
import {
  addCalendarMonths,
  clampMonth,
  displayStepsValue,
  earliestMonthWithStepsData,
  monthDatesDescWithin,
} from "../lib/stepsDisplay.js";
import StepsChartCard from "../components/steps/StepsChartCard.jsx";
import StepsRecordScreen from "../components/steps/StepsRecordScreen.jsx";

function monthLabel(ym) {
  const [y, m] = ym.split("-");
  return `${y}年${parseInt(m, 10)}月`;
}

export default function StepsTab({ v2, onSaveStepsDay }) {
  const [openRec, setOpenRec] = useState(false);
  const [editDate, setEditDate] = useState(null);
  const [initialDate, setInitialDate] = useState(todayISO());
  const [expanded, setExpanded] = useState(new Set());
  const maxMonth = todayISO().slice(0, 7);
  const minMonth = useMemo(
    () => earliestMonthWithStepsData(v2.stepsByDate) ?? maxMonth,
    [v2, maxMonth],
  );
  const [viewMonth, setViewMonth] = useState(() => maxMonth);

  useEffect(() => {
    setViewMonth((prev) => clampMonth(prev, minMonth, maxMonth));
  }, [minMonth, maxMonth]);

  const tableRows = useMemo(() => {
    const t = todayISO();
    const dates = monthDatesDescWithin(viewMonth, t);
    return dates.map((date) => {
      const row = v2.stepsByDate?.[date];
      return {
        date,
        note: String(row?.note || ""),
        displaySteps: displayStepsValue(row),
      };
    });
  }, [viewMonth, v2.stepsByDate]);

  const toggle = id => setExpanded(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const canPrev = viewMonth > minMonth;
  const canNext = viewMonth < maxMonth;

  if (openRec) {
    return (
      <StepsRecordScreen
        v2={v2}
        onClose={() => { setOpenRec(false); setEditDate(null); }}
        onSubmit={(payload) => {
          onSaveStepsDay(payload);
          setOpenRec(false);
          setEditDate(null);
        }}
        initialDate={initialDate}
        editDate={editDate}
      />
    );
  }

  return (
    <div className="fade-up" style={{ paddingBottom: 48 }}>
      <div style={{ padding: "24px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: ".05em" }}>歩数</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>{tableRows.length} 日</span>
          <button
            type="button"
            onClick={() => { setEditDate(null); setInitialDate(todayISO()); setOpenRec(true); }}
            style={{
              background: "var(--terra)", color: "#fff", border: "none",
              padding: "8px 12px", borderRadius: 9, fontSize: 11, fontWeight: 700,
              letterSpacing: ".06em", boxShadow: "0 3px 14px rgba(196,97,58,.22)",
            }}
            title="歩数を記録"
          >
            記録する
          </button>
        </div>
      </div>

      <div style={{ padding: "14px 24px 0" }}>
        <StepsChartCard v2={v2} defaultPeriod="1m" height={140} />
      </div>

      <div style={{ display: "flex", gap: 8, padding: "18px 24px 0", alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => {
            if (!canPrev) return;
            setViewMonth((prev) => clampMonth(addCalendarMonths(prev, -1), minMonth, maxMonth));
          }}
          aria-label="前の月"
          style={{
            background: canPrev ? "var(--surface)" : "transparent",
            color: canPrev ? "var(--text)" : "var(--muted)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "6px 11px",
            fontSize: 12,
            fontWeight: 700,
            cursor: canPrev ? "pointer" : "not-allowed",
            opacity: canPrev ? 1 : 0.45,
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
        <span style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>{monthLabel(viewMonth)}</span>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => {
            if (!canNext) return;
            setViewMonth((prev) => clampMonth(addCalendarMonths(prev, 1), minMonth, maxMonth));
          }}
          aria-label="次の月"
          style={{
            background: canNext ? "var(--surface)" : "transparent",
            color: canNext ? "var(--text)" : "var(--muted)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "6px 11px",
            fontSize: 12,
            fontWeight: 700,
            cursor: canNext ? "pointer" : "not-allowed",
            opacity: canNext ? 1 : 0.45,
          }}
        >
          →
        </button>
      </div>

      <div style={{ overflowX: "auto", padding: "12px 24px 0" }}>
        <table style={{ minWidth: 520 }}>
          <thead>
            <tr>
              <th style={{ width: 64 }}>日付</th>
              <th style={{ width: 90 }}>歩数</th>
              <th style={{ minWidth: 200 }}>メモ</th>
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row, idx) => {
              const d = fmtDate(row.date);
              const id = `s_${row.date}`;
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
                    <div style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700, fontSize: 14, color: "var(--green)" }}>
                      {Number(row.displaySteps).toLocaleString()}
                    </div>
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
    </div>
  );
}
