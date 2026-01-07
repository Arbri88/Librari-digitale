import jwt from "jsonwebtoken";
import { env } from "./env.js";

export type JwtUser = { id: string; role: "user" | "admin"; email: string; full_name: string };

export function signAccessToken(user: JwtUser) {
  return jwt.sign({ sub: user.id, role: user.role, email: user.email, full_name: user.full_name }, env.JWT_SECRET, { expiresIn: "24h" });
}

export function signRefreshToken(user: JwtUser) {
  // Stateless refresh for dev; in prod add token rotation/storage.
  return jwt.sign({ sub: user.id, role: user.role }, env.JWT_REFRESH_SECRET, { expiresIn: "30d" });
}

export function verifyAccessToken(token: string): JwtUser {
  const payload = jwt.verify(token, env.JWT_SECRET) as any;
  return { id: payload.sub, role: payload.role, email: payload.email, full_name: payload.full_name };
}

export function verifyRefreshToken(token: string): { id: string; role: "user" | "admin" } {
  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as any;
  return { id: payload.sub, role: payload.role };
}
