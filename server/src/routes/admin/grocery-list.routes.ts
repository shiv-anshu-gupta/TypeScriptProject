/**
 * The shopkeeper's side of a grocery list: pricing it, moving it through the
 * packing statuses, correcting its items, and the chat attached to it.
 *
 * @remarks
 * Mounted at `/admin` in `server/src/server.ts`, so the paths below read
 * `/admin/grocery-lists...`. The router is guarded end to end by
 * `requireAdmin`, so every route answers 401 to a caller with no Clerk
 * session and 403 to a signed-in customer. No route here is public.
 *
 * Seven of the ten routes answer with the WHOLE list collection rather than
 * the record that changed: the admin panel treats each mutation as a full
 * refresh, so a caller should replace its local state with `data.items`
 * instead of patching one row. The two chat reads and the chat write are the
 * exceptions.
 *
 * The customer's own routes live in `routes/customer/grocery-list.routes.ts`
 * and map the same documents differently — see {@link mapGroceryList}.
 *
 * Ownership is never checked here. An admin may read and change any
 * customer's list and any list's chat.
 *
 * `cleanItems` is imported but never called: the admin routes clean one field
 * at a time with `cleanField`, because they edit an existing list rather than
 * accept a whole array. The import is dead but harmless.
 *
 * @packageDocumentation
 */
import { Router, type Request, type Response } from "express";
import { roleOf } from "../../middleware/actor";
import { requirePermission } from "../../middleware/requirePermission";
import { recordAudit } from "../../services/audit";
import { conversationForRole, listForRole } from "../../utils/listForRole";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/envelope";
import { requireFound, requireText } from "../../utils/helpers";
import { AppError } from "../../utils/AppError";
import {
  GroceryList,
  GroceryListDocument,
  GroceryListItem,
  GroceryListStatus,
} from "../../models/GroceryList";
import { Message, MessageDocument } from "../../models/Message";
import {
  cleanField,
  cleanItems,
  MAX_ITEMS_PER_LIST,
  MAX_NAME_LEN,
  MAX_QTY_LEN,
  MIN_NAME_LEN,
} from "../../utils/sanitizeItem";
import { notifyUser } from "../../utils/push";

/**
 * The push body sent for each status the shop can set, keyed by that status.
 *
 * @remarks
 * Body text only — the push title is built per request from the list code, so
 * it is not in this table. There is no entry for `received` or `priced`
 * because neither is settable through the status route, and the `Record` type
 * makes leaving one out a compile error if a status is ever added.
 *
 * The wording is customer-facing and is sent as written, so a change here
 * changes what the customer reads on their lock screen.
 */
// What the customer's phone shows when the shop moves the list along.
const statusNotification: Record<AdminGroceryListStatus, string> = {
  packing: "The shop has started packing your order.",
  packed: "Your order is packed.",
  ready: "Your order is ready — come and collect it!",
  completed: "Your order is complete. Thank you!",
  cancelled: "Your order was cancelled by the shop.",
};

/**
 * The only `status` values the status route will accept, and the source of
 * {@link AdminGroceryListStatus}.
 *
 * @remarks
 * `received` and `priced` are absent on purpose: `received` is the state a
 * list is created in and there is no way back to it, and `priced` is set by
 * the pricing route. The order of the entries carries no meaning — nothing
 * enforces that a list moves forward one step at a time, so the shop can jump
 * straight from `packing` to `completed`, or cancel from any state.
 */
// Statuses the shopkeeper can move a list to (pricing is its own endpoint).
const ALLOWED_STATUSES = [
  "packing",
  "packed",
  "ready",
  "completed",
  "cancelled",
] as const;

type AdminGroceryListStatus = (typeof ALLOWED_STATUSES)[number];

/**
 * One row of the `items` array the shop sends to the pricing route.
 *
 * @remarks
 * `name` and `quantity` are declared so an admin client can post back the row
 * it was showing, but the pricing route reads neither: the customer's own
 * text stays the source of truth. Only `price` and `rate` are used, and they
 * are matched to the stored list **by array position**, not by name, which is
 * why the array length has to match exactly.
 */
type IncomingPricedItem = {
  name?: string;
  quantity?: string;
  rate?: number;
  price?: number;
};

/**
 * Shapes one grocery list for the admin panel.
 *
 * @remarks
 * This is the admin twin of the customer mapper. Compared with it, this one
 * adds `customerName`, `customerEmail`, `customerPhone` and `updatedAt`, and
 * deliberately omits `seenByCustomer` — that flag drives the customer's own
 * unread badge and means nothing to the shop. The raw `user` reference,
 * `razorpayOrderId`, `paymentId` and `__v` are left out as well.
 *
 * `code` is not stored: it is the last eight characters of the `_id`,
 * upper-cased, and is what the shop and the customer quote at each other.
 *
 * Each item comes back with `rate` defaulted to `0` and `available`
 * normalised to a real boolean, so an old record written before those fields
 * existed reads the same as a new one.
 *
 * @param item - a list document; `user` should already be populated with
 * `name email phone` or the customer fallbacks resolve to `""`.
 * @returns A plain object, not a Mongoose document, so it cannot be saved.
 */
function mapGroceryList(item: GroceryListDocument) {
  // `user` is populated with name/email in getAllGroceryLists, so lists
  // created before the name-fallback existed still show who sent them.
  const listUser = item.user as unknown as {
    name?: string;
    email?: string;
    phone?: string;
  } | null;

  return {
    _id: String(item._id),
    code: String(item._id).slice(-8).toUpperCase(),
    customerName: item.customerName || listUser?.name || listUser?.email || "",
    customerEmail: item.customerEmail || listUser?.email || "",
    customerPhone: item.customerPhone || listUser?.phone || "",
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
    note: item.note,
    pricedAt: item.pricedAt,
    packedAt: item.packedAt,
    readyAt: item.readyAt,
    completedAt: item.completedAt,
    paidAt: item.paidAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

/**
 * Reads every grocery list in the database and maps it for the admin panel.
 *
 * @remarks
 * Unfiltered and unpaginated: completed and cancelled lists come back too, so
 * the response grows for the life of the shop. It runs again at the end of
 * almost every mutation in this file, which is what makes those routes answer
 * with the whole collection.
 *
 * @returns Every list, newest activity first, as {@link mapGroceryList}
 * objects.
 */
async function getAllGroceryLists(role: string) {
  // Sort by last activity, not creation. When a customer sends a new list that
  // merges into an existing unpriced one, its items/updatedAt change but its
  // createdAt stays — so sorting by createdAt would bury a freshly re-sent
  // order at its old position. updatedAt bubbles active orders to the top.
  const lists = await GroceryList.find()
    .sort({ updatedAt: -1 })
    .populate("user", "name email phone");

  // The single funnel every list response passes through. Redacting here,
  // rather than at each of the eight call sites, is what makes it impossible
  // for a new route to forget: there is nowhere else to get a list from.
  return lists.map((item) => listForRole(mapGroceryList(item), role));
}

/**
 * Shapes one chat message for the wire.
 *
 * @remarks
 * Keeps only what a chat bubble needs. The `groceryList` and `user`
 * references, `updatedAt` and `__v` are omitted, so a client cannot walk from
 * a message back to the customer record.
 *
 * `createdAt` is load-bearing beyond display: a TTL index deletes each
 * message thirty days after it, so any message returned here has a limited
 * life.
 *
 * `sender` is `"customer"` or `"staff"`; `senderName` is a snapshot taken
 * when the message was written, so renaming the shop does not rewrite old
 * messages.
 *
 * @returns A plain object, not a Mongoose document.
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

export const adminGroceryListRouter = Router();

// No router-wide gate any more: each route below declares the permission it
// needs, because they are no longer all the same. The shop's staff may read,
// price, mark availability and chat; everything else is the shopkeeper's.

/**
 * `GET /admin/grocery-lists` — the whole list collection for the admin panel.
 *
 * @remarks
 * Auth: admin. No path, query or body parameters are read; there is no
 * filter, no search and no paging, so every list the shop has ever received
 * comes back in one response under `data.items`.
 *
 * Side effects: none. This is the only read-only list route here; the others
 * return the same payload as a by-product of writing.
 */
// All incoming lists (newest first)
adminGroceryListRouter.get(
  "/grocery-lists",
  requirePermission("lists:read"),
  asyncHandler(async (req: Request, res: Response) => {
    res.json(
      ok({
        items: await getAllGroceryLists(roleOf(req)),
      }),
    );
  }),
);

/**
 * `PATCH /admin/grocery-lists/:listId/prices` — prices every line of a list
 * in one go and moves it to `priced`.
 *
 * @remarks
 * Auth: admin.
 *
 * Path: `listId`. Body: `{ items: IncomingPricedItem[] }`. The array must be
 * non-empty and its length must equal the stored item count exactly —
 * pricing is positional, so a client that dropped or added a row is rejected
 * rather than silently misaligned.
 *
 * Per row: `price` must be a number ≥ 0 and is rounded with `Math.round`, so
 * paise are discarded. `rate` is kept only when finite and greater than zero,
 * otherwise it is stored as `0`; it is display-only and is never multiplied
 * into the total. A row already marked unavailable is forced to `price: 0`
 * whatever the shop sent, and its `available` flag cannot be changed here.
 * `name` and `quantity` in the body are ignored entirely.
 *
 * The total is the sum of the stored prices and must come to at least 1, so a
 * list cannot be sent back priced at zero. There is no status gate: a list
 * can be re-priced after it has moved on, which resets it to `priced`.
 *
 * Answers with the whole collection, not the one list.
 *
 * Side effects: one DB write (`items`, `totalAmount`, `status: "priced"`,
 * `pricedAt`, and `seenByCustomer: false` to re-light the customer's badge).
 * One Expo push to every device the customer has registered, titled
 * `"Your list is priced"`. The push is awaited because the serverless
 * function freezes once the response is sent; `notifyUser` swallows its own
 * errors, so it cannot fail the request.
 *
 * @throws AppError 400 `"List id is required"` when `:listId` is blank.
 * @throws AppError 400 `"Items are required"` when `items` is missing, not an
 * array, or empty.
 * @throws AppError 404 `"List not found"` when no list has that id.
 * @throws AppError 400 `"Item count does not match the customer's list"` when
 * the array length differs from the stored one.
 * @throws AppError 400 `"Each item price must be 0 or more"` when a price is
 * `NaN` or negative.
 * @throws AppError 400 `"Total must be greater than 0"` when the rounded
 * prices add up to less than 1.
 */
// Shopkeeper fills in a price per item -> list becomes "priced" and is
// sent back to the customer (seenByCustomer=false lights up their badge).
adminGroceryListRouter.patch(
  "/grocery-lists/:listId/prices",
  requirePermission("lists:price"),
  asyncHandler(async (req: Request, res: Response) => {
    const listId = String(req.params.listId || "").trim();
    requireText(listId, "List id is required");

    const incomingItems = Array.isArray(req.body.items)
      ? (req.body.items as IncomingPricedItem[])
      : [];

    if (!incomingItems.length) {
      throw new AppError(400, "Items are required");
    }

    const list = await GroceryList.findById(listId);
    const foundList = requireFound(list, "List not found", 404);

    if (incomingItems.length !== foundList.items.length) {
      throw new AppError(400, "Item count does not match the customer's list");
    }

    // Keep the customer's item names/quantities as the source of truth and
    // only take the price from the shopkeeper.
    const pricedItems: GroceryListItem[] = foundList.items.map(
      (existingItem: GroceryListItem, index: number) => {
        const price = Number(incomingItems[index]?.price ?? 0);

        if (Number.isNaN(price) || price < 0) {
          throw new AppError(400, "Each item price must be 0 or more");
        }

        const isAvailable = existingItem.available !== false;
        const rate = Number(
          incomingItems[index]?.rate ?? existingItem.rate ?? 0,
        );
        return {
          name: existingItem.name,
          quantity: existingItem.quantity,
          rate: Number.isFinite(rate) && rate > 0 ? rate : 0,
          // Out-of-stock items are never charged.
          price: isAvailable ? Math.round(price) : 0,
          available: isAvailable,
        };
      },
    );

    const totalAmount = pricedItems.reduce(
      (sum: number, item: GroceryListItem) => sum + item.price,
      0,
    );

    if (totalAmount < 1) {
      throw new AppError(400, "Total must be greater than 0");
    }

    foundList.set("items", pricedItems);
    foundList.totalAmount = totalAmount;
    foundList.status = "priced";
    foundList.pricedAt = new Date();
    foundList.seenByCustomer = false;

    await foundList.save();
    void recordAudit(req, "list.priced", {
      listId: String(foundList._id),
      detail: `total ₹${foundList.totalAmount}`,
    });

    // MUST be awaited: on Vercel serverless the function freezes as soon as
    // the response is sent, which would kill an un-awaited push mid-flight.
    // notifyUser never throws, so awaiting cannot fail the request.
    await notifyUser(
      foundList.user,
      "Your list is priced",
      `List #${String(foundList._id)
        .slice(-8)
        .toUpperCase()} — total ₹${totalAmount}. Tap to view.`,
      { listId: String(foundList._id) },
    );

    res.json(
      ok({
        items: await getAllGroceryLists(roleOf(req)),
      }),
    );
  }),
);

/**
 * `PATCH /admin/grocery-lists/:listId/status` — sets the packing status of a
 * list and tells the customer.
 *
 * @remarks
 * Auth: admin.
 *
 * Path: `listId`. Body: `{ status }`, which must be one of
 * {@link ALLOWED_STATUSES}. `received` and `priced` are rejected as invalid
 * here: pricing has its own route and nothing may return a list to
 * `received`.
 *
 * Gate: a list whose `totalAmount` is below 1 can only be moved to
 * `cancelled`, so an unpriced list cannot be marched through packing.
 * Nothing else enforces an order, so any allowed status may follow any other.
 *
 * `packedAt`, `readyAt` and `completedAt` are stamped the first time their
 * status is reached and are never overwritten, so a status set twice keeps
 * the original time. Cancelling stamps nothing.
 *
 * Answers with the whole collection, not the one list.
 *
 * Side effects: one DB write (`status`, possibly one timestamp, and
 * `seenByCustomer: false`). One Expo push titled `"Order #CODE"` with the
 * body taken from {@link statusNotification} — for example
 * `"Your order is ready — come and collect it!"`. Sent for every status
 * including `cancelled`.
 *
 * @throws AppError 400 `"List id is required"` when `:listId` is blank.
 * @throws AppError 400 `"Status is required"` when `status` is missing or
 * blank.
 * @throws AppError 400 `"Invalid status"` when `status` is outside the
 * allowed set.
 * @throws AppError 404 `"List not found"` when no list has that id.
 * @throws AppError 400 `"Price the list before moving it forward"` when the
 * list is unpriced and the target status is not `cancelled`.
 */
// Move a list along: packing -> packed -> ready -> completed
adminGroceryListRouter.patch(
  "/grocery-lists/:listId/status",
  requirePermission("lists:status"),
  asyncHandler(async (req: Request, res: Response) => {
    const listId = String(req.params.listId || "").trim();
    const status = String(
      req.body.status || "",
    ).trim() as AdminGroceryListStatus;

    requireText(listId, "List id is required");
    requireText(status, "Status is required");

    if (!ALLOWED_STATUSES.includes(status)) {
      throw new AppError(400, "Invalid status");
    }

    const list = await GroceryList.findById(listId);
    const foundList = requireFound(list, "List not found", 404);

    if (foundList.totalAmount < 1 && status !== "cancelled") {
      throw new AppError(400, "Price the list before moving it forward");
    }

    if (status === "packed" && !foundList.packedAt) {
      foundList.packedAt = new Date();
    }

    if (status === "ready" && !foundList.readyAt) {
      foundList.readyAt = new Date();
    }

    if (status === "completed" && !foundList.completedAt) {
      foundList.completedAt = new Date();
    }

    foundList.status = status as GroceryListStatus;
    // Any shop-side update should re-light the customer's badge.
    foundList.seenByCustomer = false;

    await foundList.save();
    void recordAudit(req, "list.status", {
      listId: String(foundList._id),
      detail: String(status),
    });

    // Awaited — see the note on the pricing route (Vercel serverless).
    await notifyUser(
      foundList.user,
      `Order #${String(foundList._id).slice(-8).toUpperCase()}`,
      statusNotification[status],
      { listId: String(foundList._id) },
    );

    res.json(
      ok({
        items: await getAllGroceryLists(roleOf(req)),
      }),
    );
  }),
);

/**
 * `PATCH /admin/grocery-lists/:listId/mark-paid` — records that the shop has
 * the money for a list.
 *
 * @remarks
 * Auth: admin.
 *
 * Path: `listId`. No body is read. This is a manual confirmation for cash and
 * direct UPI; an online Razorpay payment is confirmed on the customer's side
 * instead and does not come through here.
 *
 * Gate: the list must be priced (`totalAmount` ≥ 1). A list already marked
 * paid short-circuits — it answers 200 with the collection and writes
 * nothing, so the route is safe to call twice and the second call sends no
 * push.
 *
 * `paymentMethod` is only touched when it is still the `at_shop` default, in
 * which case it becomes `upi`; a method of `online` is left alone. Status is
 * not changed, so a paid list stays wherever it was in packing.
 *
 * Answers with the whole collection, not the one list.
 *
 * Side effects: one DB write (`paymentStatus: "paid"`, `paidAt`, possibly
 * `paymentMethod`, and `seenByCustomer: false`). One Expo push titled
 * `"Payment received"`.
 *
 * @throws AppError 400 `"List id is required"` when `:listId` is blank.
 * @throws AppError 404 `"List not found"` when no list has that id.
 * @throws AppError 400 `"Price the list before marking it paid"` when
 * `totalAmount` is below 1.
 */
// Shopkeeper confirms they received the payment (UPI / cash at shop).
// There's no automatic reconciliation for direct UPI, so the shop marks it.
adminGroceryListRouter.patch(
  "/grocery-lists/:listId/mark-paid",
  requirePermission("lists:markPaid"),
  asyncHandler(async (req: Request, res: Response) => {
    const listId = String(req.params.listId || "").trim();
    requireText(listId, "List id is required");

    const list = await GroceryList.findById(listId);
    const foundList = requireFound(list, "List not found", 404);

    if (foundList.totalAmount < 1) {
      throw new AppError(400, "Price the list before marking it paid");
    }

    if (foundList.paymentStatus === "paid") {
      res.json(ok({ items: await getAllGroceryLists(roleOf(req)) }));
      return;
    }

    foundList.paymentStatus = "paid";
    foundList.paidAt = new Date();
    // Keep whatever method was set; default to UPI if none chosen yet.
    if (foundList.paymentMethod === "at_shop") {
      foundList.paymentMethod = "upi";
    }
    foundList.seenByCustomer = false;

    await foundList.save();
    void recordAudit(req, "list.markPaid", {
      listId: String(foundList._id),
      detail: `₹${foundList.totalAmount} ${foundList.paymentMethod}`,
    });

    // Awaited — see the note on the pricing route (Vercel serverless).
    await notifyUser(
      foundList.user,
      "Payment received",
      `The shop confirmed payment for order #${String(foundList._id)
        .slice(-8)
        .toUpperCase()}.`,
      { listId: String(foundList._id) },
    );

    res.json(
      ok({
        items: await getAllGroceryLists(roleOf(req)),
      }),
    );
  }),
);

/**
 * `PATCH /admin/grocery-lists/:listId/items/:index/availability` — marks one
 * line of a list out of stock or back in stock.
 *
 * @remarks
 * Auth: admin.
 *
 * Path: `listId` and `index`, a zero-based position into the stored `items`
 * array that must be a non-negative integer within range. Body:
 * `{ available }`, read through `Boolean(...)`, so a missing field, `null`,
 * `0` or `""` all mean out of stock — there is no way to signal "leave it
 * alone".
 *
 * Marking a line unavailable zeroes its `price`; marking it available again
 * does not restore the old price, so the list has to be re-priced. The total
 * is recomputed from the available lines only. The line itself is never
 * removed, so the customer can still see what they asked for.
 *
 * No status gate: a completed or cancelled list can still be changed here,
 * unlike the item edit and item add routes.
 *
 * Answers with the whole collection, not the one list.
 *
 * Side effects: one DB write (`items`, `totalAmount`, `seenByCustomer:
 * false`). One Expo push titled `"Item not available · #CODE"`, sent only
 * when marking a line unavailable; restoring a line sends nothing.
 *
 * @throws AppError 400 `"List id is required"` when `:listId` is blank.
 * @throws AppError 400 `"Valid item index is required"` when `:index` is not
 * a non-negative integer.
 * @throws AppError 404 `"List not found"` when no list has that id.
 * @throws AppError 404 `"Item not found in this list"` when `:index` is past
 * the end of the array.
 */
// Mark one item out-of-stock / back-in-stock. An out-of-stock item stays on
// the list (so the customer sees it was requested) but is never charged, and
// the customer is notified.
adminGroceryListRouter.patch(
  "/grocery-lists/:listId/items/:index/availability",
  requirePermission("lists:availability"),
  asyncHandler(async (req: Request, res: Response) => {
    const listId = String(req.params.listId || "").trim();
    const index = Number(req.params.index);
    const available = Boolean(req.body.available);

    requireText(listId, "List id is required");
    if (!Number.isInteger(index) || index < 0) {
      throw new AppError(400, "Valid item index is required");
    }

    const list = await GroceryList.findById(listId);
    const foundList = requireFound(list, "List not found", 404);

    if (index >= foundList.items.length) {
      throw new AppError(404, "Item not found in this list");
    }

    const items: GroceryListItem[] = foundList.items.map(
      (item: GroceryListItem, i: number) => ({
        name: item.name,
        quantity: item.quantity,
        rate: item.rate ?? 0,
        // Out-of-stock → not charged; back-in-stock keeps its (re-priceable) 0.
        price: i === index && !available ? 0 : item.price,
        available: i === index ? available : item.available !== false,
      }),
    );

    foundList.set("items", items);
    foundList.totalAmount = items.reduce(
      (sum, item) => sum + (item.available ? item.price : 0),
      0,
    );
    foundList.seenByCustomer = false;
    await foundList.save();
    void recordAudit(req, "list.availability", {
      listId: String(foundList._id),
      detail: `item ${index + 1} ${available ? "in stock" : "out of stock"}`,
    });

    if (!available) {
      const code = String(foundList._id).slice(-8).toUpperCase();
      await notifyUser(
        foundList.user,
        `Item not available · #${code}`,
        `"${foundList.items[index].name}" is out of stock. The rest of your order is unaffected.`,
        { listId: String(foundList._id), type: "item_unavailable" },
      );
    }

    res.json(ok({ items: await getAllGroceryLists(roleOf(req)) }));
  }),
);

/**
 * `PATCH /admin/grocery-lists/:listId/items/:index` — rewrites the name or
 * quantity of one line.
 *
 * @remarks
 * Auth: admin.
 *
 * Path: `listId` and a zero-based `index` that must be a non-negative integer
 * within range. Body: `{ name?, quantity? }`; an omitted field keeps the
 * stored value, so a caller can send just one of the two.
 *
 * Both fields go through the grocery allowlist cleaner, which drops control,
 * zero-width and bidi characters and every special character outside
 * `. , & ' - / ( ) %` and `×`, keeps letters in any script including
 * Devanagari, collapses whitespace and truncates. `name` is capped at 60
 * characters and must still be at least 2 after cleaning; `quantity` is
 * capped at 12 and may end up empty. A non-string body value (an object or
 * array, such as an injection payload) cleans to `""`, so sending
 * `{ name: { $gt: "" } }` fails the length check rather than reaching Mongo.
 *
 * Gate: rejected once the list is `completed` or `cancelled`.
 *
 * `price`, `rate` and `available` are carried across untouched, so correcting
 * a name cannot change what the customer owes.
 *
 * Answers with the whole collection, not the one list.
 *
 * Side effects: one DB write (`items`, `seenByCustomer: false`). No push —
 * the customer sees the correction the next time they open the list. This is
 * the only mutation in the file that notifies nobody.
 *
 * @throws AppError 400 `"List id is required"` when `:listId` is blank.
 * @throws AppError 400 `"Valid item index is required"` when `:index` is not
 * a non-negative integer.
 * @throws AppError 404 `"List not found"` when no list has that id.
 * @throws AppError 400 `"This order is already closed"` when the list is
 * `completed` or `cancelled`.
 * @throws AppError 404 `"Item not found in this list"` when `:index` is past
 * the end of the array.
 * @throws AppError 400 `"Item name is required"` when the cleaned name is
 * empty.
 * @throws AppError 400 `"Item name is too short"` when the cleaned name is a
 * single character.
 */
// Shop edits an item's name / quantity — fix a typo, clarify a vague quantity,
// or correct what the customer sent. Price / rate / stock are preserved; the
// customer's badge re-lights so they see the change next time they open it.
adminGroceryListRouter.patch(
  "/grocery-lists/:listId/items/:index",
  requirePermission("lists:editItem"),
  asyncHandler(async (req: Request, res: Response) => {
    const listId = String(req.params.listId || "").trim();
    const index = Number(req.params.index);

    requireText(listId, "List id is required");
    if (!Number.isInteger(index) || index < 0) {
      throw new AppError(400, "Valid item index is required");
    }

    const list = await GroceryList.findById(listId);
    const foundList = requireFound(list, "List not found", 404);

    if (foundList.status === "cancelled" || foundList.status === "completed") {
      throw new AppError(400, "This order is already closed");
    }
    if (index >= foundList.items.length) {
      throw new AppError(404, "Item not found in this list");
    }

    const existing = foundList.items[index];
    const name = cleanField(req.body.name ?? existing.name, MAX_NAME_LEN, true);
    const quantity = cleanField(
      req.body.quantity ?? existing.quantity,
      MAX_QTY_LEN,
      true,
    );
    requireText(name, "Item name is required");
    if (name.length < MIN_NAME_LEN) {
      throw new AppError(400, "Item name is too short");
    }

    const items: GroceryListItem[] = foundList.items.map(
      (item: GroceryListItem, i: number) => ({
        name: i === index ? name : item.name,
        quantity: i === index ? quantity : item.quantity,
        rate: item.rate ?? 0,
        price: item.price,
        available: item.available !== false,
      }),
    );

    foundList.set("items", items);
    foundList.seenByCustomer = false;
    await foundList.save();
    void recordAudit(req, "list.itemEdited", {
      listId: String(foundList._id),
      detail: `item ${index + 1}`,
    });

    res.json(ok({ items: await getAllGroceryLists(roleOf(req)) }));
  }),
);

/**
 * `POST /admin/grocery-lists/:listId/items` — appends a line the customer
 * asked for outside the app.
 *
 * @remarks
 * Auth: admin.
 *
 * Path: `listId`. Body: `{ name, quantity }`, cleaned with the same grocery
 * allowlist and the same 60 / 12 character caps as the item edit route, and
 * `name` must survive cleaning at 2 characters or more. `quantity` may be
 * empty. Any `price`, `rate` or `available` sent in the body is ignored: the
 * new line always starts at `rate: 0, price: 0, available: true`, so the list
 * has to be re-priced before it can move forward.
 *
 * Gates: the list must not be `completed` or `cancelled`, and must hold fewer
 * than 100 items.
 *
 * Note the validation order — the name is checked before the list is loaded,
 * so a bad name on a non-existent list answers 400, not 404.
 *
 * Answers 200 with the whole collection, not 201 and not the new line.
 *
 * Side effects: one DB write (`items`, `totalItems`, `seenByCustomer:
 * false`). One Expo push titled `"Item added · #CODE"` naming the item, so
 * the customer learns of an addition they did not make.
 *
 * @throws AppError 400 `"List id is required"` when `:listId` is blank.
 * @throws AppError 400 `"Item name is required"` when the cleaned name is
 * empty.
 * @throws AppError 400 `"Item name is too short"` when the cleaned name is a
 * single character.
 * @throws AppError 404 `"List not found"` when no list has that id.
 * @throws AppError 400 `"This order is already closed"` when the list is
 * `completed` or `cancelled`.
 * @throws AppError 400 `"This list already has the maximum 100 items."` when
 * the list is full.
 */
// Shop adds an item the customer mentioned in person / on the phone / later.
adminGroceryListRouter.post(
  "/grocery-lists/:listId/items",
  requirePermission("lists:addItem"),
  asyncHandler(async (req: Request, res: Response) => {
    const listId = String(req.params.listId || "").trim();
    const name = cleanField(req.body.name, MAX_NAME_LEN, true);
    const quantity = cleanField(req.body.quantity, MAX_QTY_LEN, true);

    requireText(listId, "List id is required");
    requireText(name, "Item name is required");
    if (name.length < MIN_NAME_LEN) {
      throw new AppError(400, "Item name is too short");
    }

    const list = await GroceryList.findById(listId);
    const foundList = requireFound(list, "List not found", 404);

    if (foundList.status === "cancelled" || foundList.status === "completed") {
      throw new AppError(400, "This order is already closed");
    }

    if (foundList.items.length >= MAX_ITEMS_PER_LIST) {
      throw new AppError(
        400,
        `This list already has the maximum ${MAX_ITEMS_PER_LIST} items.`,
      );
    }

    const items: GroceryListItem[] = [
      ...foundList.items.map((it: GroceryListItem) => ({
        name: it.name,
        quantity: it.quantity,
        rate: it.rate ?? 0,
        price: it.price,
        available: it.available !== false,
      })),
      { name, quantity, rate: 0, price: 0, available: true },
    ];

    foundList.set("items", items);
    foundList.totalItems = items.length;
    foundList.seenByCustomer = false;
    await foundList.save();
    void recordAudit(req, "list.itemAdded", {
      listId: String(foundList._id),
      detail: String(name),
    });

    const code = String(foundList._id).slice(-8).toUpperCase();
    await notifyUser(
      foundList.user,
      `Item added · #${code}`,
      `The shop added "${name}" to your order.`,
      { listId: String(foundList._id), type: "item_added" },
    );

    res.json(ok({ items: await getAllGroceryLists(roleOf(req)) }));
  }),
);

/**
 * `GET /admin/grocery-lists/conversations` — one row per chat, newest
 * activity first, for the admin Messages page.
 *
 * @remarks
 * Auth: admin. No parameters are read.
 *
 * An aggregation over the `messages` collection: it groups by list, keeps the
 * newest message and the message count per list, and is capped at 100
 * conversations. That cap is not configurable and there is no paging, so a
 * busy shop cannot reach the 101st conversation from here.
 *
 * A group whose list has since been deleted is dropped, so `messageCount` is
 * a count of surviving messages for a surviving list. Because messages are
 * deleted by a TTL index thirty days after they are written, a quiet
 * conversation disappears from this response even though the list remains.
 *
 * Each row carries `customerName` and `customerPhone` with the same populated
 * fallbacks as {@link mapGroceryList}, but not `customerEmail` and none of
 * the money or item fields.
 *
 * This literal path is registered before `/grocery-lists/:listId/messages`,
 * and there is no `GET /grocery-lists/:listId`, so Express cannot mistake
 * `conversations` for a list id.
 *
 * Side effects: none.
 */
// All customer conversations (newest activity first) — for the admin Messages
// page, so the shop sees every chat in one place instead of order by order.
adminGroceryListRouter.get(
  "/grocery-lists/conversations",
  requirePermission("lists:chat"),
  asyncHandler(async (req: Request, res: Response) => {
    const grouped = await Message.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$groceryList",
          last: { $first: "$$ROOT" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "last.createdAt": -1 } },
      { $limit: 100 },
    ]);

    const lists = await GroceryList.find({
      _id: { $in: grouped.map((g) => g._id) },
    }).populate("user", "name email phone");

    const listById = new Map(lists.map((l) => [String(l._id), l]));

    const conversations = grouped
      .map((g) => {
        const l = listById.get(String(g._id));
        if (!l) return null;
        const listUser = l.user as unknown as {
          name?: string;
          email?: string;
          phone?: string;
        } | null;
        // Redacted for staff on the way out, exactly as a list is: this row
        // carries a phone number of its own and would otherwise be the one
        // place the customer's contact details still reached them.
        return conversationForRole({
          listId: String(l._id),
          code: String(l._id).slice(-8).toUpperCase(),
          customerName:
            l.customerName || listUser?.name || listUser?.email || "",
          customerPhone: l.customerPhone || listUser?.phone || "",
          status: l.status,
          messageCount: g.count,
          lastMessage: {
            text: g.last.text as string,
            sender: g.last.sender as "customer" | "staff",
            createdAt: g.last.createdAt as Date,
          },
        }, roleOf(req));
      })
      .filter((c) => c !== null);

    res.json(ok({ conversations }));
  }),
);

/**
 * `GET /admin/grocery-lists/:listId/messages` — the full conversation for one
 * list, oldest first.
 *
 * @remarks
 * Auth: admin.
 *
 * Path: `listId`. No query parameters: the whole conversation comes back
 * unpaginated, which is bounded in practice only by the thirty-day retention
 * on messages.
 *
 * Unlike the customer twin there is no ownership scope — any admin may read
 * any customer's chat. The list is loaded purely to answer 404 for an unknown
 * id; nothing from it appears in the response.
 *
 * Reading does not mark anything as seen, in either direction.
 *
 * Side effects: none.
 *
 * @throws AppError 400 `"List id is required"` when `:listId` is blank.
 * @throws AppError 404 `"List not found"` when no list has that id.
 */
// Chat: the shop reads the conversation for one list.
adminGroceryListRouter.get(
  "/grocery-lists/:listId/messages",
  requirePermission("lists:chat"),
  asyncHandler(async (req: Request, res: Response) => {
    const listId = String(req.params.listId || "").trim();
    requireText(listId, "List id is required");

    const list = await GroceryList.findById(listId);
    requireFound(list, "List not found", 404);

    const messages = await Message.find({ groceryList: listId }).sort({
      createdAt: 1,
    });

    res.json(ok({ messages: messages.map(mapMessage) }));
  }),
);

/**
 * `POST /admin/grocery-lists/:listId/messages` — the shop writes a chat
 * message on one list.
 *
 * @remarks
 * Auth: admin.
 *
 * Path: `listId`. Body: `{ text }`, trimmed, required, and at most 1000
 * characters — the same ceiling the schema enforces, so the 400 here is what
 * a caller sees rather than a validation 500. The text is not put through the
 * grocery allowlist cleaner: chat is free-form, so punctuation survives.
 *
 * `sender` is always `"staff"` and `senderName` is snapshotted from the
 * `SHOP_NAME` environment variable, falling back to `"Shop"`. Neither can be
 * set by the caller. The message is linked to the list's own customer, so an
 * admin cannot address it to anyone else. No status gate: a closed order can
 * still be replied to.
 *
 * Unlike the mutations above, this answers 201 with the single created
 * message, not the list collection.
 *
 * Side effects: one insert into `messages`, which the TTL index will delete
 * thirty days later. One Expo push titled `"Message from the shop · #CODE"`
 * carrying the message text as the body, so the whole message appears on the
 * customer's lock screen.
 *
 * @throws AppError 400 `"List id is required"` when `:listId` is blank.
 * @throws AppError 400 `"Message cannot be empty"` when `text` is missing or
 * whitespace.
 * @throws AppError 400 `"Message is too long"` when `text` exceeds 1000
 * characters.
 * @throws AppError 404 `"List not found"` when no list has that id.
 */
// Chat: the shop replies to the customer on one list. Pushes the reply to the
// customer's phone (they may not have the chat open).
adminGroceryListRouter.post(
  "/grocery-lists/:listId/messages",
  requirePermission("lists:chat"),
  asyncHandler(async (req: Request, res: Response) => {
    const listId = String(req.params.listId || "").trim();
    const text = String(req.body.text || "").trim();

    requireText(listId, "List id is required");
    requireText(text, "Message cannot be empty");
    if (text.length > 1000) {
      throw new AppError(400, "Message is too long");
    }

    const list = await GroceryList.findById(listId);
    const foundList = requireFound(list, "List not found", 404);

    const senderName = process.env.SHOP_NAME || "Shop";
    const message = await Message.create({
      groceryList: foundList._id,
      user: foundList.user,
      sender: "staff",
      senderName,
      text,
    });

    const code = String(foundList._id).slice(-8).toUpperCase();

    // The shop speaks to the customer with one voice, so the message itself
    // carries no name. The log is where it is recorded who actually typed it.
    void recordAudit(req, "list.chatSent", {
      listId: String(foundList._id),
      detail: text.slice(0, 60),
    });

    // Awaited — see the note on the pricing route (Vercel serverless).
    await notifyUser(
      foundList.user,
      `Message from the shop · #${code}`,
      text,
      { listId: String(foundList._id), type: "new_message" },
    );

    res.status(201).json(ok(mapMessage(message)));
  }),
);
