/**
 * Promo-code checking for customers.
 *
 * @remarks
 * Mounted at `/customer` in `server/src/server.ts`, so the single path is
 * `POST /customer/promos/apply`.
 *
 * The route requires a signed-in customer (`requireAuth` is applied
 * router-wide). It only reads promos; creating and editing them is admin work
 * and lives in `routes/admin/promo.routes.ts`.
 *
 * No shipped client calls this route. It belongs to the cart-and-checkout
 * flow that the apps no longer reach, but it is live on the server.
 *
 * @packageDocumentation
 */
import { Router, type Request, type Response } from "express";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireText } from "../../utils/helpers";
import { AppError } from "../../utils/AppError";
import { Promo } from "../../models/Promo";
import { ok } from "../../utils/envelope";

export const customerPromoRouter = Router();

customerPromoRouter.use(requireAuth);

/**
 * `POST /customer/promos/apply` — checks a promo code against an order value
 * and returns its terms.
 *
 * @remarks
 * Auth: signed-in customer.
 *
 * Body: `code` (required; trimmed and upper-cased before the lookup, so codes
 * are matched case-insensitively) and `orderValue` (optional, defaults to 0,
 * must be a number and not negative).
 *
 * This validates only. It does not reserve the code, decrement `count`, or
 * attach the promo to anything — the checkout routes re-run the same checks
 * and do the decrement. Two callers can therefore both be told a
 * single-remaining code is usable.
 *
 * The response carries `code`, `percentage`, `count` and `minimumOrderValue`.
 * The promo's `startsAt` and `endsAt` are checked but not returned.
 *
 * Side effects: none.
 *
 * @throws AppError 400 `"Promo code is required"` when `code` is missing or
 * blank.
 * @throws AppError 400 `"Valid order value is required!"` when `orderValue`
 * is not a number, or is negative.
 * @throws AppError 404 `"Promo not found"` when no promo has that code.
 * @throws AppError 400 `"Promo code is not activated"` before `startsAt`.
 * @throws AppError 400 `"Promo code is expired"` after `endsAt`.
 * @throws AppError 400 `"Promo code limit is already excedded"` (the
 * misspelling is the live message) when `count` has fallen below 1.
 * @throws AppError 400 `"Minimum order value for this promo is <n>"` when
 * `orderValue` is under the promo's threshold.
 */
customerPromoRouter.post(
  "/promos/apply",
  asyncHandler(async (req: Request, res: Response) => {
    const code = String(req.body.code || "")
      .trim()
      .toUpperCase();

    const orderValue = Number(req.body.orderValue || 0);

    requireText(code, "Promo code is required");

    if (Number.isNaN(orderValue) || orderValue < 0) {
      throw new AppError(400, "Valid order value is required!");
    }

    const promo = await Promo.findOne({ code });

    if (!promo) {
      throw new AppError(404, "Promo not found");
    }

    const now = new Date();

    if (now < promo.startsAt) {
      throw new AppError(400, "Promo code is not activated");
    }

    if (now > promo.endsAt) {
      throw new AppError(400, "Promo code is expired");
    }

    if (promo.count < 1) {
      throw new AppError(400, "Promo code limit is already excedded");
    }

    if (orderValue < promo.minimumOrderValue) {
      throw new AppError(
        400,
        `Minimum order value for this promo is ${promo.minimumOrderValue}`,
      );
    }

    res.json(
      ok({
        code: promo.code,
        percentage: promo.percentage,
        count: promo.count,
        minimumOrderValue: promo.minimumOrderValue,
      }),
    );
  }),
);
