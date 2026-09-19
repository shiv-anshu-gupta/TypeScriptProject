/**
 * The two auth endpoint calls.
 *
 * @remarks
 * Only {@link useBootstrapAuth} calls these, and it calls them in the order
 * sync then me.
 *
 * @packageDocumentation
 */
import { apiGet, apiPost } from "@/lib/api";
import type { MeResponse, SyncResponse } from "./types";

/**
 * Creates or refreshes this Clerk user's record on the server.
 *
 * @remarks
 * `POST /auth/sync`. This is where admin rights are decided: the server matches
 * the account's email against its `ADMIN_EMAILS` list and writes the role. It
 * promotes but never demotes.
 *
 * It must run before {@link getMe}, otherwise a first-time sign-in has no user
 * record to read.
 *
 * @returns The synced user.
 * @throws The server's first error message, as thrown by `lib/api.ts`.
 */
export function syncUser() {
  return apiPost<SyncResponse>("/auth/sync");
}

/**
 * Reads the signed-in user, including the role the guards check.
 *
 * @remarks
 * `GET /auth/me`. The Clerk JWT is attached by the axios interceptor in
 * `lib/api.ts`, so no argument is needed.
 *
 * @returns The current user.
 * @throws The server's first error message, as thrown by `lib/api.ts`.
 */
export function getMe() {
  return apiGet<MeResponse>("/auth/me");
}
