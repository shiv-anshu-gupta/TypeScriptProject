/**
 * Types shared across features: the user and the server's response envelope.
 *
 * @packageDocumentation
 */

/**
 * The two roles the server issues.
 *
 * @remarks
 * `user` is a mobile-app customer; `admin` is shop staff. The server assigns
 * the role by matching the account's email against its `ADMIN_EMAILS` list.
 * The client never decides this and must never try to.
 */
export type UserRole = "user" | "admin";

/**
 * The signed-in account as this app sees it.
 *
 * @remarks
 * Returned by `POST /auth/sync` and `GET /auth/me`, and held in the auth store.
 * This is the server's own record, not Clerk's — `id` is the Mongo document id,
 * while `clerkUserId` is the identity it was created from.
 *
 * `email` and `name` are optional because a Clerk identity need not carry
 * either. Any display of them must cope with an absent value.
 */
export type AppUser = {
  id: string;
  clerkUserId: string;
  email?: string;
  name?: string;
  role: UserRole;
};

/**
 * One failure reported by the server.
 *
 * @remarks
 * Only `message` is read by this app, and only the first item of the array —
 * see `lib/api.ts`. The messages are written to be shown to the shopkeeper
 * as-is, which some dialogs rely on (the refusal to delete a category that
 * still has products, for example).
 */
export type ApiErrorItem = {
  message: string;
  code?: string;
};

/**
 * The wrapper every server response arrives in.
 *
 * @remarks
 * Callers do not normally see this. The helpers in `lib/api.ts` unwrap it and
 * return `data`, or throw `errors[0].message`.
 *
 * Note that those helpers treat a null `data` as a failure even when `status`
 * is `"success"`, so an endpoint that legitimately returns nothing cannot be
 * called through them.
 *
 * @typeParam T - The payload type for the endpoint in question.
 */
export type ApiEnvelope<T> = {
  status: "success" | "error";
  data: T | null;
  meta?: Record<string, unknown>;
  errors?: ApiErrorItem[];
};
