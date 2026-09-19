/**
 * The single JSON shape every endpoint answers with.
 *
 * @packageDocumentation
 */

/**
 * The response body shared by every endpoint, whether it succeeded or not.
 *
 * @remarks
 * A client reads `status` first and never has to guess at the shape: on
 * success `data` holds the payload and `errors` is absent; on failure `data`
 * is null and `errors` carries at least one entry.
 */
export type ApiEnvelope<T> = {
  status: "success" | "error";
  data: T | null;
  meta?: Record<string, unknown>;
  errors?: Array<{ message: string; code?: string }>;
};

/**
 * Builds a success envelope.
 *
 * @param meta - extras that sit beside the payload rather than inside it,
 * such as a total count or a page limit.
 */
export function ok<T>(data: T, meta?: Record<string, unknown>): ApiEnvelope<T> {
  return { status: "success", data, meta };
}

/**
 * Builds a failure envelope.
 *
 * @param message - shown to the caller as written, so keep it plain and free
 * of internal detail.
 * @param code - short machine-readable tag for the client to branch on;
 * the error middleware uses `APP_ERROR` for a thrown {@link AppError} and
 * `INTERNAL` for anything unexpected.
 */
export function fail(message: string, code?: string): ApiEnvelope<null> {
  return { status: "error", data: null, errors: [{ message, code }] };
}
