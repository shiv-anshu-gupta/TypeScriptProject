/**
 * Response shapes for the two auth endpoints.
 *
 * @remarks
 * These describe the payload *inside* the server's `{ status, data, errors }`
 * envelope. `lib/api.ts` unwraps the envelope, so callers receive these types
 * directly.
 *
 * @packageDocumentation
 */
import type { AppUser } from "@/lib/types";

/**
 * Payload of `GET /auth/me`.
 *
 * @remarks
 * The `role` on the returned user is what every route guard decides on.
 */
export type MeResponse = {
  user: AppUser;
};

/**
 * Payload of `POST /auth/sync`.
 *
 * @remarks
 * Structurally identical to {@link MeResponse}, but produced by a different
 * server path: sync creates or updates the Mongo user record from the Clerk
 * identity and applies the `ADMIN_EMAILS` rule.
 */
export type SyncResponse = {
  user: AppUser;
};
