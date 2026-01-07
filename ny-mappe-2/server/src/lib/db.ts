import pg from "pg";
import { env } from "./env.js";

export const pool = new pg.Pool({ connectionString: env.DATABASE_URL, max: 10, idleTimeoutMillis: 30_000 });

export async function query<T>(text: string, params: any[] = []): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}
