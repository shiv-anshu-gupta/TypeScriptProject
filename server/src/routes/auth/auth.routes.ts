/**
 * Account routes: the MongoDB `users` record that sits behind a Clerk session.
 *
 * @remarks
 * Mounted at `/auth` in `server/src/server.ts`, so the paths below are
 * `/auth/sync` and `/auth/me`.
 *
 * Every route here needs a signed-in caller (any role). Neither route is
 * public and neither is admin-only. Admin rights are never granted through
 * this API: `syncDbUser` promotes a user whose Clerk email appears in the
 * `ADMIN_EMAILS` environment variable.
 *
 * @packageDocumentation
 */
import { Router } from "express";
import { getAuth } from "@clerk/express";
import { getDbUserFromReq, requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/AppError";
import { syncDbUser } from "../../services/user-sync";
import { ok } from "../../utils/envelope";

export const authRouter = Router();

type UserPayload = {
  _id: unknown;
  clerkUserId: string;
  email?: string;
  name?: string;
  role: string;
};

/**
 * Shapes a user document for the wire as `{ user: { id, clerkUserId, email,
 * name, role } }`.
 *
 * @remarks
 * The Mongo `_id` is renamed to `id`. `email` and `name` are left out of the
 * JSON when they are absent on the record, so a caller must treat both as
 * optional. Everything else on the document — `phone`, `points`, `addresses`,
 * `pushTokens`, `webPushTokens`, `__v` — is deliberately omitted.
 *
 * @param dbUser - The resolved `users` document.
 * @returns The payload passed to `ok()`.
 */
function toPayload(dbUser: UserPayload) {
  return {
    user: {
      id: dbUser._id,
      clerkUserId: dbUser.clerkUserId,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role,
    },
  };
}

/**
 * `POST /auth/sync` — reconciles the Clerk session with the `users`
 * collection and returns the resulting record.
 *
 * @remarks
 * Auth: signed-in customer (any role). No request body is read.
 *
 * Unlike `/auth/me` this calls `syncDbUser` unconditionally, so it refreshes
 * the stored email and name and re-applies the `ADMIN_EMAILS` promotion even
 * when a record already exists. The apps call it once, immediately after
 * login.
 *
 * Re-linking matters in production: moving Clerk from test to live keys gave
 * every returning customer a new `clerkUserId` while `users.email` carries a
 * unique index, so a verified email match under an older Clerk id is
 * re-pointed at the new id rather than inserted again.
 *
 * Side effects: reads the Clerk Backend API (`users.getUser`), and may write
 * to `users` — inserting a record, re-linking one to a new `clerkUserId`,
 * updating `email`/`name`, or setting `role` to `admin`.
 *
 * @throws AppError 401 `"User is not logged in. Means unauth user! !"` when
 * the request carries no valid Clerk session.
 * @throws AppError 409 `"This email is already used by another sKirana
 * account. Please contact the shop."` when the email is held by a record that
 * cannot be re-linked.
 */
// Called by the apps right after login: creates the user's record, re-links
// it after a Clerk instance change, or refreshes it (see syncDbUser).
authRouter.post(
  "/sync",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { userId } = getAuth(req);

    if (!userId) {
      throw new AppError(401, "User is not logged in. Means unauth user! !");
    }

    const dbUser = await syncDbUser(userId);
    res.status(200).json(ok(toPayload(dbUser)));
  }),
);

/**
 * `GET /auth/me` — the caller's own user record.
 *
 * @remarks
 * Auth: signed-in customer (any role). No parameters. Same response shape as
 * `/auth/sync`.
 *
 * `getDbUserFromReq` creates the record on demand when none exists, so this
 * read can still write. It does not refresh an existing record the way
 * `/auth/sync` does.
 *
 * Side effects: may insert or re-link a `users` document, and may call the
 * Clerk Backend API, on the create-on-demand path only.
 *
 * @throws AppError 401 `"User is not logged in. Means unauth user! !"`.
 * @throws AppError 409 `"This email is already used by another sKirana
 * account. Please contact the shop."` from the create-on-demand path.
 */
authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const dbUser = await getDbUserFromReq(req);
    res.status(200).json(ok(toPayload(dbUser)));
  }),
);
