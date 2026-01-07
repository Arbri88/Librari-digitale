import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./lib/env.js";
import { errorHandler } from "./lib/error.js";
import { authRouter } from "./routes/auth.js";
import { booksRouter } from "./routes/books.js";
import { categoriesRouter } from "./routes/categories.js";
import { loansRouter } from "./routes/loans.js";
import { usersRouter } from "./routes/users.js";
import { reportsRouter } from "./routes/reports.js";

const app = express();
app.use(helmet());
app.use(
  cors({
    origin: env.ALLOW_ANY_ORIGIN
      ? true
      : (origin, callback) => {
          if (!origin) return callback(null, true);
          if (env.CLIENT_URLS.includes(origin)) return callback(null, true);
          return callback(new Error("Not allowed by CORS"));
        },
    credentials: false,
  })
);
app.use(express.json({ limit: "1mb" }));

app.use(
  "/api/auth/login",
  rateLimit({
    windowMs: env.RATE_LIMIT_LOGIN_WINDOW_MS,
    max: env.RATE_LIMIT_LOGIN_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: { message: "Shumë tentativa hyrjeje. Provo përsëri më vonë." },
  })
);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/books", booksRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/loans", loansRouter);
app.use("/api/users", usersRouter);
app.use("/api/reports", reportsRouter);

app.use(errorHandler);

app.listen(env.PORT, () => console.log(`API running on http://localhost:${env.PORT}/api`));
