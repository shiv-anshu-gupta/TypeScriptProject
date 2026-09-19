/**
 * Who is making this request, and are they allowed to.
 *
 * @remarks
 * Identity comes from Clerk, which `clerkMiddleware()` has already put on the
 * request by the time anything here runs. The app's own user record is a
 * separate thing, keyed by the Clerk user id - see services/user-sync.ts for
 * why the two can drift apart and how they are re-joined.
 *
 * @packageDocumentation
 */
import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { User } from "../models/User";
import { asyncHandler } from "../utils/asyncHandler";
import { syncDbUser } from "../services/user-sync";

/**
 * Gate that lets a request through only if somebody is signed in.
 *
 * @remarks
 * Checks the Clerk session alone - no database read - so it is cheap enough
 * to mount on whole routers. It proves only that the caller is signed in; it
 * says nothing about whether they have a user record, and loads nothing onto
 * the request. A handler that needs the record calls
 * {@link getDbUserFromReq}.
 *
 * Passes an {@link AppError} 401 to `next` when there is no session.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const { userId } = getAuth(req);

  if (!userId) {
    return next(
      new AppError(401, "User is not logged in. Means unauth user! !"),
    );
  }

  next();
}

/**
 * The app's own user record for whoever is making this request.
 *
 * @remarks
 * The usual first line of a handler that needs to know who the customer is.
 * Reads the Clerk session, then looks the record up by `clerkUserId`.
 *
 * May WRITE: when no record exists it falls through to `syncDbUser`, which
 * creates one - or re-links an older record that has the same verified email.
 * That call also reaches Clerk's API, so this is not always a single cheap
 * lookup.
 *
 * @returns The Mongoose user document, hydrated and saveable.
 * @throws {@link AppError} 401 when nobody is signed in, and whatever
 * `syncDbUser` throws - including {@link AppError} 409 when the email belongs
 * to another account that could not be re-linked.
 */
export async function getDbUserFromReq(req: Request) {
  const { userId } = getAuth(req);

  if (!userId) {
    throw new AppError(401, "User is not logged in. Means unauth user! !");
  }

  const dbUser = await User.findOne({ clerkUserId: userId });
  if (dbUser) return dbUser;

  // No record for this login yet - e.g. the app's first request raced ahead
  // of its sync call, or the sync failed. Create or re-link it now rather
  // than failing, so a signed-in customer always has a record.
  return syncDbUser(userId);
}

// admin gate
//user logged in user + admin access

/**
 * Gate that lets a request through only if the caller is an admin.
 *
 * @remarks
 * Covers being signed in as well, so it does not need
 * {@link requireAuth} in front of it. Unlike that one, this reads (and may
 * write) the database through {@link getDbUserFromReq}, so mount it on admin
 * routes only.
 *
 * Admin is a role on the user record. It is granted by
 * services/user-sync.ts from the `ADMIN_EMAILS` environment variable, not by
 * anything an admin does in the panel.
 *
 * Answers 403 when the caller is signed in but not an admin, and 401 when
 * they are not signed in at all.
 */
export const requireAdmin = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const extractCurrentDbUser = await getDbUserFromReq(req);

    if (extractCurrentDbUser.role !== "admin") {
      throw new AppError(403, "Admin access only");
    }

    next();
  },
);
