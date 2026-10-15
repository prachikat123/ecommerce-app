import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/prisma.js";
import { issueOtp, verifyOtp } from "../src/services/otpService.js";
import { getMessageProvider, sendOtpMessage, toE164 } from "../src/services/messageService.js";

const app = createApp();

/** Expires (or exhausts) the outstanding code for a phone, to test the guards. */
async function ageOutstandingCode(phone: string) {
  await prisma.otpCode.updateMany({
    where: { phone, consumedAt: null },
    data: { expiresAt: new Date(Date.now() - 1000) }
  });
}

describe("OTP service", () => {
  it("accepts an issued code exactly once", async () => {
    const phone = "9111100001";
    const { code } = await issueOtp({ phone, role: "CUSTOMER" });

    const first = await verifyOtp({ phone, code });
    expect(first).toMatchObject({ ok: true, role: "CUSTOMER" });

    // A consumed code cannot be replayed.
    const second = await verifyOtp({ phone, code });
    expect(second.ok).toBe(false);
  });

  it("rejects an incorrect code and counts the attempt", async () => {
    const phone = "9111100002";
    const { code } = await issueOtp({ phone, role: "CUSTOMER" });
    const wrong = code === "000000" ? "111111" : "000000";

    const result = await verifyOtp({ phone, code: wrong });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("invalid");

    const record = await prisma.otpCode.findFirst({
      where: { phone, consumedAt: null },
      orderBy: { createdAt: "desc" }
    });
    expect(record?.attempts).toBe(1);
  });

  it("rejects an expired code", async () => {
    const phone = "9111100003";
    const { code } = await issueOtp({ phone, role: "CUSTOMER" });
    await ageOutstandingCode(phone);

    const result = await verifyOtp({ phone, code });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("expired");
  });

  it("refuses to verify once the attempt limit is reached", async () => {
    const phone = "9111100004";
    const { code } = await issueOtp({ phone, role: "CUSTOMER" });
    await prisma.otpCode.updateMany({
      where: { phone, consumedAt: null },
      data: { attempts: 999 }
    });

    const result = await verifyOtp({ phone, code });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("too_many_attempts");
  });

  it("supersedes an earlier code when a new one is requested", async () => {
    const phone = "9111100005";
    const first = await issueOtp({ phone, role: "CUSTOMER" });
    const second = await issueOtp({ phone, role: "CUSTOMER" });

    const stale = await verifyOtp({ phone, code: first.code });
    expect(stale.ok).toBe(false);

    const fresh = await verifyOtp({ phone, code: second.code });
    expect(fresh.ok).toBe(true);
  });

  it("never stores the code in plaintext", async () => {
    const phone = "9111100006";
    const { code } = await issueOtp({ phone, role: "CUSTOMER" });

    const record = await prisma.otpCode.findFirst({ where: { phone }, orderBy: { createdAt: "desc" } });
    expect(record?.codeHash).not.toContain(code);
    expect(record?.codeHash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("Message delivery", () => {
  it("resolves a provider and sends without throwing outside production", async () => {
    await expect(
      sendOtpMessage({ phone: "9000000000", code: "123456", expirySeconds: 300 })
    ).resolves.toBeUndefined();
  });

  it("uses the console provider by default", () => {
    expect(getMessageProvider().name).toBe("console");
  });

  it("normalises a bare 10-digit number into E.164 with the country code", () => {
    expect(toE164("9700001234")).toBe("+919700001234");
  });

  it("leaves numbers that already carry a country code untouched", () => {
    expect(toE164("919700001234")).toBe("+919700001234");
    expect(toE164("+91 9700001234")).toBe("+919700001234");
  });
});

describe("OTP sign-in API", () => {
  it("issues a code and completes sign-in", async () => {
    const phone = "9222200001";

    const requested = await request(app)
      .post("/api/auth/otp/request")
      .send({ phone, role: "CUSTOMER" });
    expect(requested.status).toBe(200);
    expect(requested.body.expiresInSeconds).toBeGreaterThan(0);
    // Outside production the bypass is on, so the code is returned for the UI.
    expect(requested.body.devCode).toMatch(/^\d{6}$/);

    const verified = await request(app)
      .post("/api/auth/otp/verify")
      .send({ phone, code: requested.body.devCode, role: "CUSTOMER" });
    expect(verified.status).toBe(200);
    expect(verified.body.token).toBeTruthy();
    expect(verified.body.user.phone).toBe(phone);
    expect(verified.body.user.role).toBe("CUSTOMER");
  });

  it("creates a seller profile when signing in as a seller", async () => {
    const phone = "9222200002";

    const requested = await request(app).post("/api/auth/otp/request").send({ phone, role: "SELLER" });
    const verified = await request(app)
      .post("/api/auth/otp/verify")
      .send({ phone, code: requested.body.devCode, role: "SELLER", name: "Ravi Patil" });

    expect(verified.status).toBe(200);
    expect(verified.body.user.role).toBe("SELLER");
    expect(verified.body.user.shopName).toBeTruthy();
  });

  it("rejects an incorrect code", async () => {
    const phone = "9333300001";
    await request(app).post("/api/auth/otp/request").send({ phone });

    const res = await request(app)
      .post("/api/auth/otp/verify")
      .send({ phone, code: "000000" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_OTP");
  });

  it("rejects a malformed code", async () => {
    const res = await request(app)
      .post("/api/auth/otp/verify")
      .send({ phone: "9444400001", code: "abc" });
    expect(res.status).toBe(422);
  });

  it("rejects an invalid phone number on request", async () => {
    const res = await request(app).post("/api/auth/otp/request").send({ phone: "12345" });
    expect(res.status).toBe(422);
  });
});
