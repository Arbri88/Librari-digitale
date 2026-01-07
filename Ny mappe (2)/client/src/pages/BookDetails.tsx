import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../app/api";
import { currentUser } from "../app/auth";
import { Field } from "../components/Field";
import { Modal } from "../components/Modal";

export function BookDetailsPage() {
  const { id } = useParams();
  const me = currentUser();
  const isAdmin = me?.role === "admin";

  const [book, setBook] = useState<any | null>(null);
  const [cats, setCats] = useState<any[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [edit, setEdit] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  const load = async () => {
    setErr(null);
    try {
      const [b, c] = await Promise.all([api.getBook(id!), api.listCategories()]);
      setBook(b);
      setCats(c);
    } catch (e: any) {
      setErr(e?.message || "Nuk u gjet libri.");
    }
  };

  useEffect(() => { if (id) load(); }, [id]);

  const startEdit = () => setEdit({ ...book });
  const save = async () => {
    setSaving(true);
    setSaveErr(null);
    try {
      const body = {
        category_id: edit.category_id || null,
        title: edit.title,
        author: edit.author,
        isbn: edit.isbn,
        description: edit.description,
        cover_image_url: edit.cover_image_url,
        total_copies: Number(edit.total_copies),
        available_copies: Number(edit.available_copies),
        published_year: edit.published_year ? Number(edit.published_year) : null,
        pages: edit.pages ? Number(edit.pages) : null,
        language: edit.language,
      };
      const updated = await api.updateBook(book.id, body);
      setBook(updated);
      setEdit(null);
    } catch (e: any) {
      setSaveErr(e?.message || "Nuk u ruajt.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="col">
      <div className="row" style={{ justifyContent:"space-between" }}>
        <Link className="btn secondary" to="/books">← Kthehu</Link>
        {isAdmin && book ? <button className="btn" onClick={startEdit}>Ndrysho</button> : null}
      </div>

      {err ? <div className="card" style={{ padding: 12, borderRadius: 14, borderColor: "rgba(255,107,107,.45)" }}>{err}</div> : null}

      {book ? (
        <div className="card" style={{ padding: 18 }}>
          <div className="row" style={{ justifyContent:"space-between", alignItems:"flex-start" }}>
            <div className="col" style={{ gap: 8 }}>
              <h1 className="h1" style={{ margin: 0 }}>{book.title}</h1>
              <div className="row" style={{ gap: 10, flexWrap:"wrap" }}>
                <span className="badge">{book.author}</span>
                <span className="badge">{book.category_name || "Pa kategori"}</span>
                <span className="badge">Kopje: {book.available_copies}/{book.total_copies}</span>
                {book.published_year ? <span className="badge">Viti: {book.published_year}</span> : null}
                {book.language ? <span className="badge">{book.language}</span> : null}
              </div>
              {book.isbn ? <div className="kbd">ISBN: {book.isbn}</div> : null}
            </div>
            {book.cover_image_url ? (
              <img
                src={book.cover_image_url}
                alt="Cover"
                style={{ width: 120, height: 170, objectFit:"cover", borderRadius: 16, border: "1px solid var(--border)" }}
              />
            ) : (
              <div className="card" style={{ width:120, height:170, borderRadius: 16, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--muted)" }}>
                Pa foto
              </div>
            )}
          </div>

          <hr />
          <p className="p">{book.description || "—"}</p>
        </div>
      ) : null}

      {edit ? (
        <Modal
          title="Ndrysho librin"
          onClose={() => setEdit(null)}
          actions={
            <>
              <button className="btn secondary" onClick={() => setEdit(null)}>Anulo</button>
              <button className="btn ok" disabled={saving} onClick={save}>{saving ? "Duke ruajtur..." : "Ruaj"}</button>
            </>
          }
        >
          <div className="grid grid-2">
            <Field label="Titulli"><input className="input" value={edit.title || ""} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></Field>
            <Field label="Autori"><input className="input" value={edit.author || ""} onChange={(e) => setEdit({ ...edit, author: e.target.value })} /></Field>
            <Field label="Kategori">
              <select className="select" value={edit.category_id || ""} onChange={(e) => setEdit({ ...edit, category_id: e.target.value })}>
                <option value="">Pa kategori</option>
                {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="ISBN"><input className="input" value={edit.isbn || ""} onChange={(e) => setEdit({ ...edit, isbn: e.target.value })} /></Field>
            <Field label="Total kopje"><input className="input" type="number" value={edit.total_copies ?? 1} onChange={(e) => setEdit({ ...edit, total_copies: e.target.value })} /></Field>
            <Field label="Kopje të lira"><input className="input" type="number" value={edit.available_copies ?? 0} onChange={(e) => setEdit({ ...edit, available_copies: e.target.value })} /></Field>
            <Field label="Viti"><input className="input" type="number" value={edit.published_year ?? ""} onChange={(e) => setEdit({ ...edit, published_year: e.target.value })} /></Field>
            <Field label="Faqe"><input className="input" type="number" value={edit.pages ?? ""} onChange={(e) => setEdit({ ...edit, pages: e.target.value })} /></Field>
            <Field label="Gjuha"><input className="input" value={edit.language || ""} onChange={(e) => setEdit({ ...edit, language: e.target.value })} /></Field>
            <Field label="Foto (URL)"><input className="input" value={edit.cover_image_url || ""} onChange={(e) => setEdit({ ...edit, cover_image_url: e.target.value })} /></Field>
          </div>
          <Field label="Përshkrimi">
            <textarea className="textarea" value={edit.description || ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
          </Field>
          {saveErr ? <div className="card" style={{ padding: 12, borderRadius: 14, borderColor: "rgba(255,107,107,.45)" }}>{saveErr}</div> : null}
        </Modal>
      ) : null}
    </div>
  );
}
