import { Router } from "express";
import { pool, query } from "../lib/db.js";
import { HttpError } from "../lib/error.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { listBooksSchema, createBookSchema, updateBookSchema, idParamSchema, searchSchema } from "../validators/books.js";

export const booksRouter = Router();

booksRouter.get("/", validate(listBooksSchema), async (req, res, next) => {
  try {
    const { page, pageSize, category, author, year, available, sort, order } = req.query as any;
    const offset = (Number(page) - 1) * Number(pageSize);

    const where: string[] = ["is_deleted=false"];
    const params: any[] = [];
    let i = 1;

    if (category) { where.push(`category_id=$${i++}`); params.push(category); }
    if (author) { where.push(`author ilike $${i++}`); params.push(`%${author}%`); }
    if (year) { where.push(`published_year=$${i++}`); params.push(Number(year)); }
    if (available !== undefined) {
      if (String(available) === "true") where.push(`available_copies > 0`);
      if (String(available) === "false") where.push(`available_copies = 0`);
    }

    const whereSql = where.length ? `where ${where.join(" and ")}` : "";
    const safeSort = ["title","author","published_year","created_at"].includes(String(sort)) ? String(sort) : "created_at";
    const safeOrder = String(order).toLowerCase() === "asc" ? "asc" : "desc";

    const totalRows = await query<{ total: number }>(
      `select count(*)::int as total from books ${whereSql}`, params
    );
    const total = totalRows[0]?.total ?? 0;

    const rows = await query<any>(
      `select b.*, c.name as category_name
       from books b left join categories c on c.id=b.category_id
       ${whereSql}
       order by ${safeSort} ${safeOrder}
       limit $${i++} offset $${i++}`,
      [...params, Number(pageSize), offset]
    );

    res.json({ page: Number(page), pageSize: Number(pageSize), total, items: rows });
  } catch (e) { next(e); }
});

booksRouter.get("/search", validate(searchSchema), async (req, res, next) => {
  try {
    const { q, page, pageSize } = req.query as any;
    const offset = (Number(page) - 1) * Number(pageSize);
    const qq = `%${q}%`;
    const totalRows = await query<any>(
      `select count(*)::int as total from books where is_deleted=false and (title ilike $1 or author ilike $1 or coalesce(isbn,'') ilike $1)`,
      [qq]
    );
    const total = totalRows[0]?.total ?? 0;
    const rows = await query<any>(
      `select * from books where is_deleted=false and (title ilike $1 or author ilike $1 or coalesce(isbn,'') ilike $1)
       order by created_at desc
       limit $2 offset $3`,
      [qq, Number(pageSize), offset]
    );
    res.json({ page: Number(page), pageSize: Number(pageSize), total, items: rows });
  } catch (e) { next(e); }
});

booksRouter.get("/:id", validate(idParamSchema), async (req, res, next) => {
  try {
    const { id } = req.params as any;
    const rows = await query<any>(
      `select b.*, c.name as category_name
       from books b left join categories c on c.id=b.category_id
       where b.id=$1 and b.is_deleted=false`,
      [id]
    );
    if (!rows[0]) throw new HttpError(404, "Libri nuk u gjet.");
    res.json(rows[0]);
  } catch (e) { next(e); }
});

booksRouter.post("/", requireAuth, requireRole("admin"), validate(createBookSchema), async (req, res, next) => {
  const client = await pool.connect();
  try {
    const b = req.body;
    if (Number(b.available_copies) > Number(b.total_copies)) throw new HttpError(400, "available_copies nuk mund të jetë > total_copies.");
    const rows = await client.query(
      `insert into books (category_id,title,author,isbn,description,cover_image_url,total_copies,available_copies,published_year,pages,language)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       returning *`,
      [
        b.category_id || null, b.title, b.author, b.isbn || null, b.description || null, b.cover_image_url || null,
        Number(b.total_copies), Number(b.available_copies), b.published_year ?? null, b.pages ?? null, b.language || null,
      ]
    );
    res.status(201).json(rows.rows[0]);
  } catch (e: any) {
    if (String(e?.message || "").includes("duplicate key")) return next(new HttpError(409, "ISBN ekziston."));
    next(e);
  } finally { client.release(); }
});

booksRouter.put("/:id", requireAuth, requireRole("admin"), validate(updateBookSchema), async (req, res, next) => {
  try {
    const { id } = req.params as any;
    const b = req.body;
    const fields: string[] = [];
    const params: any[] = [id];
    let i = 2;

    const add = (name: string, value: any) => {
      if (value === undefined) return;
      fields.push(`${name}=$${i++}`);
      params.push(value === "" ? null : value);
    };

    add("category_id", b.category_id);
    add("title", b.title);
    add("author", b.author);
    add("isbn", b.isbn);
    add("description", b.description);
    add("cover_image_url", b.cover_image_url);
    add("total_copies", b.total_copies);
    add("available_copies", b.available_copies);
    add("published_year", b.published_year);
    add("pages", b.pages);
    add("language", b.language);
    add("is_deleted", b.is_deleted);

    if (!fields.length) throw new HttpError(400, "Asgjë për përditësim.");

    if (b.available_copies !== undefined && b.total_copies !== undefined && Number(b.available_copies) > Number(b.total_copies)) {
      throw new HttpError(400, "available_copies nuk mund të jetë > total_copies.");
    }

    const rows = await query<any>(`update books set ${fields.join(", ")} where id=$1 returning *`, params);
    if (!rows[0]) throw new HttpError(404, "Libri nuk u gjet.");
    res.json(rows[0]);
  } catch (e: any) {
    if (String(e?.message || "").includes("duplicate key")) return next(new HttpError(409, "ISBN ekziston."));
    next(e);
  }
});

booksRouter.delete("/:id", requireAuth, requireRole("admin"), validate(idParamSchema), async (req, res, next) => {
  try {
    const { id } = req.params as any;
    const active = await query<any>(`select count(*)::int as n from loans where book_id=$1 and return_date is null`, [id]);
    if ((active[0]?.n || 0) > 0) throw new HttpError(400, "Nuk mund të fshihet: ka huazime aktive.");
    const rows = await query<any>(`update books set is_deleted=true where id=$1 returning id`, [id]);
    if (!rows[0]) throw new HttpError(404, "Libri nuk u gjet.");
    res.json({ ok: true });
  } catch (e) { next(e); }
});
