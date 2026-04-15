import React, { useEffect, useState } from "react";
import { LABEL_S } from "./chartConstants.js";
import { todayISO, condColor } from "../../lib/format.js";

export default function ConditionRecordScreen({ onClose, onSubmit, v2, initialDate, editDate }) {
  const [date, setDate] = useState(initialDate || todayISO());
  const [cond, setCond] = useState("5.0");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const d = editDate || initialDate || todayISO();
    setDate(d);
  }, [editDate, initialDate]);

  useEffect(() => {
    const row = v2.conditionsByDate?.[date];
    const v = row?.score;
    setCond(v != null ? String(Number(v)) : "5.0");
    setNote(row?.note != null ? String(row.note) : "");
    setSaved(false);
  }, [date, v2]);

  const cv = parseFloat(cond);
  const cc = condColor(Number.isFinite(cv) ? cv : 5);
  const pct = (Math.min(10, Math.max(0, Number.isFinite(cv) ? cv : 5)) / 10) * 100;

  const handleSubmit = (e) => {
    e.preventDefault();
    const n = parseFloat(cond);
    onSubmit({
      date,
      conditionScore: Number.isFinite(n) ? n : null,
      conditionNote: note,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="fade-up" style={{ padding: "18px 16px 56px" }}>
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        padding: "18px 18px 22px",
        boxShadow: "0 6px 26px rgba(0,0,0,.06)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "1px solid var(--border)",
              color: "var(--muted)",
              padding: "7px 10px",
              borderRadius: 10,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: ".04em",
              whiteSpace: "nowrap",
            }}
            title="一覧に戻る"
          >
            ← 戻る
          </button>
          <h2 style={{ flex: 1, textAlign: "center", fontSize: 14, fontWeight: 800, letterSpacing: ".02em" }}>
            {editDate ? "コンディションを編集" : "コンディションを記録"}
          </h2>
          <div style={{ width: 70 }} />
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 18, overflow: "hidden" }}>
            <div style={LABEL_S}>日付</div>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
              style={{ width: "100%", boxSizing: "border-box", padding: "7px 6px", fontSize: "16px" }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 9, letterSpacing: ".15em", color: "var(--muted)", textTransform: "uppercase" }}>スコア</span>
              <span style={{ fontSize: 24, fontWeight: 100, color: cc, letterSpacing: "-1px", fontVariantNumeric: "tabular-nums" }}>
                {Number.isFinite(cv) ? cv.toFixed(1) : "—"}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              step="0.1"
              value={Number.isFinite(cv) ? cv : 5}
              onChange={e => setCond(e.target.value)}
              style={{ background: `linear-gradient(to right, ${cc} ${pct}%, var(--border) ${pct}%)`, width: "100%" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "var(--muted)", marginTop: 4 }}>
              <span>0</span><span>NEUTRAL 5.0</span><span>10</span>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={LABEL_S}>コンディションメモ</div>
            <textarea
              placeholder="睡眠、疲労、気分、体の変化など（トレーニングのメモとは別）"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>

          <button
            type="submit"
            style={{
              width: "100%", padding: "14px",
              background: saved ? "var(--green)" : "var(--terra)",
              color: "#fff", border: "none", borderRadius: 7,
              fontSize: 14, fontWeight: 600, letterSpacing: ".07em",
              transition: "background .35s",
              boxShadow: `0 3px 14px ${saved ? "rgba(45,90,39,.25)" : "rgba(196,97,58,.25)"}`,
            }}
          >
            {saved ? "✓  保存しました" : "記録する"}
          </button>
        </form>
      </div>
    </div>
  );
}
