import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { User } from "../models/User";
import { asyncHandler } from "../utils/asyncHandler";
import { syncDbUser } from "../services/user-sync";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const { userId } = getAuth(req);

  if (!userId) {
    return next(
      new AppError(401, "User is not logged in. Means unauth user! !"),
    );
  }

  next();
}

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

export const requireAdmin = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const extractCurrentDbUser = await getDbUserFromReq(req);

    if (extractCurrentDbUser.role !== "admin") {
      throw new AppError(403, "Admin access only");
    }

    next();
  },
);
