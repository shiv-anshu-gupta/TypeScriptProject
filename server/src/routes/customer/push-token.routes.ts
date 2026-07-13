import { Router, type Request, type Response } from "express";
import { getDbUserFromReq, requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/envelope";
import { requireText } from "../../utils/helpers";
import { User } from "../../models/User";

export const customerPushTokenRouter = Router();

customerPushTokenRouter.use(requireAuth);

// Register this device so the shop can notify the customer.
// $addToSet keeps the list unique if the same device registers twice.
customerPushTokenRouter.post(
  "/push-token",
  asyncHandler(async (req: Request, res: Response) => {
    const dbUser = await getDbUserFromReq(req);
    const token = String(req.body.token || "").trim();

    requireText(token, "Push token is required");

    await User.updateOne(
      { _id: dbUser._id },
      { $addToSet: { pushTokens: token } },
    );

    res.json(ok({ registered: true }));
  }),
);

// Called on sign-out so a shared device stops receiving this user's alerts.
customerPushTokenRouter.delete(
  "/push-token",
  asyncHandler(async (req: Request, res: Response) => {
    const dbUser = await getDbUserFromReq(req);
    const token = String(req.body.token || "").trim();

    requireText(token, "Push token is required");

    await User.updateOne(
      { _id: dbUser._id },
      { $pull: { pushTokens: token } },
    );

    res.json(ok({ registered: false }));
  }),
);
