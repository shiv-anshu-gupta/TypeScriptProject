/**
 * Customer grocery-list routes: sending a handwritten shopping list to the
 * shop, watching what the shop does with it, paying for it, and the chat
 * attached to it.
 *
 * @remarks
 * Mounted at `/customer` in `server/src/server.ts`, so every path below reads
 * `/customer/grocery-lists...`.
 *
 * `requireAuth` is applied to the whole router, so every route needs a
 * signed-in customer. No route here is public and none is admin-only. The
 * shopkeeper's side of the same lists and the same chat lives in
 * `server/src/routes/admin/grocery-list.routes.ts`.
 *
 * Every list lookup is scoped by `user`, so a list owned by somebody else
 * answers 404 `"List not found"` rather than 403. A malformed `listId`
 * reaches Mongoose as a CastError and surfaces as a 500.
 *
 * The division of labour matters when reading this file: the customer writes
 * item names, quantities and a note; the shop writes prices, `rate`,
 * `available`, `status` and the timestamps. The only list edit a customer can
 * make after sending is removing a single item, and only before packing
 * starts.
 *
 * None of these routes paginate.
 *
 * @see `docs/API.md` § 3.4 for the full request and response bodies.
 *
 * @packageDocumentation
 */
import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import crypto from "crypto";
import { getDbUserFromReq, requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/envelope";
import { requireFound, requireText } from "../../utils/helpers";
import { AppError } from "../../utils/AppError";
import multer from "multer";
import {
  GroceryList,
  GroceryListDocument,
  GroceryListItem,
} from "../../models/GroceryList";
import { parseGroceryListPhotos } from "../../services/photo-list-parser";
import { Message, MessageDocument } from "../../models/Message";
import {
  cleanField,
  cleanItems,
  MAX_ITEMS_PER_LIST,
  MAX_NOTE_LEN,
} from "../../utils/sanitizeItem";
import { normalizeMobile } from "../../utils/phone";
import { razorpay, toSubUnits } from "../../utils/razorpay";
import { notifyAdmins } from "../../utils/webPush";
import { sendTelegram } from "../../utils/telegram";


/**
 * Shapes one `grocerylists` document for the wire. Every list endpoint in this
 * file answers with this shape.
 *
 * @remarks
 * Adds `code`: the last eight characters of `_id`, upper-cased. That is the
 * human reference the shop and the customer quote at each other, and the same
 * one used in push titles and Telegram messages.
 *
 * Each item is reduced to `name`, `quantity`, `rate`, `price` and
 * `available`. A missing `rate` is emitted as `0` and a missing `available`
 * as `true`, so the app never has to test for `undefined`.
 *
 * Deliberately omitted: `user`, `customerName`, `customerEmail`,
 * `customerPhone`, `razorpayOrderId`, `paymentId`, `updatedAt` and `__v`. The
 * customer's own phone number is therefore never returned by this mapper; it
 * comes back once, separately, from `GET /customer/grocery-lists`.
 *
 * @param item - the hydrated list document.
 * @returns the plain object passed to `ok()`.
 */
function mapGroceryList(item: GroceryListDocument) {
  return {
    _id: String(item._id),
    code: String(item._id).slice(-8).toUpperCase(),
    items: item.items.map((listItem) => ({
      name: listItem.name,
      quantity: listItem.quantity,
      rate: listItem.rate ?? 0,
      price: listItem.price,
      available: listItem.available !== false,
    })),
    totalItems: item.totalItems,
    totalAmount: item.totalAmount,
    status: item.status,
    paymentMethod: item.paymentMethod,
    paymentStatus: item.paymentStatus,
    seenByCustomer: item.seenByCustomer,
    note: item.note,
    pricedAt: item.pricedAt,
    packedAt: item.packedAt,
    readyAt: item.readyAt,
    completedAt: item.completedAt,
    paidAt: item.paidAt,
    createdAt: item.createdAt,
  };
}

/**
 * Shapes one chat message for the wire.
 *
 * @remarks
 * `sender` is `"customer"` or `"staff"`, which is how the app decides which
 * side of the thread to draw the bubble on.
 *
 * Deliberately omitted: `groceryList`, `user`, `updatedAt` and `__v`. The
 * list id is already known to whoever asked for the thread.
 *
 * @param message - the hydrated message document.
 * @returns the plain object passed to `ok()`.
 */
function mapMessage(message: MessageDocument) {
  return {
    _id: String(message._id),
    sender: message.sender,
    senderName: message.senderName,
    text: message.text,
    createdAt: message.createdAt,
  };
}

export const customerGroceryListRouter = Router();

customerGroceryListRouter.use(requireAuth);

// A photo of a handwritten list is read and thrown away in the same request:
// it is held in memory only (never on disk, never on Cloudinary, never in the
// database), because what the customer keeps is the TEXT it becomes on their
// list — where they can correct anything the reader got wrong.
const MAX_PHOTO_BYTES = 6 * 1024 * 1024;
const MAX_PHOTOS_PER_READ = 3;
const PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Multer instance for the one multipart endpoint in this file.
 *
 * @remarks
 * Produces `req.files` as an array of `Express.Multer.File`, each with its
 * bytes in `file.buffer`. Nothing is written to disk, so `file.path` and
 * `file.destination` are never populated.
 *
 * The type check reads the declared `mimetype` from the multipart part, not
 * the bytes, so it rejects a wrong content type rather than a disguised file.
 * The size and count limits are enforced by multer itself and surface as a
 * `MulterError`, which is why {@link acceptPhotos} wraps this.
 *
 * @throws AppError 400 `"Send a JPG, PNG or WebP photo"` from the file
 * filter when a part declares any type outside JPEG, PNG and WebP.
 */
const receivePhotos = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PHOTO_BYTES, files: MAX_PHOTOS_PER_READ },
  fileFilter: (_req, file, done) => {
    if (PHOTO_TYPES.has(file.mimetype)) done(null, true);
    else done(new AppError(400, "Send a JPG, PNG or WebP photo"));
  },
});

/**
 * Express middleware that reads the `photos` multipart field into memory and
 * translates multer's own failures into an {@link AppError}.
 *
 * @remarks
 * Populates `req.files` with at most three buffers and calls `next()`. On
 * success it produces nothing else: no `req.body` field is added, and no
 * reference to the upload survives the request.
 *
 * Only `LIMIT_FILE_SIZE` is distinguished by message. Every other
 * `MulterError` — too many files, an unexpected field name, too many parts —
 * is reported as the "at most 3 photos" message, so that text is not proof
 * the count was the real problem.
 *
 * A non-multer error, including the 400 raised by the file filter, is passed
 * straight to `next` unchanged.
 *
 * @param req - the incoming request; `req.files` is set on success.
 * @param res - passed through to multer untouched.
 * @param next - called with no argument on success, or with the translated
 * error.
 * @throws AppError 400 `"Each photo must be under 6 MB"` when a part exceeds
 * `MAX_PHOTO_BYTES`.
 * @throws AppError 400 `"Send at most 3 photos at a time"` for any other
 * multer limit.
 *
 * @see `docs/API.md` § 4.1.
 */
// Multer reports its limits as its own error type; turn those into a clear 400.
function acceptPhotos(req: Request, res: Response, next: NextFunction) {
  receivePhotos.array("photos", MAX_PHOTOS_PER_READ)(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      return next(
        new AppError(
          400,
          err.code === "LIMIT_FILE_SIZE"
            ? "Each photo must be under 6 MB"
            : `Send at most ${MAX_PHOTOS_PER_READ} photos at a time`,
        ),
      );
    }
    next(err);
  });
}

/**
 * `POST /customer/grocery-lists/read-photo` — turns photos of a handwritten
 * list into `{ readable, items }` for the app to put in an editable draft.
 *
 * @remarks
 * Auth: signed-in customer. Body is `multipart/form-data` with a repeated
 * `photos` field: one to three files, each at most 6 MB, declared as
 * `image/jpeg`, `image/png` or `image/webp`. All the photos of one list go in
 * a single request so the model sees a list that runs onto a second page, and
 * so it costs one quota unit.
 *
 * This creates nothing. No list is started, no draft is saved, and the
 * returned items are only a suggestion until the customer sends them through
 * `POST /customer/grocery-lists`.
 *
 * Each returned item carries `name`, `quantity` and a `confidence` of
 * `"high"`, `"medium"` or `"low"`. Names and quantities come back already
 * cleaned by the same rules the send endpoint applies, rows under two
 * characters are dropped, and the list is cut to 50 items.
 *
 * `readable` is false when the model could not read the photo *or* when
 * nothing survived cleaning. That case is a **200** with
 * `{ readable: false, items: [] }`, not an error, so a caller must check the
 * flag rather than the status code.
 *
 * The rate limits below are per process and Vercel runs several, so the real
 * ceiling is higher than the numbers suggest. They are a brake on cost, not a
 * security boundary.
 *
 * Side effects: one Gemini `generateContent` call over REST, with the image
 * bytes base64-encoded inline, and one log line on success. No database
 * write, no Cloudinary upload, and no storage of the image anywhere.
 *
 * @throws AppError 400 `"Choose at least one photo"` when the multipart body
 * carries no `photos` part.
 * @throws AppError 429 `"Your photo is still being read — one moment."` when
 * the same customer already has a read in flight.
 * @throws AppError 429 `"Just a moment before the next photo."` when fewer
 * than 5 seconds have passed since that customer's previous read finished.
 * @throws AppError 503 `"Reading photos isn't switched on yet. Please type
 * the items instead."` when `GEMINI_API_KEY` is unset.
 * @throws AppError 503 `"A lot of lists are being read right now. Try again
 * in a minute, or type the items."` after 12 reads in the current minute.
 * @throws AppError 503 `"Could not reach the photo-reading service. Check the
 * internet and try again."` when the call fails or the 45 second abort fires.
 * @throws AppError 503 `"The photo reader is busy right now. Try again in a
 * minute, or type the items."` when Gemini answers 429.
 * @throws AppError 503 `"The photo could not be read just now. Try again, or
 * type the items."` on any other Gemini failure, or when the reply fails
 * schema validation.
 *
 * @see {@link acceptPhotos} for the 400s raised before this handler runs.
 * @see `docs/API.md` § 4.1, § 5.2 and § 6.1.
 */
// Read a photo of the customer's handwritten list and hand back the items as
// text, for the app to write onto their list. Nothing is stored: the photo
// lives only in this request's memory, and the customer is the one who checks
// and corrects what the reader made of it before the shop ever sees it.
customerGroceryListRouter.post(
  "/grocery-lists/read-photo",
  acceptPhotos,
  asyncHandler(async (req: Request, res: Response) => {
    const dbUser = await getDbUserFromReq(req);
    const files = (req.files || []) as Express.Multer.File[];

    if (!files.length) {
      throw new AppError(400, "Choose at least one photo");
    }

    const parsed = await parseGroceryListPhotos(
      files.map((file) => ({ mimeType: file.mimetype, buffer: file.buffer })),
      String(dbUser._id),
    );

    // Say plainly that nothing was found, rather than returning an empty list
    // the app would have to guess about.
    res.json(ok({ readable: parsed.readable, items: parsed.items }));
  }),
);

/**
 * `POST /customer/grocery-lists` — sends a list of items to the shop, either
 * as a new order or as more items on the order already open.
 *
 * @remarks
 * Auth: signed-in customer.
 *
 * Body fields: `items` (array of `{ name, quantity }`), `note` (string) and
 * `phone` (string). Limits, after cleaning: name 60 characters, quantity 12,
 * note 300. More than 500 raw rows is rejected outright; more than 50
 * surviving rows in one send is rejected; a merged list over 100 items is
 * rejected. A row whose name is under two characters is dropped silently, so
 * a body with rows can still fail the "at least one item" check.
 *
 * Cleaning is the last line of defence and the client is not trusted. A
 * non-string value — an object, an array, a `{ "$gt": "" }` injection
 * payload — collapses to an empty string rather than reaching the query or
 * the database. `phone` is normalised to ten digits starting 6-9; anything
 * else is ignored without an error, so a bad number fails silently.
 *
 * The response carries a `merged` boolean alongside the mapped list, and the
 * status code differs: **201** for a new list, **200** for a merge. On a
 * merge the new note is appended to the old one separated by ` | `, and the
 * stored phone is filled in only if it was empty.
 *
 * The merge target must be the caller's own list with `status: "received"`,
 * `paymentStatus: "pending"` and `updatedAt` within the last six hours. A
 * priced or packed list is never merged into, and neither is an older one, so
 * a send after the window opens a fresh order rather than reopening last
 * week's.
 *
 * The push and Telegram calls are awaited rather than left running, because
 * Vercel freezes the function once the response is sent. Both swallow their
 * own failures, so neither can fail the request.
 *
 * Side effects: may write `users.phone`; creates a `grocerylists` document or
 * updates an existing one; sends an FCM web push to every admin browser and a
 * Telegram message to every configured chat id.
 *
 * @throws AppError 400 `"Too many items in one request"` above 500 raw rows.
 * @throws AppError 400 `"A list can have at most 50 items per send"` above 50
 * surviving rows.
 * @throws AppError 400 `"Add at least one item"` when nothing survives
 * cleaning.
 * @throws AppError 400 `"This list already has too many items (max 100)."`
 * when a merge would push the list past the per-list cap.
 */
// Submit a new grocery list (item + quantity only, no prices)
customerGroceryListRouter.post(
  "/grocery-lists",
  asyncHandler(async (req: Request, res: Response) => {
    const dbUser = await getDbUserFromReq(req);

    // Capture the customer's mobile the first time they send a list (or when
    // they provide a new valid one). The app prompts for it up front.
    const phoneInput = normalizeMobile(req.body.phone);
    if (phoneInput && phoneInput !== dbUser.phone) {
      dbUser.phone = phoneInput;
      await dbUser.save();
    }
    const customerPhone = dbUser.phone || phoneInput || "";

    // Sanitize + hard-cap every field the customer typed. cleanItems drops
    // empty rows, strips control / injection characters, and rejects an
    // over-long name / quantity / an absurd number of items.
    const cleaned = cleanItems(req.body.items);
    const note = cleanField(req.body.note, MAX_NOTE_LEN);

    const items = cleaned.map((item) => ({
      name: item.name,
      quantity: item.quantity,
      price: 0,
      available: true,
    }));

    // A list is its items. A photo is only a faster way to write them down:
    // by the time a list is sent, the customer has already checked the text.
    if (!items.length) {
      throw new AppError(400, "Add at least one item");
    }

    // If the customer already has a not-yet-priced list from the SAME shopping
    // session (last touched within MERGE_WINDOW), merge the new items into it
    // instead of opening a parallel order. A new send after that window starts
    // a fresh order with today's date — so a week-old "received" list no longer
    // keeps absorbing every future send. Priced/packed lists are never merged.
    const MERGE_WINDOW_MS = 6 * 60 * 60 * 1000; // 6 hours
    const mergeTarget = await GroceryList.findOne({
      user: dbUser._id,
      status: "received",
      paymentStatus: "pending",
      updatedAt: { $gte: new Date(Date.now() - MERGE_WINDOW_MS) },
    }).sort({ createdAt: -1 });

    if (mergeTarget) {
      const mergedItems = [
        ...mergeTarget.items.map((item: GroceryListItem) => ({
          name: item.name,
          quantity: item.quantity,
          rate: item.rate ?? 0,
          price: item.price,
          available: item.available !== false,
        })),
        ...items,
      ];

      // Never let a list grow without bound (repeated sends into the same
      // 6h window). Beyond the cap, ask them to start a fresh order.
      if (mergedItems.length > MAX_ITEMS_PER_LIST) {
        throw new AppError(
          400,
          `This list already has too many items (max ${MAX_ITEMS_PER_LIST}).`,
        );
      }

      mergeTarget.set("items", mergedItems);
      mergeTarget.totalItems = mergedItems.length;

      if (!mergeTarget.customerPhone && customerPhone) {
        mergeTarget.customerPhone = customerPhone;
      }

      if (note) {
        mergeTarget.note = [mergeTarget.note, note]
          .filter(Boolean)
          .join(" | ");
      }

      await mergeTarget.save();

      // Alert the shop's browser. Awaited because serverless freezes after the
      // response; notifyAdmins never throws.
      await notifyAdmins(
        "List updated",
        `${dbUser.name || dbUser.email || "A customer"} added ${items.length} more item${
          items.length > 1 ? "s" : ""
        }`,
        { listId: String(mergeTarget._id), type: "list_updated" },
      );
      await sendTelegram(
        `🛒 <b>Order updated</b>\n${dbUser.name || dbUser.email || "A customer"} added ${items.length} more item${
          items.length > 1 ? "s" : ""
        } (now ${mergeTarget.totalItems}).`,
      );

      res.status(200).json(ok({ ...mapGroceryList(mergeTarget), merged: true }));
      return;
    }

    const groceryList = await GroceryList.create({
      user: dbUser._id,
      // Fall back to the email so the shopkeeper always sees WHO sent it.
      customerName: dbUser.name || dbUser.email || "",
      customerEmail: dbUser.email || "",
      customerPhone,
      items,
      totalItems: items.length,
      totalAmount: 0,
      status: "received",
      paymentMethod: "at_shop",
      paymentStatus: "pending",
      seenByCustomer: true,
      note,
    });

    await notifyAdmins(
      "New grocery list",
      `${dbUser.name || dbUser.email || "A customer"} sent ${items.length} item${
        items.length > 1 ? "s" : ""
      }`,
      { listId: String(groceryList._id), type: "new_list" },
    );
    await sendTelegram(
      `🛒 <b>New order</b>\nFrom: ${dbUser.name || dbUser.email || "A customer"}` +
        `${customerPhone ? ` (📞 ${customerPhone})` : ""}\n` +
        `${items.length} item${items.length > 1 ? "s" : ""} · #${String(groceryList._id).slice(-8).toUpperCase()}`,
    );

    res
      .status(201)
      .json(ok({ ...mapGroceryList(groceryList), merged: false }));
  }),
);

/**
 * `GET /customer/grocery-lists` — every list the caller has ever sent,
 * newest first, plus the few extras the list screen needs.
 *
 * @remarks
 * Auth: signed-in customer. No query or body parameters are read.
 *
 * Returns all of the caller's lists with no pagination and no date cut-off,
 * so the response grows for the life of the account.
 *
 * `unseenCount` is computed in this handler from the returned rows, not from
 * a separate count query, so it can never disagree with `items`.
 *
 * `upi.id` comes from `SHOP_UPI_ID` and `upi.name` from `SHOP_NAME`, which
 * defaults to `"sKirana"`. When `SHOP_UPI_ID` is unset the id is an empty
 * string, and the app is expected to hide the UPI option rather than build a
 * broken deep link.
 *
 * `customerPhone` is the number stored on the user, empty when never
 * captured. It is the only place the API hands a customer their own stored
 * number back.
 *
 * Side effects: none of its own, beyond the create-on-demand of the `users`
 * record shared by every authenticated route.
 */
// All of my lists (newest first)
customerGroceryListRouter.get(
  "/grocery-lists",
  asyncHandler(async (req: Request, res: Response) => {
    const dbUser = await getDbUserFromReq(req);

    const lists = await GroceryList.find({ user: dbUser._id }).sort({
      createdAt: -1,
    });

    const items = lists.map(mapGroceryList);

    // Drives the tab-bar badge: how many lists the shop has updated
    // and the customer hasn't opened yet.
    const unseenCount = items.filter((item) => !item.seenByCustomer).length;

    // Shop's UPI details so the app can build a "pay via UPI" deep link.
    const upi = {
      id: process.env.SHOP_UPI_ID || "",
      name: process.env.SHOP_NAME || "sKirana",
    };

    // Lets the app decide whether to prompt for a mobile number on first send.
    res.json(ok({ items, unseenCount, upi, customerPhone: dbUser.phone || "" }));
  }),
);

/**
 * `PATCH /customer/grocery-lists/:listId/seen` — marks one list as opened, so
 * it stops counting towards the badge.
 *
 * @remarks
 * Auth: signed-in customer. Path parameter `listId`. No body is read.
 *
 * Only the caller's own list can be marked; the lookup is scoped by `user`,
 * so someone else's id answers 404 rather than 403. A malformed id is a
 * Mongoose CastError and surfaces as a 500, not a 400.
 *
 * Idempotent: setting the flag on an already-seen list succeeds and returns
 * the same body. The shop sets the flag back to false whenever it changes the
 * list, so this is expected to be called many times over a list's life.
 *
 * Side effects: one write to `grocerylists`. Nothing is sent to the shop.
 *
 * @throws AppError 400 `"List id is required"` when the path segment is blank
 * after trimming.
 * @throws AppError 404 `"List not found"` when no such list belongs to the
 * caller.
 */
// Clear the notification badge for one list
customerGroceryListRouter.patch(
  "/grocery-lists/:listId/seen",
  asyncHandler(async (req: Request, res: Response) => {
    const dbUser = await getDbUserFromReq(req);
    const listId = String(req.params.listId || "").trim();

    requireText(listId, "List id is required");

    const list = await GroceryList.findOne({
      _id: listId,
      user: dbUser._id,
    });

    const foundList = requireFound(list, "List not found", 404);

    foundList.seenByCustomer = true;
    await foundList.save();

    res.json(ok(mapGroceryList(foundList)));
  }),
);

/**
 * `PATCH /customer/grocery-lists/:listId/remove-item` — drops one item from a
 * list the caller has already sent.
 *
 * @remarks
 * Auth: signed-in customer. Path parameter `listId`. Body `{ index }`, which
 * must be an integer of 0 or more and is the position in the `items` array as
 * the last response returned it.
 *
 * The index is positional, not an id, so it is only valid against the array
 * the caller last saw. If the shop adds or removes an item in between, the
 * same index removes a different row. There is no version check.
 *
 * Guards run in this order: valid index, not already paid, status is
 * `received` or `priced`, index within range, more than one item left. A list
 * can never be emptied this way; removing the last item is refused, and
 * cancelling an order entirely is the shop's job.
 *
 * `totalAmount` is recomputed as the sum of the remaining `price` values, so
 * on a list the shop has not priced yet it stays at 0.
 *
 * Side effects: one write to `grocerylists`. No push and no Telegram message,
 * so the shopkeeper only learns of the removal on their next refresh — which
 * matters if they are already picking the item off the shelf.
 *
 * @throws AppError 400 `"List id is required"` when the path segment is blank.
 * @throws AppError 400 `"Valid item index is required"` when `index` is not
 * an integer of 0 or more.
 * @throws AppError 400 `"This list is already paid"` when `paymentStatus` is
 * `"paid"`.
 * @throws AppError 400 `"Items can only be removed before the shop starts
 * packing"` when `status` is anything but `received` or `priced`.
 * @throws AppError 400 `"A list needs at least one item"` when only one item
 * remains.
 * @throws AppError 404 `"Item not found in this list"` when `index` is past
 * the end of the array.
 * @throws AppError 404 `"List not found"` when no such list belongs to the
 * caller.
 */
// Customer removes one item from a sent list (e.g. the quoted total went
// over budget). Only allowed BEFORE the shop starts packing, and never after
// payment. The total is recomputed from the remaining priced items.
customerGroceryListRouter.patch(
  "/grocery-lists/:listId/remove-item",
  asyncHandler(async (req: Request, res: Response) => {
    const dbUser = await getDbUserFromReq(req);
    const listId = String(req.params.listId || "").trim();
    const index = Number(req.body.index);

    requireText(listId, "List id is required");

    if (!Number.isInteger(index) || index < 0) {
      throw new AppError(400, "Valid item index is required");
    }

    const list = await GroceryList.findOne({ _id: listId, user: dbUser._id });
    const foundList = requireFound(list, "List not found", 404);

    if (foundList.paymentStatus === "paid") {
      throw new AppError(400, "This list is already paid");
    }

    if (!["received", "priced"].includes(foundList.status)) {
      throw new AppError(
        400,
        "Items can only be removed before the shop starts packing",
      );
    }

    if (index >= foundList.items.length) {
      throw new AppError(404, "Item not found in this list");
    }

    if (foundList.items.length <= 1) {
      throw new AppError(400, "A list needs at least one item");
    }

    const remaining = foundList.items.filter(
      (_item: GroceryListItem, itemIndex: number) => itemIndex !== index,
    );

    foundList.set("items", remaining);
    foundList.totalItems = remaining.length;
    foundList.totalAmount = remaining.reduce(
      (sum: number, item: GroceryListItem) => sum + (item.price || 0),
      0,
    );

    await foundList.save();

    res.json(ok(mapGroceryList(foundList)));
  }),
);

/**
 * `PATCH /customer/grocery-lists/:listId/pay-at-shop` — records that the
 * customer will pay in person on pickup.
 *
 * @remarks
 * Auth: signed-in customer. Path parameter `listId`. No body is read.
 *
 * Sets `paymentMethod` only. `paymentStatus` stays `"pending"` until the
 * shopkeeper marks the list paid from the admin side, so this is a statement
 * of intent and not a payment.
 *
 * It also undoes a change of mind: a list switched to `"online"` by
 * `pay-online` can be switched back here, and the `razorpayOrderId` already
 * stored is left in place rather than cleared. That stale order id stays on
 * the document, so an old Razorpay order could still be confirmed later.
 *
 * There is no status gate, so this works on a list the shop has not priced
 * yet and on one already packed. Only an already-paid list is refused.
 *
 * Side effects: one write to `grocerylists`. Nothing is sent to the shop.
 *
 * @throws AppError 400 `"List id is required"` when the path segment is blank.
 * @throws AppError 400 `"This list is already paid"` when `paymentStatus` is
 * `"paid"`.
 * @throws AppError 404 `"List not found"` when no such list belongs to the
 * caller.
 */
// Customer chooses to pay at the shop on pickup
customerGroceryListRouter.patch(
  "/grocery-lists/:listId/pay-at-shop",
  asyncHandler(async (req: Request, res: Response) => {
    const dbUser = await getDbUserFromReq(req);
    const listId = String(req.params.listId || "").trim();

    requireText(listId, "List id is required");

    const list = await GroceryList.findOne({ _id: listId, user: dbUser._id });
    const foundList = requireFound(list, "List not found", 404);

    if (foundList.paymentStatus === "paid") {
      throw new AppError(400, "This list is already paid");
    }

    foundList.paymentMethod = "at_shop";
    await foundList.save();

    res.json(ok(mapGroceryList(foundList)));
  }),
);

/**
 * `POST /customer/grocery-lists/:listId/pay-online` — opens a Razorpay order
 * for the shop's quoted total and returns what the checkout sheet needs.
 *
 * @remarks
 * Auth: signed-in customer. Path parameter `listId`. No body fields are read;
 * the amount comes from the stored `totalAmount` and can never be set by the
 * caller.
 *
 * The amount is converted from rupees to paise before it reaches Razorpay.
 * The receipt is `GroceryList_<id>`.
 *
 * `totalAmount < 1` means the shop has not priced the list yet, and is
 * refused. A list the shop later re-prices will need a new call, because the
 * previous `razorpayOrderId` is overwritten each time — the newest order id
 * is the only one `confirm-payment` will accept.
 *
 * The response body returns `RAZORPAY_KEY_ID` alongside the order. That is
 * the publishable key and is meant to reach the client.
 *
 * A Razorpay SDK failure is not an `AppError` and surfaces as a 500. The
 * server will not boot at all unless `RAZORPAY_KEY_ID` and
 * `RAZORPAY_KEY_SECRET` are both set.
 *
 * Side effects: creates an order at Razorpay, then one write to
 * `grocerylists` storing `razorpayOrderId` and `paymentMethod: "online"`. If
 * the write fails the Razorpay order is left orphaned.
 *
 * @throws AppError 400 `"List id is required"` when the path segment is blank.
 * @throws AppError 400 `"This list is already paid"` when `paymentStatus` is
 * `"paid"`.
 * @throws AppError 400 `"The shop has not priced this list yet"` when
 * `totalAmount` is below 1.
 * @throws AppError 404 `"List not found"` when no such list belongs to the
 * caller.
 */
// Customer chooses to pay online -> create a Razorpay order
customerGroceryListRouter.post(
  "/grocery-lists/:listId/pay-online",
  asyncHandler(async (req: Request, res: Response) => {
    const dbUser = await getDbUserFromReq(req);
    const listId = String(req.params.listId || "").trim();

    requireText(listId, "List id is required");

    const list = await GroceryList.findOne({ _id: listId, user: dbUser._id });
    const foundList = requireFound(list, "List not found", 404);

    if (foundList.paymentStatus === "paid") {
      throw new AppError(400, "This list is already paid");
    }

    if (foundList.totalAmount < 1) {
      throw new AppError(400, "The shop has not priced this list yet");
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: toSubUnits(foundList.totalAmount),
      currency: "INR",
      receipt: `GroceryList_${String(foundList._id)}`,
    });

    foundList.paymentMethod = "online";
    foundList.razorpayOrderId = razorpayOrder.id;
    await foundList.save();

    res.json(
      ok({
        razorpay: {
          keyId: process.env.RAZORPAY_KEY_ID,
          orderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
        },
        list: mapGroceryList(foundList),
      }),
    );
  }),
);

/**
 * `POST /customer/grocery-lists/:listId/confirm-payment` — verifies the
 * Razorpay callback and marks the list paid.
 *
 * @remarks
 * Auth: signed-in customer. Path parameter `listId`. Body requires
 * `razorpay_payment_id`, `razorpay_order_id` and `razorpay_signature`, all
 * trimmed and all non-empty.
 *
 * Trust comes from the signature, not from the client's word: the handler
 * recomputes `HMAC-SHA256("<order_id>|<payment_id>")` with
 * `RAZORPAY_KEY_SECRET` and compares it with the one sent. The order id must
 * also match the `razorpayOrderId` stored on the list, so a valid signature
 * for a different order is refused.
 *
 * Idempotent: an already-paid list returns **200** with the list unchanged,
 * without re-checking the signature, so a repeated callback is harmless.
 *
 * The comparison is a plain string equality, not a constant-time compare.
 *
 * Side effects: one write to `grocerylists` setting `paymentStatus: "paid"`,
 * `paymentMethod: "online"`, `paymentId` and `paidAt`. No push and no
 * Telegram message, so the shop is not told the list was paid online and
 * finds out on its next refresh.
 *
 * @throws AppError 400 `"List id is required"` when the path segment is blank.
 * @throws AppError 400 `"razorpayPaymentId is needed"` when
 * `razorpay_payment_id` is missing.
 * @throws AppError 400 `"razorpayOrderId is needed"` when
 * `razorpay_order_id` is missing.
 * @throws AppError 400 `"razorpaySignature is needed"` when
 * `razorpay_signature` is missing.
 * @throws AppError 400 `"Order id mismatch"` when the order id is not the one
 * stored on the list.
 * @throws AppError 400 `"Invalid payment signature"` when the HMAC does not
 * match.
 * @throws AppError 404 `"List not found"` when no such list belongs to the
 * caller.
 */
// Verify the Razorpay signature and mark the list paid
customerGroceryListRouter.post(
  "/grocery-lists/:listId/confirm-payment",
  asyncHandler(async (req: Request, res: Response) => {
    const dbUser = await getDbUserFromReq(req);
    const listId = String(req.params.listId || "").trim();
    const razorpayPaymentId = String(req.body.razorpay_payment_id || "").trim();
    const razorpayOrderId = String(req.body.razorpay_order_id || "").trim();
    const razorpaySignature = String(req.body.razorpay_signature || "").trim();

    requireText(listId, "List id is required");
    requireText(razorpayPaymentId, "razorpayPaymentId is needed");
    requireText(razorpayOrderId, "razorpayOrderId is needed");
    requireText(razorpaySignature, "razorpaySignature is needed");

    const list = await GroceryList.findOne({ _id: listId, user: dbUser._id });
    const foundList = requireFound(list, "List not found", 404);

    if (foundList.paymentStatus === "paid") {
      res.json(ok(mapGroceryList(foundList)));
      return;
    }

    if (foundList.razorpayOrderId !== razorpayOrderId) {
      throw new AppError(400, "Order id mismatch");
    }

    const signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (signature !== razorpaySignature) {
      throw new AppError(400, "Invalid payment signature");
    }

    foundList.paymentStatus = "paid";
    foundList.paymentMethod = "online";
    foundList.paymentId = razorpayPaymentId;
    foundList.paidAt = new Date();
    await foundList.save();

    res.json(ok(mapGroceryList(foundList)));
  }),
);

/**
 * `GET /customer/grocery-lists/:listId/messages` — the whole conversation
 * about one list, oldest first.
 *
 * @remarks
 * Auth: signed-in customer. Path parameter `listId`. No query parameters are
 * read.
 *
 * Returns both sides of the thread, customer and staff. There is no
 * pagination and no unread marker; the app is expected to poll and diff.
 *
 * Messages are deleted by MongoDB 30 days after they were written, by a TTL
 * index rather than by any code here. An old order's chat therefore comes
 * back empty even though the list itself is still there.
 *
 * Side effects: none.
 *
 * @throws AppError 400 `"List id is required"` when the path segment is blank.
 * @throws AppError 404 `"List not found"` when no such list belongs to the
 * caller; this is checked before any message is read.
 */
// Chat: the customer reads the conversation for one of their lists.
customerGroceryListRouter.get(
  "/grocery-lists/:listId/messages",
  asyncHandler(async (req: Request, res: Response) => {
    const dbUser = await getDbUserFromReq(req);
    const listId = String(req.params.listId || "").trim();
    requireText(listId, "List id is required");

    // Ownership check: a customer can only read their own list's chat.
    const list = await GroceryList.findOne({ _id: listId, user: dbUser._id });
    requireFound(list, "List not found", 404);

    const messages = await Message.find({ groceryList: listId }).sort({
      createdAt: 1,
    });

    res.json(ok({ messages: messages.map(mapMessage) }));
  }),
);

/**
 * `POST /customer/grocery-lists/:listId/messages` — sends one chat message to
 * the shop about a list.
 *
 * @remarks
 * Auth: signed-in customer. Path parameter `listId`. Body `{ text }`:
 * trimmed, non-empty, at most 1000 characters. The schema enforces the same
 * cap, so the check here is the friendly error rather than the only guard.
 *
 * The text is stored as sent. Unlike item names it is not put through the
 * grocery-list sanitiser, so special characters survive; the length cap is
 * the only limit. Anything rendering it must escape it.
 *
 * `sender` is fixed to `"customer"` and cannot be set by the caller.
 * `senderName` is the user's name, else their email, else `"Customer"`.
 *
 * There is no status gate, so a message can be sent about a completed or
 * cancelled list.
 *
 * The message is subject to the same 30 day TTL as the rest of the thread.
 *
 * The notifications are awaited because Vercel freezes the function once the
 * response is sent; both swallow their own failures.
 *
 * Side effects: one write to `messages`; an FCM web push to every admin
 * browser titled `"New message · #CODE"`; a Telegram message to every
 * configured chat id. The full message text is copied into both, so it leaves
 * the database for the notification services.
 *
 * @throws AppError 400 `"List id is required"` when the path segment is blank.
 * @throws AppError 400 `"Message cannot be empty"` when `text` is blank after
 * trimming.
 * @throws AppError 400 `"Message is too long"` above 1000 characters.
 * @throws AppError 404 `"List not found"` when no such list belongs to the
 * caller.
 */
// Chat: the customer sends a message to the shop about one of their lists.
customerGroceryListRouter.post(
  "/grocery-lists/:listId/messages",
  asyncHandler(async (req: Request, res: Response) => {
    const dbUser = await getDbUserFromReq(req);
    const listId = String(req.params.listId || "").trim();
    const text = String(req.body.text || "").trim();

    requireText(listId, "List id is required");
    requireText(text, "Message cannot be empty");
    if (text.length > 1000) {
      throw new AppError(400, "Message is too long");
    }

    const list = await GroceryList.findOne({ _id: listId, user: dbUser._id });
    const foundList = requireFound(list, "List not found", 404);

    const senderName = dbUser.name || dbUser.email || "Customer";
    const message = await Message.create({
      groceryList: foundList._id,
      user: dbUser._id,
      sender: "customer",
      senderName,
      text,
    });

    const code = String(foundList._id).slice(-8).toUpperCase();

    // Alert the shop (browser push + Telegram). Awaited: serverless freezes
    // after the response; these helpers never throw.
    await notifyAdmins(`New message · #${code}`, `${senderName}: ${text}`, {
      listId: String(foundList._id),
      type: "new_message",
    });
    await sendTelegram(
      `💬 <b>New message</b> · #${code}\nFrom: ${senderName}\n${text}`,
    );

    res.status(201).json(ok(mapMessage(message)));
  }),
);
