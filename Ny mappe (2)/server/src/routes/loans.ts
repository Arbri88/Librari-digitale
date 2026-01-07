import { Router } from "express";
import { pool, query } from "../lib/db.js";
import { HttpError } from "../lib/error.js";
import { requireAuth, requireRole, type AuthedRequest } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { listLoansSchema, createLoanSchema, returnSchema } from "../validators/loans.js";

export const loansRouter = Router();

function computeStatus(row: any): any {
  if (row.return_date) return { ...row, status: "returned" };
  const due = new Date(row.due_date).getTime();
  if (due < Date.now()) return { ...row, status: "overdue" };
  return { ...row, status: "active" };
}

loansRouter.get("/", requireAuth, validate(listLoansSchema), async (req: AuthedRequest, res, next) => {
  try {
    const user = req.user!;
    const { status, from, to, page, pageSize } = req.query as any;
    const offset = (Number(page) - 1) * Number(pageSize);

    const where: string[] = ["l.user_id=$1"];
    const params: any[] = [user.id];
    let i = 2;

    if (from) { where.push(`l.loan_date >= $${i++}`); params.push(new Date(from)); }
    if (to) { where.push(`l.loan_date <= $${i++}`); params.push(new Date(to)); }

    const whereSql = `where ${where.join(" and ")}`;
    const totalRows = await query<any>(`select count(*)::int as total from loans l ${whereSql}`, params);
    const total = totalRows[0]?.total ?? 0;

    const rows = await query<any>(
      `select l.*, b.title as book_title, b.author as book_author
       from loans l join books b on b.id=l.book_id
       ${whereSql}
       order by l.created_at desc
       limit $${i++} offset $${i++}`,
      [...params, Number(pageSize), offset]
    );

    let items = rows.map(computeStatus);
    if (status) items = items.filter((x: any) => x.status === status);
    res.json({ page: Number(page), pageSize: Number(pageSize), total, items });
  } catch (e) { next(e); }
});

loansRouter.get("/all", requireAuth, requireRole("admin"), validate(listLoansSchema), async (req: AuthedRequest, res, next) => {
  try {
    const { status, from, to, page, pageSize } = req.query as any;
    const offset = (Number(page) - 1) * Number(pageSize);

    const where: string[] = ["1=1"];
    const params: any[] = [];
    let i = 1;

    if (from) { where.push(`l.loan_date >= $${i++}`); params.push(new Date(from)); }
    if (to) { where.push(`l.loan_date <= $${i++}`); params.push(new Date(to)); }

    const whereSql = `where ${where.join(" and ")}`;
    const totalRows = await query<any>(`select count(*)::int as total from loans l ${whereSql}`, params);
    const total = totalRows[0]?.total ?? 0;

    const rows = await query<any>(
      `select l.*, u.email as user_email, u.full_name as user_full_name, b.title as book_title
       from loans l
       join users u on u.id=l.user_id
       join books b on b.id=l.book_id
       ${whereSql}
       order by l.created_at desc
       limit $${i++} offset $${i++}`,
      [...params, Number(pageSize), offset]
    );

    let items = rows.map(computeStatus);
    if (status) items = items.filter((x: any) => x.status === status);
    res.json({ page: Number(page), pageSize: Number(pageSize), total, items });
  } catch (e) { next(e); }
});

loansRouter.post("/", requireAuth, validate(createLoanSchema), async (req: AuthedRequest, res, next) => {
  const client = await pool.connect();
  try {
    const user = req.user!;
    const { book_id, notes } = req.body;

    await client.query("begin");

    const activeRes = await client.query(`select count(*)::int as n from loans where user_id=$1 and return_date is null`, [user.id]);
    if ((activeRes.rows[0]?.n || 0) >= 3) throw new HttpError(400, "Maksimumi 3 huazime aktive.");

    const bookRes = await client.query(`select id, available_copies, is_deleted from books where id=$1 for update`, [book_id]);
    const book = bookRes.rows[0];
    if (!book || book.is_deleted) throw new HttpError(404, "Libri nuk u gjet.");
    if (book.available_copies <= 0) throw new HttpError(400, "Nuk ka kopje të disponueshme.");

    const now = new Date();
    const due = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const loanRes = await client.query(
      `insert into loans (user_id, book_id, loan_date, due_date, status, notes)
       values ($1,$2,$3,$4,'active',$5) returning *`,
      [user.id, book_id, now, due, notes || null]
    );

    await client.query(`update books set available_copies = available_copies - 1 where id=$1`, [book_id]);

    await client.query("commit");
    res.status(201).json(loanRes.rows[0]);
  } catch (e) {
    await client.query("rollback");
    next(e);
  } finally { client.release(); }
});

loansRouter.put("/:id/return", requireAuth, validate(returnSchema), async (req: AuthedRequest, res, next) => {
  const client = await pool.connect();
  try {
    const user = req.user!;
    const { id } = req.params as any;
    await client.query("begin");

    const loanRes = await client.query(`select * from loans where id=$1 for update`, [id]);
    const loan = loanRes.rows[0];
    if (!loan) throw new HttpError(404, "Huazimi nuk u gjet.");
    if (loan.return_date) throw new HttpError(400, "Huazimi është kthyer.");
    if (user.role !== "admin" && loan.user_id !== user.id) throw new HttpError(403, "Nuk keni të drejta.");

    const now = new Date();
    const updated = await client.query(`update loans set return_date=$2, status='returned' where id=$1 returning *`, [id, now]);
    await client.query(`update books set available_copies = available_copies + 1 where id=$1`, [loan.book_id]);

    await client.query("commit");
    res.json(updated.rows[0]);
  } catch (e) {
    await client.query("rollback");
    next(e);
  } finally { client.release(); }
});
