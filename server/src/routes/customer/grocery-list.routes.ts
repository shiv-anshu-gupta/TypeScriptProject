import { Router, type Request, type Response } from "express";
import crypto from "crypto";
import { getDbUserFromReq, requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/envelope";
import { requireFound, requireText } from "../../utils/helpers";
import { AppError } from "../../utils/AppError";
import {
  GroceryList,
  GroceryListDocument,
  GroceryListItem,
} from "../../models/GroceryList";
import { razorpay, toSubUnits } from "../../utils/razorpay";
import { notifyAdmins } from "../../utils/webPush";

type IncomingItem = {
  name?: string;
  quantity?: string;
};

// Normalise an Indian mobile number to 10 digits (strips +91 / leading 0 /
// spaces). Returns "" if it isn't a valid mobile.
function normalizeMobile(raw: unknown): string {
  let d = String(raw || "").replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : "";
}

function mapGroceryList(item: GroceryListDocument) {
  return {
    _id: String(item._id),
    code: String(item._id).slice(-8).toUpperCase(),
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

export const customerGroceryListRouter = Router();

customerGroceryListRouter.use(requireAuth);

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

    const incomingItems = Array.isArray(req.body.items)
      ? (req.body.items as IncomingItem[])
      : [];

    const note = String(req.body.note || "").trim();

    // Keep only rows the customer actually filled in.
    const items = incomingItems
      .map((item) => ({
        name: String(item.name || "").trim(),
        quantity: String(item.quantity || "").trim(),
        price: 0,
      }))
      .filter((item) => item.name.length > 0);

    if (!items.length) {
      throw new AppError(400, "Add at least one item to your list");
    }

    // If the customer already has a list the shop hasn't touched yet
    // (status "received" — same stage a new submission starts in), merge the
    // new items into it instead of opening a parallel order. Lists that were
    // already priced/packed are never merged: their quote would go stale.
    const mergeTarget = await GroceryList.findOne({
      user: dbUser._id,
      status: "received",
      paymentStatus: "pending",
    }).sort({ createdAt: -1 });

    if (mergeTarget) {
      const mergedItems = [
        ...mergeTarget.items.map((item: GroceryListItem) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price,
        })),
        ...items,
      ];

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

    res
      .status(201)
      .json(ok({ ...mapGroceryList(groceryList), merged: false }));
  }),
);

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
