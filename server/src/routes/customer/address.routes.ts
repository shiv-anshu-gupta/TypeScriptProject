/**
 * A customer's delivery addresses, stored as sub-documents on their own user
 * record.
 *
 * @remarks
 * Mounted at `/customer` in `server/src/server.ts`, giving
 * `/customer/addresses` and `/customer/addresses/:addressId`.
 *
 * Every route here requires a signed-in customer (`requireAuth` is applied
 * router-wide) and works only on the caller's own `users.addresses` array, so
 * one customer can never see or edit another's.
 *
 * All four routes answer with the same thing: the caller's complete address
 * list, default first. None of them returns the single record that changed,
 * and the create returns 200 rather than 201.
 *
 * Exactly one address is the default whenever the list is non-empty: the
 * first address added becomes the default automatically, promoting another
 * demotes the rest, and deleting the default hands the flag to the first
 * survivor.
 *
 * No shipped client calls these routes; they belong to the cart-and-checkout
 * flow the apps no longer reach, but they are live on the server.
 *
 * @packageDocumentation
 */
import { Router, type Request, type Response } from "express";
import { getDbUserFromReq, requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { User } from "../../models/User";
import { requireFound, requireText } from "../../utils/helpers";
import { ok } from "../../utils/envelope";
import { AppError } from "../../utils/AppError";

type AddressItem = {
  _id?: string;
  fullName: string;
  address: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
};

/**
 * Shapes one stored address sub-document for the wire.
 *
 * @remarks
 * Produces `{ _id, fullName, address, state, postalCode, isDefault }`. The
 * `_id` is stringified and becomes `""` when absent, which happens for an
 * address that has just been pushed onto the array but not yet saved. Mongoose
 * internals such as `__v` are omitted.
 *
 * The four text fields are returned exactly as they were stored. They are
 * trimmed on the way in but not otherwise cleaned, so whatever the customer
 * typed comes back unchanged.
 *
 * @param item - One entry from `users.addresses`.
 * @returns The address as the app reads it.
 */
function mapAddress(item: AddressItem) {
  return {
    _id: String(item._id || ""),
    fullName: item.fullName,
    address: item.address,
    state: item.state,
    postalCode: item.postalCode,
    isDefault: item.isDefault,
  };
}

export const customerAddressRouter = Router();

customerAddressRouter.use(requireAuth);

/**
 * `GET /customer/addresses` — the caller's addresses, default first.
 *
 * @remarks
 * Auth: signed-in customer. No parameters.
 *
 * The sort is stable on the default flag only, so the remaining addresses
 * keep their insertion order. A customer with no addresses gets
 * `{ items: [] }`, not a 404.
 *
 * Side effects: none, beyond the create-on-demand user write.
 *
 * @throws AppError 404 `"User not found"` when the record resolved from the
 * Clerk session has since disappeared from the database.
 */
customerAddressRouter.get(
  "/addresses",

  asyncHandler(async (req: Request, res: Response) => {
    const dbUser = await getDbUserFromReq(req);
    const user = await User.findById(dbUser._id);

    const foundUser = requireFound(user, "User not found", 404);

    const addresses = (foundUser.addresses || []) as AddressItem[];

    const items = [...addresses]
      .sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
      .map(mapAddress);

    res.json(ok({ items }));
  }),
);

/**
 * `POST /customer/addresses` — adds an address to the caller's list.
 *
 * @remarks
 * Auth: signed-in customer.
 *
 * Body: `fullName`, `address`, `state` and `postalCode` are all required and
 * are trimmed. There is no length cap and no sanitiser on any of them, unlike
 * the profile and grocery-list fields, and `postalCode` is not checked
 * against any postcode format. `isDefault` is optional.
 *
 * The new address becomes the default when `isDefault` is exactly `true`, or
 * when it is the first address on the record. Any other value, including the
 * string `"true"`, leaves the existing default alone.
 *
 * Answers 200 with the whole list, default first — not 201, and not the
 * created address on its own.
 *
 * Side effects: one write to the `users` document.
 *
 * @throws AppError 400 `"Full name is required"` when `fullName` is blank.
 * @throws AppError 400 `"Address is required"` when `address` is blank.
 * @throws AppError 400 `"State is required"` when `state` is blank.
 * @throws AppError 400 `"postal code is required"` when `postalCode` is blank
 * (the lower-case "postal" is the live message).
 * @throws AppError 404 `"User not found"` when the caller's record has since
 * disappeared from the database.
 */
customerAddressRouter.post(
  "/addresses",

  asyncHandler(async (req: Request, res: Response) => {
    const dbUser = await getDbUserFromReq(req);
    const fullName = String(req.body.fullName || "").trim();
    const address = String(req.body.address || "").trim();
    const state = String(req.body.state || "").trim();
    const postalCode = String(req.body.postalCode || "").trim();

    requireText(fullName, "Full name is required");
    requireText(address, "Address is required");
    requireText(state, "State is required");
    requireText(postalCode, "postal code is required");

    const user = await User.findById(dbUser._id);

    const foundUser = requireFound(user, "User not found", 404);

    const addresses = (foundUser.addresses || []) as AddressItem[];

    const shouldMarkAsDefault =
      req.body.isDefault === true || addresses.length === 0;

    if (shouldMarkAsDefault) {
      addresses.forEach((item) => {
        item.isDefault = false;
      });
    }

    addresses.push({
      fullName,
      address,
      state,
      postalCode,
      isDefault: shouldMarkAsDefault,
    });

    await foundUser.save();
    const items = [...addresses]
      .sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
      .map(mapAddress);

    res.json(ok({ items }));
  }),
);

/**
 * `PATCH /customer/addresses/:addressId` — replaces the four fields of one
 * address.
 *
 * @remarks
 * Auth: signed-in customer. Path parameter `addressId` is the sub-document
 * `_id`, not a top-level collection id.
 *
 * Despite the verb this is a full replacement of the four text fields, not a
 * partial update: `fullName`, `address`, `state` and `postalCode` are all
 * required, exactly as on the create, and omitting one is an error rather
 * than a "leave it alone".
 *
 * `isDefault: true` promotes this address and demotes the rest. `false` is
 * ignored — this route can set the flag but never clear it, so the only way
 * to move the default is to promote a different address.
 *
 * Answers with the whole list, default first.
 *
 * Side effects: one write to the `users` document.
 *
 * @throws AppError 400 `"Address id is required"` when the path parameter is
 * blank.
 * @throws AppError 400 `"Full name is required"` when `fullName` is blank.
 * @throws AppError 400 `"Address is required"` when `address` is blank.
 * @throws AppError 400 `"State is required"` when `state` is blank.
 * @throws AppError 400 `"postal code is required"` when `postalCode` is
 * blank.
 * @throws AppError 404 `"User not found"` when the caller's record has since
 * disappeared from the database.
 * @throws AppError 404 `"Address not found"` when no address on the record
 * has that id.
 */
customerAddressRouter.patch(
  "/addresses/:addressId",

  asyncHandler(async (req: Request, res: Response) => {
    const dbUser = await getDbUserFromReq(req);
    const addressId = String(req.params.addressId || "").trim();

    requireText(addressId, "Address id is required");

    const fullName = String(req.body.fullName || "").trim();
    const address = String(req.body.address || "").trim();
    const state = String(req.body.state || "").trim();
    const postalCode = String(req.body.postalCode || "").trim();

    requireText(fullName, "Full name is required");
    requireText(address, "Address is required");
    requireText(state, "State is required");
    requireText(postalCode, "postal code is required");

    const user = await User.findById(dbUser._id);

    const foundUser = requireFound(user, "User not found", 404);

    const addresses = (foundUser.addresses || []) as AddressItem[];

    const getAddressTheUserWantToEdit = addresses.find(
      (currentAddress) => String(currentAddress._id) === addressId,
    );

    if (!getAddressTheUserWantToEdit) {
      throw new AppError(404, "Address not found");
    }

    const shouldMarkAsDefault =
      req.body.isDefault === true || addresses.length === 0;

    if (shouldMarkAsDefault) {
      addresses.forEach((item) => {
        item.isDefault = false;
      });
    }

    getAddressTheUserWantToEdit.fullName = fullName;
    getAddressTheUserWantToEdit.address = address;
    getAddressTheUserWantToEdit.state = state;
    getAddressTheUserWantToEdit.postalCode = postalCode;

    if (shouldMarkAsDefault) {
      getAddressTheUserWantToEdit.isDefault = true;
    }

    await foundUser.save();

    const items = [...(foundUser.addresses as AddressItem[])]
      .sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
      .map(mapAddress);

    res.json(ok({ items }));
  }),
);

/**
 * `DELETE /customer/addresses/:addressId` — removes one address.
 *
 * @remarks
 * Auth: signed-in customer. Path parameter `addressId` is the sub-document
 * `_id`. No body is read, so this `DELETE` is safe with clients that strip
 * one.
 *
 * Deleting the default promotes the first remaining address, so the list
 * never ends up with entries but no default. Deleting the last address leaves
 * an empty list rather than an error.
 *
 * Answers with the whole remaining list, default first.
 *
 * Side effects: one write to the `users` document.
 *
 * @throws AppError 400 `"Address id is required"` when the path parameter is
 * blank.
 * @throws AppError 404 `"User not found"` when the caller's record has since
 * disappeared from the database.
 * @throws AppError 404 `"Address not found"` when no address on the record
 * has that id.
 */
customerAddressRouter.delete(
  "/addresses/:addressId",

  asyncHandler(async (req: Request, res: Response) => {
    const dbUser = await getDbUserFromReq(req);
    const addressId = String(req.params.addressId || "").trim();

    requireText(addressId, "Address id is required");

    const user = await User.findById(dbUser._id);

    const foundUser = requireFound(user, "User not found", 404);

    const addresses = (foundUser.addresses || []) as AddressItem[];

    const addressToBeDeletedIndex = addresses.findIndex(
      (currentAddress) => String(currentAddress._id) === addressId,
    );

    if (addressToBeDeletedIndex < 0) {
      throw new AppError(404, "Address not found");
    }

    const wasDefault = addresses[addressToBeDeletedIndex].isDefault;

    addresses.splice(addressToBeDeletedIndex, 1);

    if (
      wasDefault &&
      addresses.length > 0 &&
      !addresses.some((address) => address.isDefault)
    ) {
      addresses[0].isDefault = true;
    }

    await foundUser.save();

    const items = [...(foundUser.addresses as AddressItem[])]
      .sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
      .map(mapAddress);

    res.json(ok({ items }));
  }),
);
