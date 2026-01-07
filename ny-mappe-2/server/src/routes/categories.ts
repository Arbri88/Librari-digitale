import { Router } from "express";
import { query } from "../lib/db.js";
import { validate } from "../middleware/validate.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { createCategorySchema, updateCategorySchema, idParamSchema } from "../validators/categories.js";
import { HttpError } from "../lib/error.js";

export const categoriesRouter = Router();

categoriesRouter.get("/", async (_req, res, next) => {
  try {
    const rows = await query<any>(`select id, name, description, created_at from categories order by name asc`);
    res.json(rows);
  } catch (e) { next(e); }
});

categoriesRouter.post("/", requireAuth, requireRole("admin"), validate(createCategorySchema), async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const rows = await query<any>(
      `insert into categories (name, description) values ($1,$2)
       returning id, name, description, created_at`,
      [name, description || null]
    );
    res.status(201).json(rows[0]);
  } catch (e: any) {
    if (String(e?.message || "").includes("duplicate key")) return next(new HttpError(409, "Kategoria ekziston."));
    next(e);
  }
});

categoriesRouter.put("/:id", requireAuth, requireRole("admin"), validate(updateCategorySchema), async (req, res, next) => {
  try {
    const { id } = req.params as any;
    const { name, description } = req.body;
    const rows = await query<any>(
      `update categories set
         name = coalesce($2,name),
         description = coalesce($3,description)
       where id=$1
       returning id,name,description,created_at`,
      [id, name ?? null, description ?? null]
    );
    if (!rows[0]) throw new HttpError(404, "Nuk u gjet.");
    res.json(rows[0]);
  } catch (e) { next(e); }
});

categoriesRouter.delete("/:id", requireAuth, requireRole("admin"), validate(idParamSchema), async (req, res, next) => {
  try {
    const { id } = req.params as any;
    const count = await query<any>(`select count(*)::int as n from books where category_id=$1 and is_deleted=false`, [id]);
    if ((count[0]?.n || 0) > 0) throw new HttpError(400, "Nuk mund të fshihet: ka libra në këtë kategori.");
    await query<any>(`delete from categories where id=$1`, [id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
});
