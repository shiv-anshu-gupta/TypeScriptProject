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
  price?: number;
};

function mapGroceryList(item: GroceryListDocument) {
  return {
    _id: String(item._id),
    code: String(item._id).slice(-8).toUpperCase(),
    customerName: item.customerName,
    customerEmail: item.customerEmail,
    items: item.items.map((listItem) => ({
      name: listItem.name,
      quantity: listItem.quantity,
      price: listItem.price,
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
  };
}

async function getAllGroceryLists() {
  const lists = await GroceryList.find().sort({ createdAt: -1 });

  return lists.map(mapGroceryList);
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

        return {
          name: existingItem.name,
          quantity: existingItem.quantity,
          price: Math.round(price),
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

    // Fire-and-forget: never let a push failure fail the shopkeeper's request.
    void notifyUser(
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

    void notifyUser(
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
