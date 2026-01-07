import { Router } from "express";
import bcrypt from "bcryptjs";
import { query, pool } from "../lib/db.js";
import { HttpError } from "../lib/error.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt.js";
import { validate } from "../middleware/validate.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import { registerSchema, loginSchema, changePasswordSchema, refreshSchema } from "../validators/auth.js";

export const authRouter = Router();

authRouter.post("/register", validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password, full_name } = req.body;
    const password_hash = await bcrypt.hash(password, 12);
    const rows = await query<{ id: string; email: string; full_name: string; role: "user" | "admin" }>(
      `insert into users (email, password_hash, full_name, role) values ($1,$2,$3,'user')
       returning id, email, full_name, role`,
      [email.toLowerCase(), password_hash, full_name]
    );
    const user = rows[0];
    const accessToken = signAccessToken({ id: user.id, role: user.role, email: user.email, full_name: user.full_name });
    const refreshToken = signRefreshToken({ id: user.id, role: user.role, email: user.email, full_name: user.full_name });
    res.json({ accessToken, refreshToken });
  } catch (e: any) {
    if (String(e?.message || "").includes("duplicate key")) return next(new HttpError(409, "Email ekziston."));
    next(e);
  }
});

authRouter.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const rows = await query<any>(
      `select id, email, full_name, role, password_hash, is_active from users where email=$1 limit 1`,
      [email.toLowerCase()]
    );
    const user = rows[0];
    if (!user) throw new HttpError(401, "Email ose fjalëkalim i gabuar.");
    if (!user.is_active) throw new HttpError(403, "Llogaria është çaktivizuar.");
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) throw new HttpError(401, "Email ose fjalëkalim i gabuar.");
    const accessToken = signAccessToken({ id: user.id, role: user.role, email: user.email, full_name: user.full_name });
    const refreshToken = signRefreshToken({ id: user.id, role: user.role, email: user.email, full_name: user.full_name });
    res.json({ accessToken, refreshToken });
  } catch (e) { next(e); }
});

authRouter.post("/refresh", validate(refreshSchema), async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const { id } = verifyRefreshToken(refreshToken);
    const rows = await query<any>(`select id, email, full_name, role, is_active from users where id=$1`, [id]);
    const user = rows[0];
    if (!user || !user.is_active) throw new HttpError(401, "Refresh token i pavlefshëm.");
    const accessToken = signAccessToken({ id: user.id, role: user.role, email: user.email, full_name: user.full_name });
    const newRefreshToken = signRefreshToken({ id: user.id, role: user.role, email: user.email, full_name: user.full_name });
    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (e) { next(e); }
});

authRouter.get("/me", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const user = req.user!;
    const rows = await query<any>(
      `select id, email, full_name, role, phone, address, is_active, created_at, updated_at from users where id=$1`,
      [user.id]
    );
    res.json(rows[0]);
  } catch (e) { next(e); }
});

authRouter.put("/password", requireAuth, validate(changePasswordSchema), async (req: AuthedRequest, res, next) => {
  const client = await pool.connect();
  try {
    const user = req.user!;
    const { old_password, new_password } = req.body;

    const rows = await client.query(`select password_hash from users where id=$1`, [user.id]);
    if (!rows.rows[0]) throw new HttpError(404, "Përdoruesi nuk u gjet.");
    const ok = await bcrypt.compare(old_password, rows.rows[0].password_hash);
    if (!ok) throw new HttpError(400, "Fjalëkalimi aktual është gabim.");

    const new_hash = await bcrypt.hash(new_password, 12);
    await client.query(`update users set password_hash=$1 where id=$2`, [new_hash, user.id]);
    res.json({ ok: true });
  } catch (e) { next(e); }
  finally { client.release(); }
});
