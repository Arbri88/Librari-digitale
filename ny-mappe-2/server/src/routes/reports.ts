import { Router } from "express";
import { query } from "../lib/db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { loansReportSchema, booksReportSchema } from "../validators/reports.js";

export const reportsRouter = Router();

function toCsv(rows: any[], headers: string[]): string {
  const escape = (v: any) => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  };
  const lines = [headers.join(",")];
  for (const r of rows) lines.push(headers.map((h) => escape(r[h])).join(","));
  return lines.join("\n");
}

reportsRouter.get("/loans.csv", requireAuth, requireRole("admin"), validate(loansReportSchema), async (req, res, next) => {
  try {
    const { status, from, to } = req.query as any;
    const where: string[] = ["1=1"];
    const params: any[] = [];
    let i = 1;
    if (from) { where.push(`l.loan_date >= $${i++}`); params.push(new Date(from)); }
    if (to) { where.push(`l.loan_date <= $${i++}`); params.push(new Date(to)); }
    const whereSql = `where ${where.join(" and ")}`;

    const rows = await query<any>(
      `select l.id, u.email as user_email, u.full_name as user_full_name,
              b.title as book_title, l.loan_date, l.due_date, l.return_date, l.status
       from loans l
       join users u on u.id=l.user_id
       join books b on b.id=l.book_id
       ${whereSql}
       order by l.created_at desc`,
      params
    );

    const now = Date.now();
    const mapped = rows.map((r) => {
      const computed = r.return_date ? "returned" : (new Date(r.due_date).getTime() < now ? "overdue" : "active");
      return { ...r, status: computed };
    }).filter((r) => status ? r.status === status : true);

    const headers = ["id","user_email","user_full_name","book_title","loan_date","due_date","return_date","status"];
    const csv = toCsv(mapped, headers);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=loans.csv");
    res.send(csv);
  } catch (e) { next(e); }
});

reportsRouter.get("/books.csv", requireAuth, requireRole("admin"), validate(booksReportSchema), async (req, res, next) => {
  try {
    const { category } = req.query as any;
    const where: string[] = ["is_deleted=false"];
    const params: any[] = [];
    let i = 1;
    if (category) { where.push(`category_id=$${i++}`); params.push(category); }
    const whereSql = `where ${where.join(" and ")}`;

    const rows = await query<any>(
      `select id,title,author,isbn,total_copies,available_copies,published_year,language,created_at
       from books
       ${whereSql}
       order by created_at desc`,
      params
    );

    const headers = ["id","title","author","isbn","total_copies","available_copies","published_year","language","created_at"];
    const csv = toCsv(rows, headers);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=books.csv");
    res.send(csv);
  } catch (e) { next(e); }
});
