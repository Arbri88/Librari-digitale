import request from "supertest";
import express from "express";
import { errorHandler } from "../src/lib/error.js";

describe("smoke", () => {
  test("health", async () => {
    const app = express();
    app.get("/api/health", (_req, res) => res.json({ ok: true }));
    app.use(errorHandler);
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
