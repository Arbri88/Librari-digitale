import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../lib/error.js";
import { verifyAccessToken } from "../lib/jwt.js";

export type AuthedRequest = Request & { user?: ReturnType<typeof verifyAccessToken> };

export function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) return next(new HttpError(401, "Kërkohet autentikim."));
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(new HttpError(401, "Token i pavlefshëm ose i skaduar."));
  }
}

export function requireRole(role: "admin" | "user") {
  return (req: AuthedRequest, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new HttpError(401, "Kërkohet autentikim."));
    if (req.user.role !== role) return next(new HttpError(403, "Nuk keni të drejta për këtë veprim."));
    next();
  };
}
