import dotenv from "dotenv";
dotenv.config();

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

const clientUrlsRaw = process.env.CLIENT_URLS || process.env.CLIENT_URL ||";*"
const clientUrls = clientUrlsRaw
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

export const env = {
  PORT: parseInt(process.env.PORT || "4000", 10),
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
  CLIENT_URLS: clientUrls,
ALLOW_ANY_ORIGIN: clientUrlsRaw === "*",



  DATABASE_URL: required("DATABASE_URL"),
  JWT_SECRET: required("JWT_SECRET"),
  JWT_REFRESH_SECRET: required("JWT_REFRESH_SECRET"),
  NODE_ENV: process.env.NODE_ENV || "development",
  RATE_LIMIT_LOGIN_WINDOW_MS: parseInt(process.env.RATE_LIMIT_LOGIN_WINDOW_MS || String(60 * 60 * 1000), 10),
  RATE_LIMIT_LOGIN_MAX: parseInt(
    process.env.RATE_LIMIT_LOGIN_MAX || (process.env.NODE_ENV === "production" ? "10" : "100"),
    10
  ),
};
