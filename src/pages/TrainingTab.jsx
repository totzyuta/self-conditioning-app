import React, { useEffect, useMemo, useState } from "react";
import { formatExerciseLine, formatRepsForDisplay } from "../lib/format.js";
import { addCalendarMonths, clampMonth } from "../lib/stepsDisplay.js";
import { useIsMobile } from "../hooks/useIsMobile.js";
import MobileFab from "../components/ui/MobileFab.jsx";
import TrainingMonthCalendar from "../components/training/TrainingMonthCalendar.jsx";

const FILTERS = [
  { key: "all", label: "全て" },
  { key: "training", label: "トレーニング" },
  { key: "rest", label: "休息" },
];

export default function TrainingTab({
  v2,
  daySummaries,
  onUpsert,
  todayISO,
  fmtDate,
  CondOrb,
  TrainingRecordScreen,
}) {
  const isMobile = useIsMobile(520);
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState(new Set());
  const [openRec, setOpenRec] = useState(false);
  const [editDate, setEditDate] = useState(null);
  const [initialDate, setInitialDate] = useState(todayISO());
  const maxMonth = todayISO().slice(0, 7);

  const today = todayISO();

  const summaryByDate = useMemo(() => {
    const m = {};
    (daySummaries || []).forEach(s => { m[s.date] = s; });
    return m;
  }, [daySummaries]);

  const allDates = useMemo(() => {
    const dates = [];
    if (!daySummaries.length) return dates;
    const earliest = daySummaries.reduce((a, b) => (a.date < b.date ? a : b)).date;
    let cur = new Date(`${earliest}T00:00:00`);
    const end = new Date(`${today}T00:00:00`);
    while (cur <= end) {
      const iso = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
      if (summaryByDate[iso]) {
        dates.push(summaryByDate[iso]);
      } else {
        dates.push({
          id: `gap_${iso}`,
          date: iso,
          condition: v2.conditionsByDate?.[iso]?.score ?? null,
          type: "rest",
          note: "",
          main: [],
          sub: [],
        });
      }
      cur.setDate(cur.getDate() + 1);
    }
    return dates.reverse();
  }, [daySummaries, summaryByDate, today, v2.conditionsByDate]);

  const minMonth = useMemo(() => {
    if (!allDates.length) return maxMonth;
    return allDates[allDates.length - 1].date.slice(0, 7);
  }, [allDates, maxMonth]);
  const [viewMonth, setViewMonth] = useState(() => maxMonth);

  useEffect(() => {
    setViewMonth((prev) => clampMonth(prev, minMonth, maxMonth));
  }, [minMonth, maxMonth]);

  const filtered = useMemo(() => {
    return allDates.filter(l => {
      if (!l.date.startsWith(viewMonth)) return false;
      if (filter === "training") return l.type === "training";
      if (filter === "rest") return l.type === "rest";
      return true;
    });
  }, [allDates, filter, viewMonth]);

  const toggle = id => setExpanded(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  if (openRec) {
    return (
      <TrainingRecordScreen
        v2={v2}
        onClose={() => setOpenRec(false)}
        onSubmit={(payload) => { onUpsert(payload); setOpenRec(false); }}
        onDelete={(date) => { onUpsert({ __delete: true, date }); setOpenRec(false); }}
        initialDate={initialDate}
        editDate={editDate}
      />
    );
  }

  return (
    <div className="fade-up" style={{ paddingBottom: 48 }}>
      <div style={{ padding: "24px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: ".05em" }}>トレーニング</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>{filtered.length} entries</span>
          {!isMobile && (
            <button
              onClick={() => { setEditDate(null); setInitialDate(todayISO()); setOpenRec(true); }}
              style={{
                background: "var(--terra)", color: "#fff", border: "none",
                padding: "8px 12px", borderRadius: 9, fontSize: 11, fontWeight: 700,
                letterSpacing: ".06em", boxShadow: "0 3px 14px rgba(196,97,58,.22)",
              }}
              title="トレーニングを記録"
            >
              記録する
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, padding: "14px 24px 0", alignItems: "center", flexWrap: "wrap" }}>
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

      <TrainingMonthCalendar
        ym={viewMonth}
        todayIso={today}
        summaryByDate={summaryByDate}
        onSelectDate={(ds) => {
          setEditDate(ds);
          setInitialDate(ds);
          setOpenRec(true);
        }}
      />

      <div style={{ display: "flex", gap: 6, padding: "10px 24px", overflowX: "auto" }}>
        {FILTERS.map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            background: filter === f.key ? "var(--green)" : "none",
            color: filter === f.key ? "#fff" : "var(--muted)",
            border: "1px solid",
            borderColor: filter === f.key ? "var(--green)" : "var(--border)",
            borderRadius: 100, padding: "5px 14px",
            fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
            transition: "all .15s",
          }}>
            {f.label}
          </button>
        ))}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ minWidth: 620 }}>
          <thead>
            <tr>
              <th style={{ width: 64 }}>日付</th>
              <th style={{ width: 52 }}>状態</th>
              <th style={{ width: 70 }}>種別</th>
              <th style={{ minWidth: 130 }}>メイン種目</th>
              <th style={{ width: 180 }}>サブ種目</th>
              <th style={{ width: 120 }}>備考</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, idx) => {
              const d = fmtDate(row.date);
              const isExp = expanded.has(row.id);
              const hasNote = row.note && row.note.length > 0;
              const isLong = row.note && row.note.length > 28;
              const mainNames = (row.main || []).map(it => it.exerciseName).filter(Boolean).join(" / ");
              const mainDetails = (row.main || []).map(it => [it.weight, formatRepsForDisplay(it.reps)].filter(Boolean).join(" ")).filter(Boolean).join(" / ");

              const openEdit = () => {
                setEditDate(row.date);
                setInitialDate(row.date);
                setOpenRec(true);
              };

              return (
                <tr
                  key={row.id}
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
                    <CondOrb value={row.condition} size={40} />
                  </td>
                  <td>
                    <span style={{
                      display: "inline-block",
                      fontSize: 10, padding: "3px 8px", borderRadius: 100,
                      background: row.type === "training" ? "var(--green-dim)" : "#F5F3EF",
                      color: row.type === "training" ? "var(--green)" : "var(--muted)",
                      fontWeight: 600, letterSpacing: ".05em", whiteSpace: "nowrap",
                    }}>
                      {row.type === "training" ? "運動" : "休息"}
                    </span>
                  </td>
                  <td>
                    {mainNames ? (
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 12, color: "var(--green)" }}>{mainNames}</div>
                        {!!mainDetails && (
                          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2, fontVariantNumeric: "tabular-nums" }}>
                            {mainDetails}
                          </div>
                        )}
                      </div>
                    ) : <span style={{ color: "#D0CDC5" }}>—</span>}
                  </td>
                  <td>
                    {(row.sub || []).length ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {(row.sub || []).map((it, i) => (
                          <div key={i} style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
                            <span style={{ color: "#C8C4BC", fontSize: 12, lineHeight: 1 }}>・</span>
                            <span style={{ fontSize: 11, color: "#666", lineHeight: 1.55, wordBreak: "break-word" }}>
                              {formatExerciseLine(it)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : <span style={{ color: "#D0CDC5", fontSize: 11 }}>—</span>}
                  </td>
                  <td>
                    {hasNote ? (
                      <div
                        onClick={(e) => { e.stopPropagation(); isLong && toggle(row.id); }}
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
                    ) : <span style={{ color: "#D0CDC5", fontSize: 11 }}>—</span>}
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
        title="トレーニングを記録"
      />
    </div>
  );
}
