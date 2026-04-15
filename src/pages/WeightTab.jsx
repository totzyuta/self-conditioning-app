import React, { useEffect, useMemo, useState } from "react";
import { fmtDate, todayISO } from "../lib/format.js";
import WeightChartCard from "../components/weight/WeightChartCard.jsx";
import WeightRecordScreen from "../components/weight/WeightRecordScreen.jsx";

export default function WeightTab({ v2, onSaveWeightDay }) {
  const [openRec, setOpenRec] = useState(false);
  const [editDate, setEditDate] = useState(null);
  const [initialDate, setInitialDate] = useState(todayISO());
  const [monthFilter, setMonthFilter] = useState("all");
  const [expanded, setExpanded] = useState(new Set());
  const [selectedMonth, setSelectedMonth] = useState(() => todayISO().slice(0, 7));

  const rows = useMemo(() => {
    return Object.entries(v2.weightByDate || {})
      .filter(([, row]) => row && (row.weight != null || String(row.note || "").trim()))
      .map(([date, row]) => ({
        date,
        weight: row.weight,
        note: String(row.note || ""),
      }))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [v2]);

  const availableMonths = useMemo(() => {
    const seen = new Set();
    const months = [];
    rows.forEach(r => {
      const ym = r.date.slice(0, 7);
      if (!seen.has(ym)) {
        seen.add(ym);
        const [y, m] = ym.split("-");
        months.push({ key: ym, label: `${y}年${parseInt(m, 10)}月` });
      }
    });
    return months.sort((a, b) => b.key.localeCompare(a.key));
  }, [rows]);

  const minMonth = availableMonths.length ? availableMonths[availableMonths.length - 1].key : undefined;
  const maxMonth = availableMonths.length ? availableMonths[0].key : undefined;

  useEffect(() => {
    if (!minMonth || !maxMonth) return;
    setSelectedMonth(prev => {
      if (!prev) return maxMonth;
      if (prev < minMonth) return minMonth;
      if (prev > maxMonth) return maxMonth;
      return prev;
    });
  }, [minMonth, maxMonth]);

  const filtered = useMemo(() => {
    if (monthFilter === "all") return rows;
    return rows.filter(r => r.date.startsWith(monthFilter));
  }, [rows, monthFilter]);

  const toggle = id => setExpanded(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  if (openRec) {
    return (
      <WeightRecordScreen
        v2={v2}
        onClose={() => { setOpenRec(false); setEditDate(null); }}
        onSubmit={(payload) => {
          onSaveWeightDay(payload);
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
        <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: ".05em" }}>体重</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>{filtered.length} entries</span>
          <button
            type="button"
            onClick={() => { setEditDate(null); setInitialDate(todayISO()); setOpenRec(true); }}
            style={{
              background: "var(--terra)", color: "#fff", border: "none",
              padding: "8px 12px", borderRadius: 9, fontSize: 11, fontWeight: 700,
              letterSpacing: ".06em", boxShadow: "0 3px 14px rgba(196,97,58,.22)",
            }}
            title="体重を記録"
          >
            記録する
          </button>
        </div>
      </div>

      <div style={{ padding: "14px 24px 0" }}>
        <WeightChartCard v2={v2} defaultPeriod="1m" height={140} />
      </div>

      <div style={{ display: "flex", gap: 10, padding: "18px 24px 0", alignItems: "center" }}>
        <button
          type="button"
          onClick={() => setMonthFilter("all")}
          style={{
            background: monthFilter === "all" ? "var(--terra)" : "none",
            color: monthFilter === "all" ? "#fff" : "var(--muted)",
            border: "1px solid",
            borderColor: monthFilter === "all" ? "var(--terra)" : "var(--border)",
            borderRadius: 100,
            padding: "4px 12px",
            fontSize: 10,
            fontWeight: 700,
            whiteSpace: "nowrap",
            transition: "all .15s",
          }}
        >
          全期間
        </button>
        <div style={{ display: "flex" }}>
          <input
            type="month"
            value={monthFilter === "all" ? selectedMonth : monthFilter}
            min={minMonth}
            max={maxMonth}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return;
              setSelectedMonth(v);
              setMonthFilter(v);
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
            title="年月で絞り込み"
          />
        </div>
      </div>

      <div style={{ overflowX: "auto", padding: "12px 24px 0" }}>
        <table style={{ minWidth: 520 }}>
          <thead>
            <tr>
              <th style={{ width: 64 }}>日付</th>
              <th style={{ width: 90 }}>体重</th>
              <th style={{ minWidth: 200 }}>メモ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, idx) => {
              const d = fmtDate(row.date);
              const id = `w_${row.date}`;
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
                      {row.weight != null ? `${Number(row.weight).toFixed(1)} kg` : "—"}
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

