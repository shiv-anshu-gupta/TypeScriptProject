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

function mapProfile(dbUser: ProfileFields) {
  return {
    name: dbUser.name || "",
    email: dbUser.email || "",
    phone: dbUser.phone || "",
  };
}

export const customerProfileRouter = Router();

customerProfileRouter.use(requireAuth);

customerProfileRouter.get(
  "/profile",
  asyncHandler(async (req: Request, res: Response) => {
    const dbUser = await getDbUserFromReq(req);
    res.json(ok(mapProfile(dbUser)));
  }),
);

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
