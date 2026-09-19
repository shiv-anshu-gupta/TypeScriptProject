/**
 * The one place a failed request becomes a response.
 *
 * @packageDocumentation
 */
import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { fail } from "../utils/envelope";

/**
 * Express error middleware: turns anything thrown into an error envelope.
 *
 * @remarks
 * Two cases, and the difference is the whole point of {@link AppError}:
 *
 * - an `AppError` answers with its own `statusCode`, its message passed
 *   through to the caller, and the code `APP_ERROR`;
 * - anything else is logged in full and answered with a bare 500 and the
 *   code `INTERNAL`, so a stack trace or a database message never leaves the
 *   server.
 *
 * Must be registered last, after every router and after `notFound`, and must
 * keep all four parameters - Express identifies error middleware by its
 * arity, so dropping the unused `next` would silently stop it being called.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(fail(err.message, "APP_ERROR"));
  }

  console.error("error", err);

  return res.status(500).json(fail("Internal server error", "INTERNAL"));
}
