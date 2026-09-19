/**
 * Device registration for Expo push notifications sent to customers.
 *
 * @remarks
 * Mounted at `/customer` in `server/src/server.ts`, so the single path is
 * `/customer/push-token`, reached with `POST` and `DELETE`.
 *
 * Every route here requires a signed-in customer (`requireAuth` is applied
 * router-wide). Tokens are stored on `users.pushTokens`, which is a different
 * array from the admin browsers' `users.webPushTokens`.
 *
 * Only tokens beginning `ExponentPushToken[` or `ExpoPushToken[` are ever
 * sent to by `notifyUser`. Any other string is stored but silently never
 * used.
 *
 * @packageDocumentation
 */
import { Router, type Request, type Response } from "express";
import { getDbUserFromReq, requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/envelope";
import { requireText } from "../../utils/helpers";
import { User } from "../../models/User";

export const customerPushTokenRouter = Router();

customerPushTokenRouter.use(requireAuth);

/**
 * `POST /customer/push-token` — records an Expo push token for the calling
 * customer's device.
 *
 * @remarks
 * Auth: signed-in customer.
 *
 * Body: `{ token }` — trimmed, and must be non-empty after trimming. The
 * value is not checked against the Expo token format here; an unusable string
 * is accepted and stored.
 *
 * Always answers `{ registered: true }`, whether the token was new or already
 * present.
 *
 * Side effects: one write to `users.pushTokens`.
 *
 * @throws AppError 400 `"Push token is required"` when `token` is missing or
 * blank.
 */
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

/**
 * `DELETE /customer/push-token` — removes one Expo push token from the
 * calling customer's device list.
 *
 * @remarks
 * Auth: signed-in customer.
 *
 * Body: `{ token }`, same rules as the `POST`. Note that this `DELETE`
 * carries a JSON body. The mobile app sends it through axios, which keeps the
 * body, but many HTTP clients, proxies and `fetch` implementations drop a
 * `DELETE` body — such a caller sees the 400 below.
 *
 * Removing a token that was never registered succeeds and answers
 * `{ registered: false }`.
 *
 * Side effects: one write to `users.pushTokens`.
 *
 * @throws AppError 400 `"Push token is required"` when `token` is missing or
 * blank — including when the body was stripped in transit.
 */
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
