import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../app/api";
import { currentUser } from "../app/auth";
import { Field } from "../components/Field";
import { Modal } from "../components/Modal";

type Book = any;

function clamp(n: number, a: number, b: number) { return Math.max(a, Math.min(b, n)); }

export function BooksPage() {
  const me = currentUser();
  const isAdmin = me?.role === "admin";
  const [params, setParams] = useSearchParams();

  const [items, setItems] = useState<Book[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [page, setPage] = useState<number>(Number(params.get("page") || 1));
  const [q, setQ] = useState(params.get("q") || "");
  const [category, setCategory] = useState(params.get("category") || "");
  const [available, setAvailable] = useState(params.get("available") || "");
  const [sort, setSort] = useState(params.get("sort") || "created_at");
  const [order, setOrder] = useState(params.get("order") || "desc");

  const [borrowOpen, setBorrowOpen] = useState<Book | null>(null);
  const [borrowErr, setBorrowErr] = useState<string | null>(null);
  const [borrowLoading, setBorrowLoading] = useState(false);

  const pageSize = 12;

  const fetchData = async () => {
    setLoading(true);
    setErr(null);
    try {
      const [cats, books] = await Promise.all([
        api.listCategories(),
        q.trim()
          ? api.searchBooks(q.trim(), page, pageSize)
          : api.listBooks({ page, pageSize, category: category || undefined, available: available ? available === "true" : undefined, sort, order }),
      ]);
      setCategories(cats);
      setItems(books.items || []);
      setTotal(books.total || 0);
    } catch (e: any) {
      setErr(e?.message || "Gabim në ngarkim.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page]);

  const applyFilters = () => {
    const p: any = {};
    if (page !== 1) p.page = "1";
    if (q) p.q = q;
    if (category) p.category = category;
    if (available) p.available = available;
    if (sort) p.sort = sort;
    if (order) p.order = order;
    setParams(p);
    setPage(1);
    fetchData();
  };

  const pages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total]);
  const canPrev = page > 1;
  const canNext = page < pages;

  const borrow = async (book: Book) => {
    setBorrowLoading(true);
    setBorrowErr(null);
    try {
      await api.borrow(book.id);
      setBorrowOpen(null);
      await fetchData();
    } catch (e: any) {
      setBorrowErr(e?.message || "Nuk u arrit huazimi.");
    } finally {
      setBorrowLoading(false);
    }
  };

  return (
    <div className="col">
      <div className="card" style={{ padding: 16 }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems:"flex-start" }}>
          <div className="col" style={{ gap: 6 }}>
            <h1 className="h1" style={{ margin: 0 }}>Librat</h1>
            <p className="p">Kërkim, filtrim dhe huazim. Admin ka akses për krijim/ndryshim.</p>
          </div>
          {isAdmin ? <Link className="btn" to="/admin">Shto/menaxho (Admin)</Link> : null}
        </div>

        <hr />

        <div className="grid grid-3">
          <Field label="Kërko" hint="titull/autor/ISBN">
            <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="p.sh. Kadare" />
          </Field>
          <Field label="Kategori">
            <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Të gjitha</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Disponueshmëria">
            <select className="select" value={available} onChange={(e) => setAvailable(e.target.value)}>
              <option value="">Të gjitha</option>
              <option value="true">Ka kopje</option>
              <option value="false">S'ka kopje</option>
            </select>
          </Field>
          <Field label="Sorto sipas">
            <select className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="created_at">Shtuar së fundmi</option>
              <option value="title">Titulli</option>
              <option value="author">Autori</option>
              <option value="published_year">Viti</option>
            </select>
          </Field>
          <Field label="Renditja">
            <select className="select" value={order} onChange={(e) => setOrder(e.target.value)}>
              <option value="desc">Zbritëse</option>
              <option value="asc">Ngritëse</option>
            </select>
          </Field>
          <div className="col" style={{ justifyContent:"flex-end" }}>
            <button className="btn" onClick={applyFilters}>Apliko</button>
          </div>
        </div>
      </div>

      {err ? <div className="card" style={{ padding: 12, borderRadius: 14, borderColor: "rgba(255,107,107,.45)" }}>{err}</div> : null}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Titulli</th>
              <th>Autori</th>
              <th>Kategoria</th>
              <th>Kopje</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ color:"var(--muted)" }}>Duke ngarkuar...</td></tr>
            ) : items.length ? (
              items.map((b) => (
                <tr key={b.id}>
                  <td><Link to={`/books/${b.id}`} style={{ fontWeight: 700 }}>{b.title}</Link></td>
                  <td style={{ color:"var(--muted)" }}>{b.author}</td>
                  <td style={{ color:"var(--muted)" }}>{b.category_name || "—"}</td>
                  <td><span className="badge">{b.available_copies}/{b.total_copies}</span></td>
                  <td style={{ textAlign:"right" }}>
                    <div className="row" style={{ justifyContent:"flex-end" }}>
                      <Link className="btn secondary" to={`/books/${b.id}`}>Detaje</Link>
                      <button
                        className="btn ok"
                        disabled={b.available_copies <= 0}
                        onClick={() => setBorrowOpen(b)}
                      >
                        Huazo
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} style={{ color:"var(--muted)" }}>Nuk ka të dhëna.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="row" style={{ justifyContent:"space-between" }}>
        <span className="kbd">Totali: {total}</span>
        <div className="row">
          <button className="btn secondary" disabled={!canPrev} onClick={() => setPage((p) => clamp(p - 1, 1, pages))}>Mbrapa</button>
          <span className="badge">Faqe {page} / {pages}</span>
          <button className="btn secondary" disabled={!canNext} onClick={() => setPage((p) => clamp(p + 1, 1, pages))}>Para</button>
        </div>
      </div>

      {borrowOpen ? (
        <Modal
          title={`Huazo: ${borrowOpen.title}`}
          onClose={() => setBorrowOpen(null)}
          actions={
            <>
              <button className="btn secondary" onClick={() => setBorrowOpen(null)}>Anulo</button>
              <button className="btn ok" disabled={borrowLoading} onClick={() => borrow(borrowOpen)}>
                {borrowLoading ? "Duke huazuar..." : "Konfirmo"}
              </button>
            </>
          }
        >
          <p className="p">Afati: 14 ditë. Maksimumi 3 huazime aktive për përdorues.</p>
          {borrowErr ? <div className="card" style={{ padding: 12, borderRadius: 14, borderColor: "rgba(255,107,107,.45)" }}>{borrowErr}</div> : null}
        </Modal>
      ) : null}
    </div>
  );
}
