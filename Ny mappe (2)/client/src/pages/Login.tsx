import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../app/auth";
import { Field } from "../components/Field";

export function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@lms.local");
  const [password, setPassword] = useState("Admin123!");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await login(email, password);
      nav("/");
    } catch (e: any) {
      setErr(e?.message || "Nuk u arrit hyrja.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ padding: 18, maxWidth: 520, margin: "0 auto" }}>
      <h1 className="h1">Hyr në sistem</h1>
      <p className="p">Përdor kredencialet e admin-it (dev) ose krijo përdorues të rinj nga DB.</p>
      <hr />
      <form onSubmit={onSubmit} className="col">
        <Field label="Email" hint="p.sh. admin@lms.local">
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Fjalëkalimi">
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        {err ? <div className="card" style={{ padding: 12, borderRadius: 14, borderColor: "rgba(255,107,107,.45)" }}>{err}</div> : null}
        <button className="btn" disabled={loading}>{loading ? "Duke hyrë..." : "Hyr"}</button>
        <div className="row" style={{ justifyContent:"space-between" }}>
          <span className="kbd">Admin: Admin123!</span>
          <span className="kbd">User: User123!</span>
        </div>
      </form>
    </div>
  );
}
