import React from "react";

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="col" style={{ gap: 6 }}>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <span style={{ fontWeight: 700 }}>{label}</span>
        {hint ? <span className="kbd">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}
