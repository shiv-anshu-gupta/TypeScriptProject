/**
 * The customer's own name, email and mobile number.
 *
 * @remarks
 * Mounted at `/customer` in `server/src/server.ts`, so the paths are
 * `GET /customer/profile` and `PATCH /customer/profile`.
 *
 * Every route here requires a signed-in customer (`requireAuth` is applied
 * router-wide). A customer can only ever read and write their own record;
 * there is no path to another user's profile.
 *
 * Email is read-only through this API — it comes from Clerk and is
 * synchronised by `syncDbUser`.
 *
 * @packageDocumentation
 */
import { Router, type Request, type Response } from "express";
import { getDbUserFromReq, requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/envelope";
import { AppError } from "../../utils/AppError";
import { cleanField } from "../../utils/sanitizeItem";
import { normalizeMobile } from "../../utils/phone";
import { GroceryList } from "../../models/GroceryList";

// A customer's own details: the name and mobile the SHOP sees on their orders.
// Both are editable from the app's Account screen.
const MAX_NAME_LEN = 50;

type ProfileFields = {
  name?: string;
  email?: string;
  phone?: string;
};

/**
 * Shapes a user document as the three fields the Account screen shows.
 *
 * @remarks
 * Each missing value becomes `""`, never `null` or an absent key, so the app
 * can bind the values straight into text inputs. Everything else on the
 * record — `_id`, `clerkUserId`, `role`, `points`, `addresses`, push tokens —
 * is deliberately omitted.
 *
 * @param dbUser - The resolved `users` document.
 * @returns `{ name, email, phone }`, all strings.
 */
function mapProfile(dbUser: ProfileFields) {
  return {
    name: dbUser.name || "",
    email: dbUser.email || "",
    phone: dbUser.phone || "",
  };
}

export const customerProfileRouter = Router();

customerProfileRouter.use(requireAuth);

/**
 * `GET /customer/profile` — the caller's own name, email and mobile.
 *
 * @remarks
 * Auth: signed-in customer. No parameters.
 *
 * Resolved through `getDbUserFromReq`, so a first-time caller has their
 * record created here rather than getting a 404.
 *
 * Side effects: none, beyond that create-on-demand write.
 */
customerProfileRouter.get(
  "/profile",
  asyncHandler(async (req: Request, res: Response) => {
    const dbUser = await getDbUserFromReq(req);
    res.json(ok(mapProfile(dbUser)));
  }),
);

/**
 * `PATCH /customer/profile` — updates the caller's name and/or mobile number.
 *
 * @remarks
 * Auth: signed-in customer.
 *
 * Body: `name` and `phone`, both optional. Only keys actually present in the
 * body are touched, so sending `{ phone }` leaves the name alone. Sending
 * `null` counts as present and will fail validation.
 *
 * `name` is cleaned by `cleanField(value, 50, true)`: control, zero-width and
 * bidi characters are stripped, anything outside the grocery allowlist is
 * removed, whitespace is collapsed, and the result is cut to 50 characters.
 * A name that cleans down to nothing is rejected.
 *
 * `phone` is normalised by `normalizeMobile`: digits only, a leading `+91` or
 * `0` removed, and the result must match an Indian 10-digit mobile. Unlike
 * the grocery-list route, an invalid number here is an error rather than
 * being ignored.
 *
 * Side effects: two database writes — the `users` document, then a
 * `GroceryList.updateMany` described in the comment below.
 *
 * @throws AppError 400 `"Please enter your name"` when `name` is present but
 * empty after cleaning.
 * @throws AppError 400 `"Enter a valid 10-digit mobile number"` when `phone`
 * is present but does not normalise.
 */
// Update the name and/or mobile. Each field is optional, so the app can send
// just the one that changed. Values go through the same sanitizer as grocery
// items (length cap + no special characters) and the shared mobile validator.
customerProfileRouter.patch(
  "/profile",
  asyncHandler(async (req: Request, res: Response) => {
    const dbUser = await getDbUserFromReq(req);

    if (req.body.name !== undefined) {
      const name = cleanField(req.body.name, MAX_NAME_LEN, true);
      if (!name) {
        throw new AppError(400, "Please enter your name");
      }
      dbUser.name = name;
    }

    if (req.body.phone !== undefined) {
      const phone = normalizeMobile(req.body.phone);
      if (!phone) {
        throw new AppError(400, "Enter a valid 10-digit mobile number");
      }
      dbUser.phone = phone;
    }

    await dbUser.save();

    // Each list stores a snapshot of the customer's name / phone taken when it
    // was sent, so the shop would otherwise keep calling the OLD number. Push
    // the corrected details onto their still-open orders (finished and
    // cancelled ones stay as a historical record).
    await GroceryList.updateMany(
      {
        user: dbUser._id,
        status: { $nin: ["completed", "cancelled"] },
      },
      {
        $set: {
          customerName: dbUser.name || dbUser.email || "",
          customerPhone: dbUser.phone || "",
        },
      },
    );

    res.json(ok(mapProfile(dbUser)));
  }),
);
