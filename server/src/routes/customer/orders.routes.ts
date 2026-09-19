/**
 * A customer's own `Order` documents, and the return they can start on one.
 *
 * @remarks
 * Mounted at `/customer` in `server/src/server.ts`, giving
 * `GET /customer/orders` and `PATCH /customer/orders/:orderId/return`.
 *
 * Both routes require a signed-in customer (`requireAuth` is applied
 * router-wide), and both queries are scoped by `user`, so one customer can
 * never read or return another's order.
 *
 * These are the `orders` collection — the cart-and-checkout flow — not
 * grocery lists. The shop now runs on grocery lists, and the admin dashboard
 * counts those instead, so no shipped client reaches these two routes. They
 * remain live, and the return below still moves stock and points.
 *
 * @packageDocumentation
 */
import { Router, type Response, type Request } from "express";
import { Types } from "mongoose";
import { Order, OrderStatus, PaymentStatus } from "../../models/Order";
import { getDbUserFromReq, requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { ok } from "../../utils/envelope";
import { requireFound, requireText } from "../../utils/helpers";
import { AppError } from "../../utils/AppError";
import { Product } from "../../models/Product";
import { User } from "../../models/User";

type CustomerOrderRow = {
  _id: Types.ObjectId;
  totalItems: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  paidAt?: Date | null;
  deliveredAt?: Date | null;
  returnedAt?: Date | null;
  createdAt: Date;
};

export const customerOrderRouter = Router();

customerOrderRouter.use(requireAuth);

/**
 * `GET /customer/orders` — the caller's own orders, newest first.
 *
 * @remarks
 * Auth: signed-in customer. No parameters and no pagination, so every order
 * the customer has ever placed comes back in one response.
 *
 * Each row is a summary: the per-item `items` array, the delivery address,
 * the promo and the Razorpay identifiers are deliberately omitted. `code` is
 * derived here — the last eight characters of the `_id`, upper-cased — and is
 * the human reference shown to the customer rather than a stored field.
 *
 * Side effects: none, beyond the create-on-demand user write.
 */
customerOrderRouter.get(
  "/orders",
  asyncHandler(async (req: Request, res: Response) => {
    const dbUser = await getDbUserFromReq(req);

    const orders = await Order.find({ user: dbUser._id })
      .select(
        "totalItems totalAmount paymentStatus orderStatus  paidAt deliveredAt returnedAt createdAt",
      )
      .sort({ createdAt: -1 })
      .lean<CustomerOrderRow[]>();

    res.json(
      ok({
        items: orders.map((orderItem) => ({
          _id: String(orderItem._id),
          code: String(orderItem._id).slice(-8).toUpperCase(),
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
 * `PATCH /customer/orders/:orderId/return` — returns a delivered order,
 * restoring its stock and crediting the customer with points.
 *
 * @remarks
 * Auth: signed-in customer. Path parameter `orderId`; no body is read.
 *
 * Two gates: the order must be `delivered` and carry a `deliveredAt`, and
 * that timestamp must be within seven days. Both are checked against the
 * stored order, not against anything the caller sends.
 *
 * The points credit is the full `totalAmount` of the order, in rupees, added
 * to `users.points`.
 *
 * There is no idempotency guard beyond the status check. It holds because the
 * order is moved to `returned` at the end, so a second call fails the
 * `delivered` test — but two requests racing each other can both pass the
 * gate and credit the points twice.
 *
 * Side effects: a `$inc` on `products.stock` for each item, one at a time and
 * not in a transaction; a `$inc` on `users.points`; and the order saved as
 * `returned` with `returnedAt` stamped. Nothing is sent to the shop — no
 * push, and no Telegram message.
 *
 * @throws AppError 400 `"Order Id is required"` when the path parameter is
 * blank.
 * @throws AppError 404 `"Order not found"` when no order with that id belongs
 * to the caller.
 * @throws AppError 400 `"Only delivered orders can be returned"` when the
 * order is in any other status, or has no `deliveredAt`.
 * @throws AppError 400 `"Return window expired"` more than seven days after
 * delivery.
 */
customerOrderRouter.patch(
  "/orders/:orderId/return",
  asyncHandler(async (req: Request, res: Response) => {
    const dbUser = await getDbUserFromReq(req);
    const orderId = String(req.params.orderId || "").trim();

    requireText(orderId, "Order Id is required");

    const order = await Order.findOne({ _id: orderId, user: dbUser._id });

    const foundOrder = requireFound(order, "Order not found", 404);

    if (foundOrder.orderStatus !== "delivered" || !foundOrder.deliveredAt) {
      throw new AppError(400, "Only delivered orders can be returned");
    }

    const sevenDaysReturnWindowTime = 7 * 24 * 60 * 60 * 1000;

    if (
      Date.now() - new Date(foundOrder.deliveredAt).getTime() >
      sevenDaysReturnWindowTime
    ) {
      throw new AppError(400, "Return window expired");
    }

    for (const item of foundOrder.items) {
      await Product.updateOne(
        { _id: item.product },
        { $inc: { stock: item.quantity } },
      );
    }

    await User.updateOne(
      { _id: dbUser._id },
      {
        $inc: { points: foundOrder.totalAmount },
      },
    );

    foundOrder.orderStatus = "returned";
    foundOrder.returnedAt = new Date();
    await foundOrder.save();

    res.json(
      ok({
        _id: String(foundOrder._id),
        orderStatus: foundOrder.orderStatus,
        returnedAt: foundOrder.returnedAt,
      }),
    );
  }),
);
