/**
 * Browser registration for the Firebase web-push alerts the admin panel
 * receives when an order arrives.
 *
 * @remarks
 * Mounted at `/admin` in `server/src/server.ts`, so the single path is
 * `/admin/push-token`, reached with `POST` and `DELETE`.
 *
 * Every route here requires an admin (`requireAdmin` is applied router-wide).
 * Tokens are stored on `users.webPushTokens` — a separate array from the
 * customers' Expo `users.pushTokens` — and are read by `notifyAdmins`.
 *
 * Tokens that Firebase reports as dead are pruned by `notifyAdmins` itself,
 * so a browser that clears its site data does not need to call the `DELETE`.
 *
 * @packageDocumentation
 */
import { Router, type Request, type Response } from "express";
import { getDbUserFromReq, requireAdmin } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/envelope";
import { requireText } from "../../utils/helpers";
import { User } from "../../models/User";

export const adminPushTokenRouter = Router();

adminPushTokenRouter.use(requireAdmin);

/**
 * `POST /admin/push-token` — records an FCM web-push registration token for
 * the calling admin's browser.
 *
 * @remarks
 * Auth: admin.
 *
 * Body: `{ token }` — trimmed, and must be non-empty after trimming. The
 * string is not validated as an FCM token here.
 *
 * Always answers `{ registered: true }`, whether the token was new or already
 * present. Each admin's browsers are stored against that admin's own user
 * record, so `notifyAdmins` reaches every admin who has registered.
 *
 * Side effects: one write to `users.webPushTokens`.
 *
 * @throws AppError 400 `"Push token is required"` when `token` is missing or
 * blank.
 */
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

/**
 * `DELETE /admin/push-token` — removes one FCM web-push token from the
 * calling admin's browser list.
 *
 * @remarks
 * Auth: admin.
 *
 * Body: `{ token }`, same rules as the `POST`. Note that this `DELETE`
 * carries a JSON body, which some HTTP clients, proxies and `fetch`
 * implementations drop; such a caller sees the 400 below.
 *
 * Removing a token that was never registered succeeds and answers
 * `{ registered: false }`.
 *
 * Side effects: one write to `users.webPushTokens`.
 *
 * @throws AppError 400 `"Push token is required"` when `token` is missing or
 * blank — including when the body was stripped in transit.
 */
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
