/**
 * What the two auth endpoints answer with.
 *
 * @remarks
 * Both wrap the user in an object rather than returning it bare, so either
 * response can grow a second field without changing its callers.
 *
 * @packageDocumentation
 */

import type { AppUser } from "@/lib/types";

/**
 * The body of `GET /auth/me`, once the envelope is unwrapped.
 */
export type MeResponse = {
  user: AppUser;
};

/**
 * The body of `POST /auth/sync`, once the envelope is unwrapped.
 *
 * @remarks
 * Deliberately identical to {@link MeResponse}: sync answers with the record
 * it just wrote, so launch does not need a second read.
 */
export type SyncResponse = {
  user: AppUser;
};
