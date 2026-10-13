import type { Request, Response, NextFunction } from "express";
import type { ZodTypeAny } from "zod";

type Source = "body" | "query" | "params";

/**
 * Validates and coerces a request part against a Zod schema.
 * Parsed output replaces the raw value so downstream code is type-safe.
 */
export function validate(schema: ZodTypeAny, source: Source = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return next(result.error);
    }
    // express query/params are read-only getters in some versions — assign defensively.
    try {
      req[source] = result.data as never;
    } catch {
      Object.defineProperty(req, source, { value: result.data, writable: true });
    }
    return next();
  };
}
