import React, { useEffect, useState } from "react";
import { api } from "../../app/api";
import { Field } from "../../components/Field";
import { Modal } from "../../components/Modal";

export function AdminPage() {
  const [tab, setTab] = useState<"books"|"categories"|"users">("books");

  return (
    <div className="col">
      <div className="card" style={{ padding: 16 }}>
        <div className="row" style={{ justifyContent:"space-between", alignItems:"flex-start" }}>
          <div className="col" style={{ gap: 6 }}>
            <h1 className="h1" style={{ margin: 0 }}>Administrim</h1>
            <p className="p">Menaxho librat, kategoritë dhe përdoruesit.</p>
          </div>
          <div className="row">
            <button className={"btn " + (tab==="books" ? "" : "secondary")} onClick={() => setTab("books")}>Librat</button>
            <button className={"btn " + (tab==="categories" ? "" : "secondary")} onClick={() => setTab("categories")}>Kategoritë</button>
            <button className={"btn " + (tab==="users" ? "" : "secondary")} onClick={() => setTab("users")}>Përdoruesit</button>
          </div>
        </div>
      </div>

      {tab === "books" ? <BooksAdmin /> : null}
      {tab === "categories" ? <CategoriesAdmin /> : null}
      {tab === "users" ? <UsersAdmin /> : null}
    </div>
  );
}

function BooksAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setErr(null);
    try {
      const [c, b] = await Promise.all([api.listCategories(), api.listBooks({ page: 1, pageSize: 200, sort:"created_at", order:"desc" })]);
      setCats(c);
      setItems(b.items || []);
    } catch (e: any) {
      setErr(e?.message || "Gabim në ngarkim.");
    }
  };

  useEffect(() => { load(); }, []);

  const createNew = () => setOpen({
    _mode:"create",
    category_id:"",
    title:"",
    author:"",
    isbn:"",
    description:"",
    cover_image_url:"",
    total_copies:1,
    available_copies:1,
    published_year:"",
    pages:"",
    language:"Shqip",
  });

  const edit = (b: any) => setOpen({ _mode:"edit", ...b });

  const save = async () => {
    setSaving(true);
    setErr(null);
    try {
      const body = {
        category_id: open.category_id || null,
        title: open.title,
        author: open.author,
        isbn: open.isbn || null,
        description: open.description || null,
        cover_image_url: open.cover_image_url || null,
        total_copies: Number(open.total_copies),
        available_copies: Number(open.available_copies),
        published_year: open.published_year ? Number(open.published_year) : null,
        pages: open.pages ? Number(open.pages) : null,
        language: open.language || null,
      };
      if (open._mode === "create") await api.createBook(body);
      else await api.updateBook(open.id, body);
      setOpen(null);
      await load();
    } catch (e: any) {
      setErr(e?.message || "Nuk u ruajt.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Ta fshij librin?")) return;
    setErr(null);
    try {
      await api.deleteBook(id);
      await load();
    } catch (e: any) {
      setErr(e?.message || "Nuk u fshi.");
    }
  };

  return (
    <div className="col">
      <div className="card" style={{ padding: 16 }}>
        <div className="row" style={{ justifyContent:"space-between" }}>
          <div className="col">
            <div className="h2">Librat</div>
            <div className="p">Krijo/ndrysho/fshi (soft delete).</div>
          </div>
          <div className="row">
            <button className="btn" onClick={createNew}>Shto libër</button>
            <a className="btn secondary" href={api.exportBooksCsv()} target="_blank" rel="noreferrer">Eksporto CSV</a>
          </div>
        </div>
        {err ? <div className="card" style={{ marginTop: 12, padding: 12, borderColor:"rgba(255,107,107,.45)" }}>{err}</div> : null}
      </div>

      <div className="card" style={{ padding: 0, overflow:"hidden" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Titulli</th><th>Autori</th><th>Kopje</th><th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((b) => (
              <tr key={b.id}>
                <td style={{ fontWeight: 700 }}>{b.title}</td>
                <td style={{ color:"var(--muted)" }}>{b.author}</td>
                <td><span className="badge">{b.available_copies}/{b.total_copies}</span></td>
                <td style={{ textAlign:"right" }}>
                  <div className="row" style={{ justifyContent:"flex-end" }}>
                    <button className="btn secondary" onClick={() => edit(b)}>Ndrysho</button>
                    <button className="btn danger" onClick={() => remove(b.id)}>Fshi</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open ? (
        <Modal title={open._mode === "create" ? "Shto libër" : "Ndrysho libër"} onClose={() => setOpen(null)} actions={
          <>
            <button className="btn secondary" onClick={() => setOpen(null)}>Anulo</button>
            <button className="btn ok" disabled={saving} onClick={save}>{saving ? "Duke ruajtur..." : "Ruaj"}</button>
          </>
        }>
          <div className="grid grid-2">
            <Field label="Titulli"><input className="input" value={open.title} onChange={(e) => setOpen({ ...open, title: e.target.value })} /></Field>
            <Field label="Autori"><input className="input" value={open.author} onChange={(e) => setOpen({ ...open, author: e.target.value })} /></Field>
            <Field label="Kategori">
              <select className="select" value={open.category_id || ""} onChange={(e) => setOpen({ ...open, category_id: e.target.value })}>
                <option value="">Pa kategori</option>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="ISBN"><input className="input" value={open.isbn || ""} onChange={(e) => setOpen({ ...open, isbn: e.target.value })} /></Field>
            <Field label="Total kopje"><input className="input" type="number" value={open.total_copies} onChange={(e) => setOpen({ ...open, total_copies: e.target.value })} /></Field>
            <Field label="Kopje të lira"><input className="input" type="number" value={open.available_copies} onChange={(e) => setOpen({ ...open, available_copies: e.target.value })} /></Field>
            <Field label="Viti"><input className="input" type="number" value={open.published_year || ""} onChange={(e) => setOpen({ ...open, published_year: e.target.value })} /></Field>
            <Field label="Faqe"><input className="input" type="number" value={open.pages || ""} onChange={(e) => setOpen({ ...open, pages: e.target.value })} /></Field>
            <Field label="Gjuha"><input className="input" value={open.language || ""} onChange={(e) => setOpen({ ...open, language: e.target.value })} /></Field>
            <Field label="Foto (URL)"><input className="input" value={open.cover_image_url || ""} onChange={(e) => setOpen({ ...open, cover_image_url: e.target.value })} /></Field>
          </div>
          <Field label="Përshkrimi"><textarea className="textarea" value={open.description || ""} onChange={(e) => setOpen({ ...open, description: e.target.value })} /></Field>
        </Modal>
      ) : null}
    </div>
  );
}

function CategoriesAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setErr(null);
    try {
      const res = await api.listCategories();
      setItems(res);
    } catch (e: any) {
      setErr(e?.message || "Gabim.");
    }
  };

  useEffect(() => { load(); }, []);

  const createNew = () => setOpen({ _mode:"create", name:"", description:"" });
  const edit = (c: any) => setOpen({ _mode:"edit", ...c });

  const save = async () => {
    setSaving(true);
    setErr(null);
    try {
      const body = { name: open.name, description: open.description };
      if (open._mode === "create") await api.createCategory(body);
      else await api.updateCategory(open.id, body);
      setOpen(null);
      await load();
    } catch (e: any) {
      setErr(e?.message || "Nuk u ruajt.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Ta fshij kategorinë?")) return;
    setErr(null);
    try {
      await api.deleteCategory(id);
      await load();
    } catch (e: any) {
      setErr(e?.message || "Nuk u fshi.");
    }
  };

  return (
    <div className="col">
      <div className="card" style={{ padding: 16 }}>
        <div className="row" style={{ justifyContent:"space-between" }}>
          <div className="col">
            <div className="h2">Kategoritë</div>
            <div className="p">Krijo/ndrysho/fshi (vetëm kur s'ka libra).</div>
          </div>
          <button className="btn" onClick={createNew}>Shto kategori</button>
        </div>
        {err ? <div className="card" style={{ marginTop: 12, padding: 12, borderColor:"rgba(255,107,107,.45)" }}>{err}</div> : null}
      </div>

      <div className="card" style={{ padding: 0, overflow:"hidden" }}>
        <table className="table">
          <thead><tr><th>Emri</th><th>Përshkrimi</th><th></th></tr></thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight:700 }}>{c.name}</td>
                <td style={{ color:"var(--muted)" }}>{c.description || "—"}</td>
                <td style={{ textAlign:"right" }}>
                  <div className="row" style={{ justifyContent:"flex-end" }}>
                    <button className="btn secondary" onClick={() => edit(c)}>Ndrysho</button>
                    <button className="btn danger" onClick={() => remove(c.id)}>Fshi</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open ? (
        <Modal title={open._mode === "create" ? "Shto kategori" : "Ndrysho kategori"} onClose={() => setOpen(null)} actions={
          <>
            <button className="btn secondary" onClick={() => setOpen(null)}>Anulo</button>
            <button className="btn ok" disabled={saving} onClick={save}>{saving ? "Duke ruajtur..." : "Ruaj"}</button>
          </>
        }>
          <div className="grid grid-2">
            <Field label="Emri"><input className="input" value={open.name} onChange={(e) => setOpen({ ...open, name: e.target.value })} /></Field>
            <Field label="Përshkrimi"><input className="input" value={open.description || ""} onChange={(e) => setOpen({ ...open, description: e.target.value })} /></Field>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function UsersAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setErr(null);
    try {
      const res = await api.listUsers({ page:1, pageSize: 200 });
      setItems(res.items || []);
    } catch (e: any) {
      setErr(e?.message || "Gabim.");
    }
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (u: any) => {
    setSaving(u.id);
    setErr(null);
    try {
      await api.updateUser(u.id, { is_active: !u.is_active });
      await load();
    } catch (e: any) {
      setErr(e?.message || "Nuk u ruajt.");
    } finally {
      setSaving(null);
    }
  };

  const toggleRole = async (u: any) => {
    setSaving(u.id);
    setErr(null);
    try {
      await api.updateUser(u.id, { role: u.role === "admin" ? "user" : "admin" });
      await load();
    } catch (e: any) {
      setErr(e?.message || "Nuk u ruajt.");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="col">
      <div className="card" style={{ padding: 16 }}>
        <div className="row" style={{ justifyContent:"space-between" }}>
          <div className="col">
            <div className="h2">Përdoruesit</div>
            <div className="p">Aktivizim/çaktivizim dhe roli admin/user.</div>
          </div>
          <button className="btn secondary" onClick={load}>Rifresko</button>
        </div>
        {err ? <div className="card" style={{ marginTop: 12, padding: 12, borderColor:"rgba(255,107,107,.45)" }}>{err}</div> : null}
      </div>

      <div className="card" style={{ padding: 0, overflow:"hidden" }}>
        <table className="table">
          <thead><tr><th>Emri</th><th>Email</th><th>Roli</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight:700 }}>{u.full_name}</td>
                <td style={{ color:"var(--muted)" }}>{u.email}</td>
                <td><span className="badge">{u.role}</span></td>
                <td><span className="badge">{u.is_active ? "aktive" : "çaktivizuar"}</span></td>
                <td style={{ textAlign:"right" }}>
                  <div className="row" style={{ justifyContent:"flex-end" }}>
                    <button className="btn secondary" disabled={saving===u.id} onClick={() => toggleRole(u)}>{u.role==="admin" ? "Bëje user" : "Bëje admin"}</button>
                    <button className="btn" disabled={saving===u.id} onClick={() => toggleActive(u)}>{u.is_active ? "Çaktivizo" : "Aktivizo"}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
