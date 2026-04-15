import React from "react";

function Base({ children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function IconWave() {
  return (
    <Base>
      <path d="M3 15c2.2 0 2.2-6 4.4-6 2.2 0 2.2 12 4.4 12 2.2 0 2.2-18 4.4-18 2.2 0 2.2 12 4.4 12" />
    </Base>
  );
}

export function IconDumbbell() {
  return (
    <Base>
      <path d="M7 10v4" />
      <path d="M17 10v4" />
      <path d="M9 11h6" />
      <path d="M6 9h2v6H6z" />
      <path d="M16 9h2v6h-2z" />
    </Base>
  );
}

export function IconFoot() {
  return (
    <Base>
      <path d="M10.5 6.2c.4-1.1 1.9-1.6 2.9-.9.7.5.9 1.4.5 2.2-.6 1.2-2.2 2.2-2.2 3.8 0 1.3 1 2.5 2.6 2.9 1.7.5 3.5-.4 4.2-2.1.7-1.8-.2-3.3-1.6-4.9" />
      <path d="M7.8 14.2c-1.1 1.2-1.8 2.5-1.8 3.7 0 1.7 1.4 3.1 3.1 3.1h.4c1.2 0 2.3-.6 2.8-1.6" />
      <path d="M13.2 4.8v0.1" />
      <path d="M15.1 4.8v0.1" />
      <path d="M17 5.3v0.1" />
    </Base>
  );
}

export function IconScale() {
  return (
    <Base>
      <rect x="5" y="4" width="14" height="16" rx="3" />
      <path d="M12 8a3 3 0 0 0-3 3" />
      <path d="M12 11l2-2" />
      <path d="M9.5 16.5h5" />
    </Base>
  );
}

export function IconUser() {
  return (
    <Base>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 20c1.4-3.3 4-5 7-5s5.6 1.7 7 5" />
    </Base>
  );
}

export function iconForKey(key) {
  if (key === "wave") return <IconWave />;
  if (key === "dumbbell") return <IconDumbbell />;
  if (key === "foot") return <IconFoot />;
  if (key === "scale") return <IconScale />;
  return <IconUser />;
}

