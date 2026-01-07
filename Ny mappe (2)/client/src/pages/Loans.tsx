import React, { useEffect, useState } from "react";
import { api } from "../app/api";
import { currentUser } from "../app/auth";
import { Field } from "../components/Field";

export function LoansPage() {
  const me = currentUser();
  const isAdmin = me?.role === "admin";

  const [items, setItems] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = isAdmin ? await api.allLoans({ status: status || undefined, page: 1, pageSize: 200 })
                          : await api.myLoans({ status: status || undefined, page: 1, pageSize: 200 });
      setItems(res.items || []);
      setTotal(res.total || 0);
    } catch (e: any) {
      setErr(e?.message || "Gabim në ngarkim.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [status]);

  const returnLoan = async (id: string) => {
    setErr(null);
    try {
      await api.returnLoan(id);
      await load();
    } catch (e: any) {
      setErr(e?.message || "Nuk u arrit kthimi.");
    }
  };

  return (
    <div className="col">
      <div className="card" style={{ padding: 16 }}>
        <div className="row" style={{ justifyContent:"space-between", alignItems:"flex-start" }}>
          <div className="col" style={{ gap: 6 }}>
            <h1 className="h1" style={{ margin: 0 }}>Huazimet</h1>
            <p className="p">{isAdmin ? "Pamje admin për të gjitha huazimet." : "Huazimet e mia (maks. 3 aktive)."} </p>
          </div>
          <a className="btn secondary" href={api.exportLoansCsv()} target="_blank" rel="noreferrer">Eksporto CSV</a>
        </div>

        <hr />

        <div className="grid grid-3">
          <Field label="Status">
            <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Të gjitha</option>
              <option value="active">Aktive</option>
              <option value="overdue">Afati i kaluar</option>
              <option value="returned">Kthyera</option>
            </select>
          </Field>
          <div className="col" style={{ justifyContent:"flex-end" }}>
            <button className="btn" onClick={load}>Rifresko</button>
          </div>
          <div className="col" style={{ justifyContent:"flex-end" }}>
            <span className="kbd">Totali: {total}</span>
          </div>
        </div>
      </div>

      {err ? <div className="card" style={{ padding: 12, borderRadius: 14, borderColor: "rgba(255,107,107,.45)" }}>{err}</div> : null}

      <div className="card" style={{ padding: 0, overflow:"hidden" }}>
        <table className="table">
          <thead>
            <tr>
              {isAdmin ? <th>Përdoruesi</th> : null}
              <th>Libri</th>
              <th>Huazuar</th>
              <th>Afati</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={isAdmin ? 6 : 5} style={{ color:"var(--muted)" }}>Duke ngarkuar...</td></tr>
            ) : items.length ? items.map((l) => (
              <tr key={l.id}>
                {isAdmin ? <td style={{ color:"var(--muted)" }}>{l.user_full_name || l.user_email}</td> : null}
                <td style={{ fontWeight: 700 }}>{l.book_title}</td>
                <td style={{ color:"var(--muted)" }}>{new Date(l.loan_date).toLocaleString()}</td>
                <td style={{ color:"var(--muted)" }}>{new Date(l.due_date).toLocaleDateString()}</td>
                <td><span className="badge">{l.status}</span></td>
                <td style={{ textAlign:"right" }}>
                  {l.return_date ? <span className="kbd">Kthyer</span> :
                    <button className="btn ok" onClick={() => returnLoan(l.id)}>Kthe</button>}
                </td>
              </tr>
            )) : (
              <tr><td colSpan={isAdmin ? 6 : 5} style={{ color:"var(--muted)" }}>Nuk ka të dhëna.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
