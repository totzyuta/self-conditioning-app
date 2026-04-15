import React, { useEffect, useState } from "react";
import { LABEL_S } from "../condition/chartConstants.js";
import { todayISO } from "../../lib/format.js";

export default function WeightRecordScreen({ onClose, onSubmit, v2, initialDate, editDate }) {
  const [date, setDate] = useState(initialDate || todayISO());
  const [weight, setWeight] = useState("");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const d = editDate || initialDate || todayISO();
    setDate(d);
  }, [editDate, initialDate]);

  useEffect(() => {
    const row = v2.weightByDate?.[date];
    setWeight(row?.weight != null ? String(row.weight) : "");
    setNote(row?.note != null ? String(row.note) : "");
    setSaved(false);
  }, [date, v2]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const n = weight.trim() === "" ? null : Number(weight);
    onSubmit({
      date,
      weight: Number.isFinite(n) ? n : null,
      weightNote: note,
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
            {editDate ? "体重を編集" : "体重を記録"}
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
            <div style={LABEL_S}>体重（kg）</div>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              placeholder="例: 63.4"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", fontSize: 16 }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={LABEL_S}>メモ（任意）</div>
            <textarea
              placeholder="朝/夜、体調、食事など"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "14px",
              background: saved ? "var(--green)" : "var(--terra)",
              color: "#fff",
              border: "none",
              borderRadius: 7,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: ".07em",
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

