import React from "react";

export function Modal({ title, children, onClose, actions }: { title: string; children: React.ReactNode; onClose: () => void; actions?: React.ReactNode }) {
  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,.55)",
      display:"flex", alignItems:"center", justifyContent:"center", padding:18, zIndex:50
    }}>
      <div className="card" style={{ width:"min(860px, 100%)", padding:16 }}>
        <div className="row" style={{ justifyContent:"space-between", alignItems:"flex-start" }}>
          <div className="col" style={{ gap:4 }}>
            <h2 className="h1" style={{ margin:0 }}>{title}</h2>
            <p className="p">Plotëso fushat dhe ruaj ndryshimet.</p>
          </div>
          <button className="btn secondary" onClick={onClose}>Mbyll</button>
        </div>
        <hr />
        {children}
        {actions ? (
          <>
            <hr />
            <div className="row" style={{ justifyContent:"flex-end" }}>{actions}</div>
          </>
        ) : null}
      </div>
    </div>
  );
}
