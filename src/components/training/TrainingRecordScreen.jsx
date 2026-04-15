import React, { useEffect, useMemo, useState } from "react";
import { LABEL_S } from "../condition/chartConstants.js";
import AddBtn from "../ui/AddBtn.jsx";
import { todayISO } from "../../lib/format.js";
import { v2ItemsToFormRows } from "../../lib/v2State.js";

export default function TrainingRecordScreen({ onClose, onSubmit, onDelete, v2, initialDate, editDate }) {
  const [date, setDate] = useState(initialDate || todayISO());
  const [mainExs, setMainExs] = useState([{ name: "", weight: "", reps: "" }]);
  const [subExs, setSubExs]   = useState([{ name: "", weight: "", reps: "" }]);
  const [note, setNote]       = useState("");
  const [saved, setSaved]     = useState(false);

  useEffect(() => {
    const d = editDate || initialDate || todayISO();
    setDate(d);
  }, [editDate, initialDate]);

  useEffect(() => {
    const tr = v2.trainingByDate?.[date];
    setMainExs(v2ItemsToFormRows(tr?.items?.main));
    setSubExs(v2ItemsToFormRows(tr?.items?.sub));
    setNote(tr?.note || "");
    setSaved(false);
  }, [date, v2]);

  const canDelete = useMemo(() => {
    const tr = v2.trainingByDate?.[date];
    const m = (tr?.items?.main || []).filter(it => String(it.exerciseName || "").trim()).length;
    const s = (tr?.items?.sub || []).filter(it => String(it.exerciseName || "").trim()).length;
    const n = (tr?.note || "").trim().length;
    return m + s > 0 || n > 0;
  }, [date, v2]);

  const updMain = (i, k, v) => setMainExs(a => { const n=[...a]; n[i]={...n[i],[k]:v}; return n; });
  const updSub  = (i, k, v) => setSubExs(a  => { const n=[...a]; n[i]={...n[i],[k]:v}; return n; });

  const handleSubmit = (e) => {
    e.preventDefault();
    const conditionScore = v2.conditionsByDate?.[date]?.score ?? null;
    onSubmit({
      __v2form: true,
      date,
      conditionScore: conditionScore == null ? null : Number(conditionScore),
      note,
      mainRows: mainExs,
      subRows: subExs,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDelete = () => {
    if (!canDelete) return;
    const ok = window.confirm("このトレーニング記録を削除しますか？（元に戻せません）");
    if (!ok) return;
    try {
      onDelete?.(date);
    } finally {
      onClose?.();
    }
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
            {editDate ? "トレーニングを編集" : "トレーニングを記録"}
          </h2>
          {canDelete ? (
            <button
              type="button"
              onClick={handleDelete}
              style={{
                width: 70,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                background: "none",
                border: "none",
                color: "var(--muted)",
                padding: 0,
              }}
              title="削除"
              aria-label="削除"
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--terra)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7h16" />
                <path d="M9 7V5.5c0-.83.67-1.5 1.5-1.5h3C14.83 4 15.5 4.67 15.5 5.5V7" />
                <path d="M7 7l1 14h8l1-14" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
              </svg>
            </button>
          ) : (
            <div style={{ width: 70 }} />
          )}
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

          <div style={{ marginBottom: 18 }}>
            <div style={LABEL_S}>メイン種目</div>
            {mainExs.map((ex, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 76px 100px", gap: 6, marginBottom: 6 }}>
                <input type="text" placeholder="種目名 (例: BP)" value={ex.name} onChange={e => updMain(i,"name",e.target.value)} />
                <input type="text" placeholder="重量" value={ex.weight} onChange={e => updMain(i,"weight",e.target.value)} />
                <input type="text" placeholder="回数 7,6,4" value={ex.reps} onChange={e => updMain(i,"reps",e.target.value)} />
              </div>
            ))}
            <AddBtn onClick={() => setMainExs(a => [...a, {name:"",weight:"",reps:""}])} label="+ 種目を追加" />
          </div>

          <div style={{ marginBottom: 18 }}>
            <div style={LABEL_S}>サブ種目</div>
            {subExs.map((ex, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 76px 100px", gap: 6, marginBottom: 6 }}>
                <input type="text" placeholder="種目名 (例: DBP)" value={ex.name} onChange={e => updSub(i,"name",e.target.value)} />
                <input type="text" placeholder="重量" value={ex.weight} onChange={e => updSub(i,"weight",e.target.value)} />
                <input type="text" placeholder="回数 9,8,7" value={ex.reps} onChange={e => updSub(i,"reps",e.target.value)} />
              </div>
            ))}
            <AddBtn onClick={() => setSubExs(a => [...a, {name:"",weight:"",reps:""}])} label="+ 種目を追加" />
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={LABEL_S}>メモ・備考</div>
            <textarea placeholder="気づいたこと、体の状態など..." value={note} onChange={e => setNote(e.target.value)} />
          </div>

          <button type="submit" style={{
            width: "100%", padding: "14px",
            background: saved ? "var(--green)" : "var(--terra)",
            color: "#fff", border: "none", borderRadius: 7,
            fontSize: 14, fontWeight: 600, letterSpacing: ".07em",
            transition: "background .35s",
            boxShadow: `0 3px 14px ${saved ? "rgba(45,90,39,.25)" : "rgba(196,97,58,.25)"}`,
          }}>
            {saved ? "✓  保存しました" : "記録する"}
          </button>
        </form>
      </div>
    </div>
  );
}
