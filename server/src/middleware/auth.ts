import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { ApiError } from "../utils/ApiError.js";

export interface AuthPayload {
  userId: string;
  role: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn } as jwt.SignOptions);
}

function readToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) return header.slice(7).trim();
  if (typeof req.headers["x-user-token"] === "string") return req.headers["x-user-token"];
  return null;
}

/** Requires a valid token and attaches `req.auth`. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = readToken(req);
  if (!token) return next(ApiError.unauthorized());
  try {
    req.auth = jwt.verify(token, config.jwtSecret) as AuthPayload;
    return next();
  } catch {
    return next(ApiError.unauthorized("Session expired or invalid token"));
  }
}

/** Requires a valid token AND the SELLER/ADMIN role. */
export function requireSeller(req: Request, _res: Response, next: NextFunction) {
  requireAuth(req, _res, (err?: unknown) => {
    if (err) return next(err);
    if (!req.auth || (req.auth.role !== "SELLER" && req.auth.role !== "ADMIN")) {
      return next(ApiError.forbidden("Seller access required"));
    }
    return next();
  });
}
