import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { config } from "../config.js";
import { prisma } from "../prisma.js";

/**
 * One-time passcodes for phone sign-in.
 *
 * Codes are never stored in plaintext: we persist an HMAC keyed with the server
 * secret, so a database leak does not immediately expose live codes. Combined
 * with single-use semantics, a short expiry and an attempt cap, this is enough
 * to make brute-forcing a 6-digit code impractical.
 */

export type VerifyFailure =
  | "missing" // no outstanding code for this phone
  | "expired"
  | "too_many_attempts"
  | "invalid";

export type VerifyResult =
  | { ok: true; role: string; name: string | null }
  | { ok: false; reason: VerifyFailure };

/** Constant-time HMAC of a code, bound to the phone number. */
function hashCode(phone: string, code: string): Buffer {
  return createHmac("sha256", config.jwtSecret).update(`${phone}:${code}`).digest();
}

/** Cryptographically random 6-digit code, zero-padded. */
export function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/**
 * Issues a new code for a phone number, invalidating any outstanding ones so
 * that only the most recent code can be used.
 */
export async function issueOtp(input: {
  phone: string;
  role: string;
  name?: string;
}): Promise<{ code: string; expiresAt: Date }> {
  const now = new Date();

  await prisma.$transaction([
    // Supersede any still-usable code for this phone.
    prisma.otpCode.updateMany({
      where: { phone: input.phone, consumedAt: null },
      data: { consumedAt: now }
    }),
    // Opportunistic cleanup of codes that expired over a day ago.
    prisma.otpCode.deleteMany({
      where: { expiresAt: { lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } }
    })
  ]);

  const code = generateCode();
  const expiresAt = new Date(now.getTime() + config.otpExpirySeconds * 1000);

  await prisma.otpCode.create({
    data: {
      phone: input.phone,
      role: input.role,
      name: input.name ?? null,
      codeHash: hashCode(input.phone, code).toString("hex"),
      expiresAt
    }
  });

  return { code, expiresAt };
}

/** Validates a submitted code and consumes it on success. */
export async function verifyOtp(input: { phone: string; code: string }): Promise<VerifyResult> {
  const record = await prisma.otpCode.findFirst({
    where: { phone: input.phone, consumedAt: null },
    orderBy: { createdAt: "desc" }
  });

  if (!record) return { ok: false, reason: "missing" };
  if (record.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };
  if (record.attempts >= config.otpMaxAttempts) return { ok: false, reason: "too_many_attempts" };

  const expected = Buffer.from(record.codeHash, "hex");
  const actual = hashCode(input.phone, input.code);
  const matches = expected.length === actual.length && timingSafeEqual(expected, actual);

  if (!matches) {
    await prisma.otpCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } }
    });
    return { ok: false, reason: "invalid" };
  }

  await prisma.otpCode.update({
    where: { id: record.id },
    data: { consumedAt: new Date() }
  });

  return { ok: true, role: record.role, name: record.name };
}

/** Human-readable message for each failure reason. */
export const VERIFY_FAILURE_MESSAGE: Record<VerifyFailure, string> = {
  missing: "Request a new code and try again",
  expired: "That code has expired. Request a new one",
  too_many_attempts: "Too many incorrect attempts. Request a new code",
  invalid: "Incorrect code. Please check and try again"
};
