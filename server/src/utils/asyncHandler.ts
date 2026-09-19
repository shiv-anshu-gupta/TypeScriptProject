/**
 * Adapter that lets async route handlers throw.
 *
 * @packageDocumentation
 */
import type { Request, Response, NextFunction } from "express";

/**
 * Wraps an async route handler so that a rejected promise reaches `next()`.
 *
 * @remarks
 * Express does not await a handler, so without this a throw inside an async
 * function would become an unhandled rejection and the request would hang
 * until the client gave up. Wrapping it means a handler can simply
 * `throw new AppError(...)` and the error middleware will answer.
 *
 * Every async handler in routes/ is registered through this.
 *
 * @returns A plain Express handler, safe to pass to `app.use` or a route.
 */
export function asyncHandler(
  func: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    func(req, res, next).catch(next);
  };
}
