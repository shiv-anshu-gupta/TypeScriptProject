/**
 * Small guards that turn a missing or unusable value into an {@link AppError},
 * so a route can validate in one line and let the error middleware answer.
 *
 * @packageDocumentation
 */
import { AppError } from "./AppError";

/**
 * Rejects a value that is empty once coerced to a trimmed string.
 *
 * @remarks
 * `null`, `undefined`, `0`, `false`, `""` and whitespace-only text all count
 * as missing, because the value is put through `String(value || "")` first.
 *
 * @param message - sent to the caller verbatim.
 * @param statusCode - the status to answer with; 400 unless a route has a
 * reason to use another.
 * @throws {@link AppError} with `statusCode` when the value is empty.
 */
export function requireText(value: unknown, message: string, statusCode = 400) {
  if (!String(value || "").trim()) {
    throw new AppError(statusCode, message);
  }
}

/**
 * Rejects a value that is already the `NaN` number.
 *
 * @remarks
 * Note the narrowness: the check is `Number.isNaN(value)`, which is true only
 * for the actual `NaN` value. A string, `null`, `undefined` or an object all
 * pass, so this is not a "must be a number" guard - callers that need one
 * must convert first and check the result themselves.
 *
 * @param message - sent to the caller verbatim.
 * @throws {@link AppError} with `statusCode` when the value is `NaN`.
 */
export function requireNumber(
  value: unknown,
  message: string,
  statusCode = 400,
) {
  // Both halves are needed. `Number.isNaN` is true only for the NaN value
  // itself, so on its own this let a string, null or an object straight
  // through - it happened to hold only because every caller passes the result
  // of `Number(...)`, which is either a number or NaN.
  if (typeof value !== "number" || Number.isNaN(value)) {
    throw new AppError(statusCode, message);
  }
}

/**
 * Turns a lookup that may have found nothing into a value or a 404.
 *
 * @remarks
 * The usual way of dealing with a `findById` that can return `null`: the
 * result comes back with the null removed from its type, so the rest of the
 * handler can use it directly.
 *
 * Any falsy value is treated as "not found", not just `null` - which is what
 * is wanted for documents, but means it must not be used on a number or
 * boolean that is legitimately `0` or `false`.
 *
 * @returns The same value, typed as present.
 * @throws {@link AppError} with `statusCode` (404 by default) when the value
 * is absent.
 */
export function requireFound<T>(
  value: T | null | undefined,
  message: string,
  statusCode = 404,
): T {
  if (!value) {
    throw new AppError(statusCode, message);
  }

  return value;
}
