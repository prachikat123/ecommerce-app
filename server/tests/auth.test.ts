import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

const app = createApp();
const PHONE = "9000000011";

describe("auth API", () => {
  it("creates a session and returns a token + user", async () => {
    const res = await request(app)
      .post("/api/auth/session")
      .send({ phone: PHONE, name: "Test Kisan" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.phone).toBe(PHONE);
    expect(res.body.user.role).toBe("CUSTOMER");
    expect(res.body.cartCount).toBe(0);
  });

  it("is idempotent for the same phone", async () => {
    const a = await request(app).post("/api/auth/session").send({ phone: PHONE });
    const b = await request(app).post("/api/auth/session").send({ phone: PHONE });
    expect(a.body.user.id).toBe(b.body.user.id);
  });

  it("rejects an invalid phone number", async () => {
    const res = await request(app).post("/api/auth/session").send({ phone: "12345" });
    expect(res.status).toBe(422);
  });

  it("returns the current user for a valid token", async () => {
    const session = await request(app).post("/api/auth/session").send({ phone: PHONE });
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${session.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.phone).toBe(PHONE);
  });

  it("rejects a missing/invalid token", async () => {
    expect((await request(app).get("/api/auth/me")).status).toBe(401);
    expect((await request(app).get("/api/auth/me").set("Authorization", "Bearer nope")).status).toBe(401);
  });
});
