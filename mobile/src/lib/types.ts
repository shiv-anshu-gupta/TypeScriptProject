/**
 * The shapes shared by every feature: the signed-in user and the envelope
 * every endpoint answers in.
 *
 * @packageDocumentation
 */

/**
 * What the server allows this account to do.
 *
 * @remarks
 * The customer app shows the same screens to both; `admin` matters in the web
 * admin panel. It is carried here only because `/auth/sync` returns the whole
 * user record.
 */
export type UserRole = "user" | "staff" | "admin";

/**
 * The account as the server knows it, returned by `/auth/sync` and
 * `/auth/me`.
 *
 * @remarks
 * `id` is this server's own identifier; `clerkUserId` is Clerk's. They are
 * different values and are not interchangeable.
 *
 * `name` and `email` are what Clerk knew at sign-up. They are not what the
 * shop sees on an order — that is the separate customer profile, which the
 * customer edits on the Account screen.
 */
export type AppUser = {
  id: string;
  clerkUserId: string;
  email?: string;
  name?: string;
  role: UserRole;
};

/**
 * One entry in an error envelope's `errors`.
 *
 * @remarks
 * Only the first entry's `message` is ever surfaced; it becomes the message
 * of the `Error` the api client throws.
 */
export type ApiErrorItem = {
  message: string;
  code?: string;
};

/**
 * The wrapper every endpoint answers in.
 *
 * @remarks
 * Callers do not see this. The api client unwraps it and hands back `data`
 * alone, or throws. Note the client treats a falsy `data` as a failure, so an
 * endpoint that legitimately answers with `null` cannot be called through it
 * as it stands.
 *
 * `meta` is accepted and currently ignored by the mobile app.
 */
export type ApiEnvelope<T> = {
  status: "success" | "error";
  data: T | null;
  meta?: Record<string, unknown>;
  errors?: ApiErrorItem[];
};
