/**
 * The shop's view of the `orders` collection.
 *
 * @remarks
 * Mounted at `/admin` in `server/src/server.ts`, giving `GET /admin/orders`
 * and `PATCH /admin/orders/:orderId/status`.
 *
 * Both routes require an admin (`requireAdmin` is applied router-wide).
 *
 * These are cart-and-checkout orders, not grocery lists. The shop now runs on
 * grocery lists and the admin panel has no orders page, so no shipped client
 * reaches either route; they remain live, and the status change below still
 * moves stock.
 *
 * @packageDocumentation
 */
import { Router, type Request, type Response } from "express";
import { Types } from "mongoose";
import { Order, OrderStatus, PaymentStatus } from "../../models/Order";
import { requireAdmin } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/envelope";
import { requireFound, requireText } from "../../utils/helpers";
import { AppError } from "../../utils/AppError";
import { Product } from "../../models/Product";

/**
 * The order statuses an admin may set through this router.
 *
 * @remarks
 * The list is also the transition rule: any of the four may be set from any
 * other, in any order, so there is no enforced progression and an order can
 * be moved back to `placed` after delivery.
 */
const ALLOWED_ORDER_STATUSES = [
  "placed",
  "shipped",
  "delivered",
  "returned",
] as const;

type AdminOrderStatus = (typeof ALLOWED_ORDER_STATUSES)[number];

type AdminOrderRow = {
  _id: Types.ObjectId;
  customerName: string;
  customerEmail: string;
  totalItems: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  paidAt?: Date | null;
  deliveredAt?: Date | null;
  returnedAt?: Date | null;
  createdAt: Date;
};

export const adminOrderRouter = Router();

adminOrderRouter.use(requireAdmin);

/**
 * `GET /admin/orders` — every order in the collection, newest first.
 *
 * @remarks
 * Auth: admin. No parameters, no filter and no pagination, so every order
 * ever placed comes back in one response.
 *
 * Each row is a summary. The `items` array, the delivery address, the promo
 * and the Razorpay identifiers are deliberately omitted; `customerName` and
 * `customerEmail` are the snapshot taken when the order was placed, not a
 * live lookup on the user. `code` is derived here from the last eight
 * characters of the `_id` rather than being a stored field.
 *
 * Same row shape as `GET /customer/orders`, plus those two customer fields.
 *
 * Side effects: none.
 */
adminOrderRouter.get(
  "/orders",
  asyncHandler(async (req: Request, res: Response) => {
    const orders = await Order.find()
      .select(
        "customerName customerEmail totalItems totalAmount paymentStatus orderStatus  paidAt deliveredAt returnedAt createdAt",
      )
      .sort({ createdAt: -1 })
      .lean<AdminOrderRow[]>();

    res.json(
      ok({
        items: orders.map((orderItem) => ({
          _id: String(orderItem._id),
          code: String(orderItem._id).slice(-8).toUpperCase(),
          customerName: orderItem.customerName,
          customerEmail: orderItem.customerEmail,
          totalItems: orderItem.totalItems,
          totalAmount: orderItem.totalAmount,
          paymentStatus: orderItem.paymentStatus,
          orderStatus: orderItem.orderStatus,
          paidAt: orderItem.paidAt,
          deliveredAt: orderItem.deliveredAt,
          returnedAt: orderItem.returnedAt,
          createdAt: orderItem.createdAt,
        })),
      }),
    );
  }),
);

/**
 * `PATCH /admin/orders/:orderId/status` — moves one order to another status.
 *
 * @remarks
 * Auth: admin. Path parameter `orderId`. Body: `orderStatus`, which must be
 * one of `placed`, `shipped`, `delivered` or `returned`.
 *
 * Two statuses do more than set the field. Moving to `returned` restores
 * stock for every item, and is guarded against an order that is already
 * `returned` so the stock cannot be credited twice. Moving to `delivered`
 * stamps `deliveredAt`, but only the first time — a later re-delivery keeps
 * the original timestamp, which is what the customer's seven-day return
 * window is measured from.
 *
 * Unlike the customer's own return in `routes/customer/orders.routes.ts`,
 * this route does not credit `users.points`. The comment below describes the
 * intent; the points step is not implemented here.
 *
 * Nothing is sent to the customer: no push, and no Telegram message.
 *
 * Side effects: on a return, a `$inc` on `products.stock` for each item, one
 * at a time and not in a transaction; then one write to the order.
 *
 * @throws AppError 400 `"Order Id is required"` when the path parameter is
 * blank.
 * @throws AppError 400 `"orderStatus is required"` when the body field is
 * blank.
 * @throws AppError 400 `"Invalid order status"` when `orderStatus` is not one
 * of the four allowed values.
 * @throws AppError 404 `"Order not found"` when no order has that id.
 */
adminOrderRouter.patch(
  "/orders/:orderId/status",
  asyncHandler(async (req: Request, res: Response) => {
    const orderId = String(req.params.orderId || "").trim();
    const orderStatus = String(
      req.body.orderStatus || "",
    ).trim() as AdminOrderStatus;

    requireText(orderId, "Order Id is required");
    requireText(orderStatus, "orderStatus is required");

    if (!ALLOWED_ORDER_STATUSES.includes(orderStatus)) {
      throw new AppError(400, "Invalid order status");
    }

    const order = await Order.findById(orderId);
    const foundOrder = requireFound(order, "Order not found", 404);

    // admin can return order -> increase the product quantity
    // update returnedAt property
    // add the points to that user points

    if (orderStatus === "returned" && foundOrder.orderStatus !== "returned") {
      for (const item of foundOrder.items) {
        await Product.updateOne(
          { _id: item.product },
          {
            $inc: { stock: item.quantity },
          },
        );
      }
    }

    if (orderStatus === "delivered" && !foundOrder.deliveredAt) {
      foundOrder.deliveredAt = new Date();
    }

    foundOrder.orderStatus = orderStatus;
    await foundOrder.save();

    res.json(
      ok({
        _id: String(foundOrder._id),
        orderStatus: foundOrder.orderStatus,
        deliveredAt: foundOrder.deliveredAt,
        returnedAt: foundOrder.returnedAt,
      }),
    );
  }),
);
