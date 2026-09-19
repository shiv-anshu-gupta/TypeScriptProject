/**
 * The catch-all for a path no router claimed.
 *
 * @packageDocumentation
 */
import type { Request, Response } from "express";
import { fail } from "../utils/envelope";

/**
 * Answers 404 in the standard error envelope.
 *
 * @remarks
 * Mounted after every router and before the error handler, so a request that
 * matched nothing still gets the same JSON shape as everything else rather
 * than Express's HTML page.
 *
 * The message carries the method only, not the path - an unmatched path is
 * caller-controlled text and is kept out of the response.
 */
export function notFound(req: Request, res: Response) {
  res.status(404).json(fail(`Route not found ${req.method}`));
}
