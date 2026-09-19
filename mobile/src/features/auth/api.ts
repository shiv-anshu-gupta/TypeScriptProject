/**
 * The two endpoints that turn a Clerk session into an account on this server.
 *
 * @remarks
 * Both need a bearer token; without one the server answers with an error and
 * the api client throws.
 *
 * @packageDocumentation
 */

import { apiGet, apiPost } from "@/lib/api";
import type { MeResponse, SyncResponse } from "./types";

/**
 * `POST /auth/sync` — creates this server's record for the signed-in Clerk
 * user, or updates it.
 *
 * @remarks
 * Safe to call on every launch: the server upserts. It answers with the same
 * user record `/auth/me` would, so launch needs one round trip rather than
 * two.
 *
 * @returns `{ user }` — the account as this server knows it.
 * @throws Error When there is no usable token, or the server refuses.
 */
export function syncUser() {
  return apiPost<SyncResponse>("/auth/sync");
}

/**
 * `GET /auth/me` — the signed-in account, read only.
 *
 * @remarks
 * Not used on the startup path, which prefers {@link syncUser} for the round
 * trip it saves. Kept for a caller that wants to re-read the account without
 * writing anything.
 *
 * @returns `{ user }`.
 * @throws Error When there is no usable token, or the account does not exist
 * on this server yet.
 */
export function getMe() {
  return apiGet<MeResponse>("/auth/me");
}
