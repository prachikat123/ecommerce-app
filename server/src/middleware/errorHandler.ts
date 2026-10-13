import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/ApiError.js";
import { config } from "../config.js";

/** Centralized error handler — normalizes every failure into a stable JSON shape. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      error: { message: err.message, code: err.code, details: err.details ?? undefined }
    });
  }

  if (err instanceof ZodError) {
    return res.status(422).json({
      error: {
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message }))
      }
    });
  }

  // Prisma unique-constraint violation
  if (typeof err === "object" && err !== null && (err as { code?: string }).code === "P2002") {
    return res.status(409).json({
      error: { message: "Resource already exists", code: "CONFLICT" }
    });
  }

  // Prisma "record not found"
  if (typeof err === "object" && err !== null && (err as { code?: string }).code === "P2025") {
    return res.status(404).json({
      error: { message: "Resource not found", code: "NOT_FOUND" }
    });
  }

  const message = err instanceof Error ? err.message : "Unexpected server error";
  if (!config.isTest) {
    console.error("[error]", err);
  }
  return res.status(500).json({
    error: { message: config.isTest ? message : "Internal server error", code: "INTERNAL" }
  });
}

/** 404 fallback for unknown routes. */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: { message: `Route not found: ${req.method} ${req.originalUrl}`, code: "NOT_FOUND" }
  });
}
