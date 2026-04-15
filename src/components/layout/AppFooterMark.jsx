import React from "react";

export default function AppFooterMark({ version }) {
  return (
    <footer style={{
      padding: "24px", textAlign: "center",
      borderTop: "1px solid var(--border)",
      fontSize: 9, color: "#D0CDC5", letterSpacing: ".15em",
    }}>
      SELF CONDITIONING APP  ·  {version}
    </footer>
  );
}
