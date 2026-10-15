/**
 * Environment configuration.
 *
 * Values are read once at boot and validated. In production the process refuses
 * to start with missing or development-only settings, so a misconfigured deploy
 * fails immediately instead of silently serving traffic with insecure defaults.
 */

/** The placeholder secret used for local development only. */
export const DEV_JWT_SECRET = "krishibazaar-dev-secret-change-me";

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  return value === undefined || value.trim() === "" ? undefined : value.trim();
}

const nodeEnv = readEnv("NODE_ENV") ?? "development";
const isTest = nodeEnv === "test";
const isProduction = nodeEnv === "production";

const rawPort = readEnv("PORT") ?? "4000";
const port = Number(rawPort);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid PORT "${rawPort}": expected an integer between 1 and 65535.`);
}

const rawAuthRateLimit = readEnv("AUTH_RATE_LIMIT") ?? "10";
const authRateLimit = Number(rawAuthRateLimit);
if (!Number.isInteger(authRateLimit) || authRateLimit < 1) {
  throw new Error(`Invalid AUTH_RATE_LIMIT "${rawAuthRateLimit}": expected a positive integer.`);
}

const jwtSecret = readEnv("JWT_SECRET") ?? DEV_JWT_SECRET;
const corsOrigin = readEnv("CORS_ORIGIN") ?? "*";

// Fail fast on configurations that are unsafe to run in production.
const problems: string[] = [];
if (isProduction) {
  if (!readEnv("JWT_SECRET")) {
    problems.push("JWT_SECRET must be set");
  } else if (jwtSecret === DEV_JWT_SECRET) {
    problems.push("JWT_SECRET must not be the development default");
  }
  if (!readEnv("DATABASE_URL")) {
    problems.push("DATABASE_URL must be set");
  }
  if (corsOrigin === "*") {
    problems.push("CORS_ORIGIN must be an explicit origin (not \"*\")");
  }
  if (readEnv("OTP_DEV_BYPASS") === "true") {
    problems.push("OTP_DEV_BYPASS must not be enabled");
  }
}
if (problems.length > 0) {
  throw new Error(
    `Invalid production environment configuration:\n  - ${problems.join("\n  - ")}\n` +
      "Set these in your hosting provider's environment settings and redeploy."
  );
}

/** Splits a comma-separated origin list into an array, or "*" to allow all. */
function parseOrigins(value: string): string | string[] {
  if (value === "*") return "*";
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const config = {
  nodeEnv,
  isProduction,
  isTest,
  isDevelopment: !isProduction && !isTest,
  port,
  jwtSecret,
  jwtExpiresIn: readEnv("JWT_EXPIRES_IN") ?? "30d",
  /** Origin(s) allowed by CORS — "*" in development, an explicit list in production. */
  corsOrigins: parseOrigins(corsOrigin),
  corsOrigin,
  /** Max sign-in attempts per IP per 10 minutes. */
  authRateLimit,
  /** OTP lifetime in seconds. */
  otpExpirySeconds: Number(readEnv("OTP_EXPIRY_SECONDS") ?? "300"),
  /** Max wrong-code attempts before an OTP is invalidated. */
  otpMaxAttempts: Number(readEnv("OTP_MAX_ATTEMPTS") ?? "5"),
  /**
   * When true, the login flow accepts a development code and returns it in the
   * API response instead of sending an SMS. Defaults to on outside production.
   */
  otpDevBypass: readEnv("OTP_DEV_BYPASS") ? readEnv("OTP_DEV_BYPASS") === "true" : !isProduction,
  /** The code accepted while `otpDevBypass` is on. */
  otpDevCode: readEnv("OTP_DEV_CODE") ?? "123456",
  /** Outbound SMS provider for one-time passcodes. */
  smsProvider: readEnv("SMS_PROVIDER") ?? "console"
} as const;

export type Config = typeof config;
