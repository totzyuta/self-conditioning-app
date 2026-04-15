import React from "react";

export default function AddBtn({ onClick, label }) {
  return (
    <button type="button" onClick={onClick} style={{
      background: "none", border: "1px dashed #C8C4BC", color: "var(--muted)",
      padding: "6px 14px", borderRadius: 6, fontSize: 11, letterSpacing: ".05em",
      transition: "all .15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor="var(--green)"; e.currentTarget.style.color="var(--green)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor="#C8C4BC"; e.currentTarget.style.color="var(--muted)"; }}
    >{label}</button>
  );
}
