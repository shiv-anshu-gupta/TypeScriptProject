import { Router, type Request, type Response } from "express";
import { requireAdmin } from "../../middleware/auth";
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
import { notifyUser } from "../../utils/push";

// What the customer's phone shows when the shop moves the list along.
const statusNotification: Record<AdminGroceryListStatus, string> = {
  packing: "The shop has started packing your order.",
  packed: "Your order is packed.",
  ready: "Your order is ready — come and collect it!",
  completed: "Your order is complete. Thank you!",
  cancelled: "Your order was cancelled by the shop.",
};

// Statuses the shopkeeper can move a list to (pricing is its own endpoint).
const ALLOWED_STATUSES = [
  "packing",
  "packed",
  "ready",
  "completed",
  "cancelled",
] as const;

type AdminGroceryListStatus = (typeof ALLOWED_STATUSES)[number];

type IncomingPricedItem = {
  name?: string;
  quantity?: string;
  rate?: number;
  price?: number;
};

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

async function getAllGroceryLists() {
  // Sort by last activity, not creation. When a customer sends a new list that
  // merges into an existing unpriced one, its items/updatedAt change but its
  // createdAt stays — so sorting by createdAt would bury a freshly re-sent
  // order at its old position. updatedAt bubbles active orders to the top.
  const lists = await GroceryList.find()
    .sort({ updatedAt: -1 })
    .populate("user", "name email phone");

  return lists.map(mapGroceryList);
}

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

adminGroceryListRouter.use(requireAdmin);

// All incoming lists (newest first)
adminGroceryListRouter.get(
  "/grocery-lists",
  asyncHandler(async (_req: Request, res: Response) => {
    res.json(
      ok({
        items: await getAllGroceryLists(),
      }),
    );
  }),
);

// Shopkeeper fills in a price per item -> list becomes "priced" and is
// sent back to the customer (seenByCustomer=false lights up their badge).
adminGroceryListRouter.patch(
  "/grocery-lists/:listId/prices",
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
        items: await getAllGroceryLists(),
      }),
    );
  }),
);

// Move a list along: packing -> packed -> ready -> completed
adminGroceryListRouter.patch(
  "/grocery-lists/:listId/status",
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

    // Awaited — see the note on the pricing route (Vercel serverless).
    await notifyUser(
      foundList.user,
      `Order #${String(foundList._id).slice(-8).toUpperCase()}`,
      statusNotification[status],
      { listId: String(foundList._id) },
    );

    res.json(
      ok({
        items: await getAllGroceryLists(),
      }),
    );
  }),
);

// Shopkeeper confirms they received the payment (UPI / cash at shop).
// There's no automatic reconciliation for direct UPI, so the shop marks it.
adminGroceryListRouter.patch(
  "/grocery-lists/:listId/mark-paid",
  asyncHandler(async (req: Request, res: Response) => {
    const listId = String(req.params.listId || "").trim();
    requireText(listId, "List id is required");

    const list = await GroceryList.findById(listId);
    const foundList = requireFound(list, "List not found", 404);

    if (foundList.totalAmount < 1) {
      throw new AppError(400, "Price the list before marking it paid");
    }

    if (foundList.paymentStatus === "paid") {
      res.json(ok({ items: await getAllGroceryLists() }));
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
        items: await getAllGroceryLists(),
      }),
    );
  }),
);

// Mark one item out-of-stock / back-in-stock. An out-of-stock item stays on
// the list (so the customer sees it was requested) but is never charged, and
// the customer is notified.
adminGroceryListRouter.patch(
  "/grocery-lists/:listId/items/:index/availability",
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

    if (!available) {
      const code = String(foundList._id).slice(-8).toUpperCase();
      await notifyUser(
        foundList.user,
        `Item not available · #${code}`,
        `"${foundList.items[index].name}" is out of stock. The rest of your order is unaffected.`,
        { listId: String(foundList._id), type: "item_unavailable" },
      );
    }

    res.json(ok({ items: await getAllGroceryLists() }));
  }),
);

// Shop edits an item's name / quantity — fix a typo, clarify a vague quantity,
// or correct what the customer sent. Price / rate / stock are preserved; the
// customer's badge re-lights so they see the change next time they open it.
adminGroceryListRouter.patch(
  "/grocery-lists/:listId/items/:index",
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
    const name = String(req.body.name ?? existing.name).trim();
    const quantity = String(req.body.quantity ?? existing.quantity).trim();
    requireText(name, "Item name is required");

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

    res.json(ok({ items: await getAllGroceryLists() }));
  }),
);

// Shop adds an item the customer mentioned in person / on the phone / later.
adminGroceryListRouter.post(
  "/grocery-lists/:listId/items",
  asyncHandler(async (req: Request, res: Response) => {
    const listId = String(req.params.listId || "").trim();
    const name = String(req.body.name || "").trim();
    const quantity = String(req.body.quantity || "").trim();

    requireText(listId, "List id is required");
    requireText(name, "Item name is required");

    const list = await GroceryList.findById(listId);
    const foundList = requireFound(list, "List not found", 404);

    if (foundList.status === "cancelled" || foundList.status === "completed") {
      throw new AppError(400, "This order is already closed");
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

    const code = String(foundList._id).slice(-8).toUpperCase();
    await notifyUser(
      foundList.user,
      `Item added · #${code}`,
      `The shop added "${name}" to your order.`,
      { listId: String(foundList._id), type: "item_added" },
    );

    res.json(ok({ items: await getAllGroceryLists() }));
  }),
);

// All customer conversations (newest activity first) — for the admin Messages
// page, so the shop sees every chat in one place instead of order by order.
adminGroceryListRouter.get(
  "/grocery-lists/conversations",
  asyncHandler(async (_req: Request, res: Response) => {
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
        return {
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
        };
      })
      .filter((c) => c !== null);

    res.json(ok({ conversations }));
  }),
);

// Chat: the shop reads the conversation for one list.
adminGroceryListRouter.get(
  "/grocery-lists/:listId/messages",
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

// Chat: the shop replies to the customer on one list. Pushes the reply to the
// customer's phone (they may not have the chat open).
adminGroceryListRouter.post(
  "/grocery-lists/:listId/messages",
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
