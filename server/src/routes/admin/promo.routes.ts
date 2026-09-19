/**
 * Promo-code management for the shop.
 *
 * @remarks
 * Mounted at `/admin` in `server/src/server.ts`, giving `/admin/promos` and
 * `/admin/promos/:promoId`.
 *
 * Every route here requires an admin (`requireAdmin` is applied router-wide).
 * The customer-facing check lives in `routes/customer/promo.routes.ts` and is
 * read-only.
 *
 * All four routes answer with the complete promo list, newest first, rather
 * than with the record that changed, and the create returns 200 rather than
 * 201. Nothing here is paginated.
 *
 * `code` is the natural key: it is upper-cased on the way in and must be
 * unique across the collection, which is enforced in this router rather than
 * by an index.
 *
 * @packageDocumentation
 */
import { Router, type Request, type Response } from "express";
import { requireAdmin } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { Promo } from "../../models/Promo";
import { Types } from "mongoose";
import { ok } from "../../utils/envelope";
import { requireFound, requireText } from "../../utils/helpers";
import { AppError } from "../../utils/AppError";

type PromoDbItem = {
  _id?: Types.ObjectId;
  code: string;
  percentage: number;
  count: number;
  minimumOrderValue: number;
  startsAt: Date;
  endsAt: Date;
  createdAt?: Date;
};

/**
 * Shapes one promo document for the admin panel.
 *
 * @remarks
 * Produces `{ _id, code, percentage, count, minimumOrderValue, startsAt,
 * endsAt, createdAt }`. The `_id` is stringified and becomes `""` when
 * absent; `__v` and `updatedAt` are omitted. The two dates are passed through
 * as `Date` values and are serialised to ISO strings by `res.json`.
 *
 * `count` is the number of uses still left, not the number already used.
 *
 * @param item - A plain object form of a `Promo` document.
 * @returns The promo as the admin panel reads it.
 */
function mapPromo(item: PromoDbItem) {
  return {
    _id: String(item._id || ""),
    code: item.code,
    percentage: item.percentage,
    count: item.count,
    minimumOrderValue: item.minimumOrderValue,
    startsAt: item.startsAt,
    endsAt: item.endsAt,
    createdAt: item.createdAt,
  };
}

export const adminPromoRouter = Router();

adminPromoRouter.use(requireAdmin);

/**
 * Validates a promo create or update body and returns the six fields to
 * store.
 *
 * @remarks
 * Shared by `POST /admin/promos` and `PATCH /admin/promos/:promoId`, so both
 * enforce exactly the same rules — the `PATCH` is a full replacement and
 * cannot be used to change one field on its own.
 *
 * Rules: `code` is trimmed, upper-cased and must be non-empty; `percentage`
 * must be a number from 1 to 100; `count` must be a whole number of 1 or
 * more; `minimumOrderValue` must be a number of 0 or more; `startsAt` and
 * `endsAt` must both parse as dates, with `endsAt` strictly after `startsAt`.
 *
 * Two of the messages do not match what they guard. The percentage message
 * says "between 1 and 10" while the check allows up to 100, and the
 * `minimumOrderValue` failure is reported as a "Promo count" problem. Both
 * are quoted below as they are actually sent.
 *
 * Uniqueness of `code` is not checked here; each caller does that itself,
 * because the update has to exclude the record being edited.
 *
 * @param req - The Express request; only `req.body` is read.
 * @returns The validated `{ code, percentage, count, minimumOrderValue,
 * startsAt, endsAt }` to write.
 * @throws AppError 400 `"promo code is required"` when `code` is blank.
 * @throws AppError 400 `"Percentage must be between 1 and 10"` when
 * `percentage` is not a number between 1 and 100.
 * @throws AppError 400 `"Promo count must be atleast 1"` when `count` is not
 * a whole number of 1 or more.
 * @throws AppError 400 `"Promo count must be atleast 0 or more"` when
 * `minimumOrderValue` is not a number of 0 or more.
 * @throws AppError 400 `"Valid start time is required"` when `startsAt` does
 * not parse.
 * @throws AppError 400 `"Valid end time is required"` when `endsAt` does not
 * parse.
 * @throws AppError 400 `"End time should be after start time"` when the
 * window is empty or inverted.
 */
function parsePromoPayload(req: Request) {
  const code = String(req.body.code || "")
    .trim()
    .toUpperCase();
  const percentage = Number(req.body.percentage);
  const count = Number(req.body.count);
  const minimumOrderValue = Number(req.body.minimumOrderValue);
  const startsAt = new Date(req.body.startsAt);
  const endsAt = new Date(req.body.endsAt);

  requireText(code, "promo code is required");

  if (Number.isNaN(percentage) || percentage < 1 || percentage > 100) {
    throw new AppError(400, "Percentage must be between 1 and 10");
  }

  if (!Number.isInteger(count) || count < 1) {
    throw new AppError(400, "Promo count must be atleast 1");
  }

  if (Number.isNaN(minimumOrderValue) || minimumOrderValue < 0) {
    throw new AppError(400, "Promo count must be atleast 0 or more");
  }

  if (Number.isNaN(startsAt.getTime())) {
    throw new AppError(400, "Valid start time is required");
  }
  if (Number.isNaN(endsAt.getTime())) {
    throw new AppError(400, "Valid end time is required");
  }

  if (endsAt <= startsAt) {
    throw new AppError(400, "End time should be after start time");
  }

  return {
    code,
    percentage,
    count,
    minimumOrderValue,
    startsAt,
    endsAt,
  };
}

/**
 * Reads every promo, newest first, mapped for the wire.
 *
 * @remarks
 * The whole-collection read that all four routes in this file answer with,
 * so each mutation costs a second query. Unpaginated and unfiltered: expired
 * and exhausted promos are included, and the admin panel decides how to show
 * them.
 *
 * @returns Every promo as `mapPromo` shapes it.
 */
async function getAllPromos() {
  const promos = await Promo.find().sort({ createdAt: -1 });

  return promos.map((item) => mapPromo(item.toObject()));
}

/**
 * `GET /admin/promos` — every promo code, newest first.
 *
 * @remarks
 * Auth: admin. No parameters and no pagination.
 *
 * Side effects: none.
 */
adminPromoRouter.get(
  "/promos",

  asyncHandler(async (req: Request, res: Response) => {
    res.json(
      ok({
        items: await getAllPromos(),
      }),
    );
  }),
);

/**
 * `POST /admin/promos` — creates a promo code.
 *
 * @remarks
 * Auth: admin. Body is validated by `parsePromoPayload`, which documents
 * every field and its limits.
 *
 * The code must not already be in use. The check is a separate query rather
 * than a unique index, so two simultaneous creates of the same code can both
 * pass it.
 *
 * Answers 200 with the whole promo list — not 201, and not the created
 * record on its own.
 *
 * Side effects: one insert into `promos`.
 *
 * @throws AppError 400 `"Promo code already exists"` when another promo
 * already holds that code.
 * @throws AppError 400 from `parsePromoPayload` for each invalid field.
 */
adminPromoRouter.post(
  "/promos",

  asyncHandler(async (req: Request, res: Response) => {
    const payload = parsePromoPayload(req);

    const existingPromo = await Promo.findOne({ code: payload.code });

    if (existingPromo) {
      throw new AppError(400, "Promo code already exists");
    }

    await Promo.create(payload);

    res.json(
      ok({
        items: await getAllPromos(),
      }),
    );
  }),
);

/**
 * `PATCH /admin/promos/:promoId` — replaces every field of one promo code.
 *
 * @remarks
 * Auth: admin. Path parameter `promoId`.
 *
 * Despite the verb this is a full replacement: the body goes through the same
 * `parsePromoPayload` as the create, so all six fields are required and
 * omitting one is an error rather than a "leave it alone".
 *
 * The uniqueness check excludes the record being edited, so a promo may keep
 * its own code. Editing `count` sets the remaining uses outright — it is not
 * added to the current balance.
 *
 * Answers with the whole promo list.
 *
 * Side effects: one write to `promos`.
 *
 * @throws AppError 400 `"Promo Id is needed here"` when the path parameter is
 * blank.
 * @throws AppError 404 `"Promo not found"` when no promo has that id.
 * @throws AppError 400 `"Promo code already exists"` when a different promo
 * already holds the new code.
 * @throws AppError 400 from `parsePromoPayload` for each invalid field.
 */
adminPromoRouter.patch(
  "/promos/:promoId",

  asyncHandler(async (req: Request, res: Response) => {
    const promoId = String(req.params.promoId || "").trim();
    requireText(promoId, "Promo Id is needed here");

    const payload = parsePromoPayload(req);

    const promo = await Promo.findById(promoId);
    const foundPromo = requireFound(promo, "Promo not found", 404);

    const existingPromo = await Promo.findOne({
      code: payload.code,
      _id: { $ne: foundPromo._id },
    });

    if (existingPromo) {
      throw new AppError(400, "Promo code already exists");
    }

    foundPromo.code = payload.code;
    foundPromo.percentage = payload.percentage;
    foundPromo.count = payload.count;
    foundPromo.minimumOrderValue = payload.minimumOrderValue;
    foundPromo.startsAt = payload.startsAt;
    foundPromo.endsAt = payload.endsAt;

    await foundPromo.save();

    res.json(
      ok({
        items: await getAllPromos(),
      }),
    );
  }),
);

/**
 * `DELETE /admin/promos/:promoId` — removes a promo code.
 *
 * @remarks
 * Auth: admin. Path parameter `promoId`; no body is read.
 *
 * The delete is unconditional: a promo that is live, or that customers have
 * already used, is removed without warning. Orders that recorded the code
 * keep their own copy of it, so past discounts are unaffected.
 *
 * Answers with the whole remaining promo list.
 *
 * Side effects: one delete from `promos`.
 *
 * @throws AppError 400 `"Promo Id is needed here"` when the path parameter is
 * blank.
 * @throws AppError 404 `"Promo not found"` when no promo has that id.
 */
adminPromoRouter.delete(
  "/promos/:promoId",

  asyncHandler(async (req: Request, res: Response) => {
    const promoId = String(req.params.promoId || "").trim();
    requireText(promoId, "Promo Id is needed here");

    const promo = await Promo.findById(promoId);
    requireFound(promo, "Promo not found", 404);

    await Promo.findByIdAndDelete(promoId);

    res.json(
      ok({
        items: await getAllPromos(),
      }),
    );
  }),
);
