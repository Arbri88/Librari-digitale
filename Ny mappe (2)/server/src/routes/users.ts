import { Router } from "express";
import { query } from "../lib/db.js";
import { HttpError } from "../lib/error.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { listUsersSchema, updateUserSchema, idParamSchema } from "../validators/users.js";

export const usersRouter = Router();

usersRouter.get("/", requireAuth, requireRole("admin"), validate(listUsersSchema), async (req, res, next) => {
  try {
    const { q, page, pageSize } = req.query as any;
    const offset = (Number(page) - 1) * Number(pageSize);
    const params: any[] = [];
    let i = 1;
    let where = "where 1=1";
    if (q) { where += ` and (email ilike $${i++} or full_name ilike $${i++})`; params.push(`%${q}%`, `%${q}%`); }

    const totalRows = await query<any>(`select count(*)::int as total from users ${where}`, params);
    const total = totalRows[0]?.total ?? 0;

    const rows = await query<any>(
      `select id, email, full_name, role, phone, address, is_active, created_at, updated_at
       from users
       ${where}
       order by created_at desc
       limit $${i++} offset $${i++}`,
      [...params, Number(pageSize), offset]
    );
    res.json({ page: Number(page), pageSize: Number(pageSize), total, items: rows });
  } catch (e) { next(e); }
});

usersRouter.get("/:id", requireAuth, requireRole("admin"), validate(idParamSchema), async (req, res, next) => {
  try {
    const { id } = req.params as any;
    const rows = await query<any>(
      `select id, email, full_name, role, phone, address, is_active, created_at, updated_at from users where id=$1`,
      [id]
    );
    if (!rows[0]) throw new HttpError(404, "Nuk u gjet.");
    res.json(rows[0]);
  } catch (e) { next(e); }
});

usersRouter.put("/:id", requireAuth, requireRole("admin"), validate(updateUserSchema), async (req, res, next) => {
  try {
    const { id } = req.params as any;
    const u = req.body;

    const fields: string[] = [];
    const params: any[] = [id];
    let i = 2;
    const add = (name: string, value: any) => {
      if (value === undefined) return;
      fields.push(`${name}=$${i++}`);
      params.push(value === "" ? null : value);
    };

    add("full_name", u.full_name);
    add("role", u.role);
    add("is_active", u.is_active);
    add("phone", u.phone);
    add("address", u.address);

    if (!fields.length) throw new HttpError(400, "Asgjë për përditësim.");

    const rows = await query<any>(
      `update users set ${fields.join(", ")} where id=$1
       returning id,email,full_name,role,phone,address,is_active,created_at,updated_at`,
      params
    );
    if (!rows[0]) throw new HttpError(404, "Nuk u gjet.");
    res.json(rows[0]);
  } catch (e) { next(e); }
});

usersRouter.delete("/:id", requireAuth, requireRole("admin"), validate(idParamSchema), async (req, res, next) => {
  try {
    const { id } = req.params as any;
    const rows = await query<any>(`update users set is_active=false where id=$1 returning id`, [id]);
    if (!rows[0]) throw new HttpError(404, "Nuk u gjet.");
    res.json({ ok: true });
  } catch (e) { next(e); }
});
