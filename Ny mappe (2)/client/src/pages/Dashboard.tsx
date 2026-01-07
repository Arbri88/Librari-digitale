import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../app/api";
import { currentUser } from "../app/auth";

export function DashboardPage() {
  const me = currentUser();
  const [stats, setStats] = useState<{ books?: number; available?: number; loans?: number; overdue?: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const books = await api.listBooks({ page: 1, pageSize: 1 });
        const allBooks = await api.listBooks({ page: 1, pageSize: 100 });
        const available = (allBooks.items || []).reduce((a: number, b: any) => a + (b.available_copies || 0), 0);

        const loansRes = await api.myLoans({ page: 1, pageSize: 200 });
        const loans = loansRes.total || (loansRes.items?.length ?? 0);
        const overdue = (loansRes.items || []).filter((l: any) => l.status === "overdue").length;

        setStats({ books: books.total, available, loans, overdue });
      } catch (e: any) {
        setErr(e?.message || "Gabim në ngarkimin e statistikave.");
      }
    })();
  }, []);

  const cards = useMemo(() => ([
    { title:"Librat", value: stats?.books ?? "—", hint:"Totali", to:"/books" },
    { title:"Kopje të lira", value: stats?.available ?? "—", hint:"Disponueshmëria", to:"/books?available=true" },
    { title:"Huazime", value: stats?.loans ?? "—", hint:"Të miat", to:"/loans" },
    { title:"Me afat të kaluar", value: stats?.overdue ?? "—", hint:"Overdue", to:"/loans?status=overdue" },
  ]), [stats]);

  return (
    <div className="col">
      <div className="card" style={{ padding: 18 }}>
        <div className="row" style={{ justifyContent:"space-between", alignItems:"flex-start" }}>
          <div className="col" style={{ gap: 6 }}>
            <h1 className="h1" style={{ margin: 0 }}>Mirë se erdhe, {me?.full_name}</h1>
            <p className="p">Ky është një panel i thjeshtë për menaxhimin e librave dhe huazimeve.</p>
          </div>
          {me?.role === "admin" ? <Link className="btn" to="/admin">Shko te Administrimi</Link> : <Link className="btn" to="/books">Shfleto Librat</Link>}
        </div>
      </div>

      {err ? <div className="card" style={{ padding: 12, borderRadius: 14, borderColor: "rgba(255,107,107,.45)" }}>{err}</div> : null}

      <div className="grid grid-2">
        {cards.map((c) => (
          <Link key={c.title} to={c.to} className="card" style={{ padding: 16 }}>
            <div className="row" style={{ justifyContent:"space-between" }}>
              <div className="col" style={{ gap: 6 }}>
                <div className="h2">{c.title}</div>
                <div className="h1" style={{ fontSize: 34 }}>{c.value}</div>
              </div>
              <span className="badge">{c.hint}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div className="h2">Rrjedha tipike</div>
        <ul className="p" style={{ marginTop: 8 }}>
          <li>Admin shton libra/kategori dhe menaxhon përdoruesit.</li>
          <li>Përdoruesi kërkon librat dhe huazon (maks. 3 aktiv).</li>
          <li>Kthimi përditëson automatikisht kopjet e disponueshme.</li>
        </ul>
      </div>
    </div>
  );
}
