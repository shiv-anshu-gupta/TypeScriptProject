/**
 * The error type used whenever a failure has a status the caller should see.
 *
 * @packageDocumentation
 */

/**
 * An error that carries the HTTP status to answer with.
 *
 * @remarks
 * `errorHandler` in middleware/errorhandler.ts is the only reader of
 * `statusCode`: an `AppError` becomes that status with its message passed
 * through to the client, while every other error becomes a 500 with a generic
 * message and the real one only in the log.
 *
 * So the choice of error type decides what the customer is told. Throw an
 * `AppError` for anything they are allowed to read ("Product not found",
 * "This list already has too many items"), and a plain `Error` for anything
 * that should stay internal.
 *
 * The message is sent verbatim, so it must never contain a stack trace, a
 * database detail or a key.
 *
 * @example
 * ```ts
 * throw new AppError(404, "Product not found");
 * ```
 */
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}
