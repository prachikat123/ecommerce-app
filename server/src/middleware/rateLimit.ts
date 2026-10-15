import type { Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { config } from "../config.js";

/** Sends a 429 in the same JSON error shape the rest of the API uses. */
function limitHandler(message: string) {
  return (_req: Request, res: Response) => {
    res.status(429).json({ error: { message, code: "RATE_LIMITED" } });
  };
}

/**
 * Baseline protection for the whole API surface.
 * Disabled during tests so the suite can make many requests freely.
 */
export const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: () => config.isTest,
  handler: limitHandler("Too many requests. Please slow down and try again shortly.")
});

/**
 * Strict limit for sign-in and OTP endpoints, to blunt brute-force attempts
 * against phone numbers and 6-digit codes.
 */
export const authLimiter = rateLimit({
  windowMs: 10 * 60_000,
  limit: config.authRateLimit,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skip: () => config.isTest,
  handler: limitHandler("Too many sign-in attempts. Please try again in a few minutes.")
});
