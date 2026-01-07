import React, { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { bootstrapMe } from "../app/auth";
import { currentUser } from "../app/auth";
import { api } from "../app/api";
import { Toast } from "./Toast";

export function Layout() {
  const [me, setMe] = useState<any>(currentUser());
  const [toast, setToast] = useState<string | null>(null);
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      const u = await bootstrapMe();
      setMe(u);
    })();
  }, []);

  const logout = () => {
    api.logout();
    setMe(null);
    nav("/login");
  };

  const show = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <>
      <div className="header">
        <div className="brand">
          <Link to="/" className="h1">LMS</Link>
          <span className="badge">Biblioteka</span>
          {me?.role === "admin" ? <span className="badge">Admin</span> : null}
        </div>

        <div className="row" style={{ gap: 10 }}>
          {me ? (
            <>
              <span className="badge">{me.full_name}</span>
              <button className="btn secondary" onClick={() => show("Shkurtore: përdor menunë sipër.")}>Ndihmë</button>
              <button className="btn" onClick={logout}>Dil</button>
            </>
          ) : (
            <Link className="btn" to="/login">Hyr</Link>
          )}
        </div>
      </div>

      <div className="container">
        {me ? (
          <div className="card" style={{ padding: 14, marginBottom: 14 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
                <NavLink className="btn secondary" to="/">Paneli</NavLink>
                <NavLink className="btn secondary" to="/books">Librat</NavLink>
                <NavLink className="btn secondary" to="/loans">Huazimet</NavLink>
                {me.role === "admin" ? <NavLink className="btn secondary" to="/admin">Administrim</NavLink> : null}
              </div>
              <span className="kbd">API: {import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api"}</span>
            </div>
          </div>
        ) : null}

        <Outlet />
      </div>

      {toast ? <Toast message={toast} /> : null}
    </>
  );
}
