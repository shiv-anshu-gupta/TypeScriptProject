import { Router, type Request, type Response } from "express";
import { getDbUserFromReq, requireAdmin } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/envelope";
import { requireText } from "../../utils/helpers";
import { User } from "../../models/User";

export const adminPushTokenRouter = Router();

adminPushTokenRouter.use(requireAdmin);

// Register this admin browser to receive FCM web-push alerts for new orders.
adminPushTokenRouter.post(
  "/push-token",
  asyncHandler(async (req: Request, res: Response) => {
    const dbUser = await getDbUserFromReq(req);
    const token = String(req.body.token || "").trim();

    requireText(token, "Push token is required");

    await User.updateOne(
      { _id: dbUser._id },
      { $addToSet: { webPushTokens: token } },
    );

    res.json(ok({ registered: true }));
  }),
);

adminPushTokenRouter.delete(
  "/push-token",
  asyncHandler(async (req: Request, res: Response) => {
    const dbUser = await getDbUserFromReq(req);
    const token = String(req.body.token || "").trim();

    requireText(token, "Push token is required");

    await User.updateOne(
      { _id: dbUser._id },
      { $pull: { webPushTokens: token } },
    );

    res.json(ok({ registered: false }));
  }),
);
