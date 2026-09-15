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

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const dbUser = await getDbUserFromReq(req);
    res.status(200).json(ok(toPayload(dbUser)));
  }),
);
