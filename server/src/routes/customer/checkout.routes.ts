/**
 * Card-and-UPI checkout for the product catalogue: turning the caller's cart
 * into an `Order` with a Razorpay order behind it, then confirming payment.
 *
 * @remarks
 * Mounted at `/customer` in `server/src/server.ts`, so the paths below are
 * `/customer/checkout/create-session` and `/customer/checkout/confirm`.
 *
 * `requireAuth` is applied to the whole router, so both routes need a
 * signed-in customer. Neither is public and neither is admin-only. Every
 * lookup is scoped by the caller's own user id.
 *
 * This is the catalogue checkout, not the grocery-list one. It is separate
 * from `grocery-list.routes.ts`, which handles its own Razorpay flow against
 * a `GroceryList`.
 *
 * Two things a caller cannot see from the signatures. First, prices are never
 * taken from the request: the cart is re-priced from the current `Product`
 * records on every call, so a stale or tampered client price is ignored.
 * Second, the work is split across the two routes — `create-session` writes
 * an order but reserves no stock, and `confirm` is where stock, the promo
 * count and the cart actually change.
 *
 * Neither route runs in a transaction. See the note on `confirm` for what
 * that costs.
 *
 * No shipped client calls either route, but both are live and both create
 * real Razorpay orders and mutate real stock.
 *
 * @see `docs/API.md` § 3.6 and § 7.2.
 *
 * @packageDocumentation
 */
import { Router, type Request, type Response } from "express";
import { Types } from "mongoose";
import { Product, ProductSize } from "../../models/Product";
import { getDbUserFromReq, requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { requireFound, requireText } from "../../utils/helpers";
import { User } from "../../models/User";
import { Cart } from "../../models/Cart";
import { AppError } from "../../utils/AppError";
import { Promo } from "../../models/Promo";
import { razorpay, toSubUnits } from "../../utils/razorpay";
import { Order } from "../../models/Order";
import { ok } from "../../utils/envelope";
import crypto from "crypto";

/**
 * One saved address as it arrives from the `addresses` sub-array of a lean
 * `users` document.
 *
 * @remarks
 * `phone` and any other address field on the schema are not modelled here,
 * because the handler only ever joins `address`, `state` and `postalCode`
 * into the delivery line and copies `fullName`.
 */
type UserAddressRow = {
  _id: Types.ObjectId;
  fullName: string;
  address: string;
  state: string;
  postalCode: string;
};

/**
 * The shape of the lean `users` document this file reads.
 *
 * @remarks
 * Mirrors the `.select("name email addresses")` projection exactly. `points`,
 * `phone`, `role`, `clerkUserId` and the push-token arrays are deliberately
 * absent: this router pays with Razorpay and never touches a points balance.
 *
 * `name` and `email` are optional because the record is created from a Clerk
 * session that may carry neither.
 */
type CheckoutUserRow = {
  _id: Types.ObjectId;
  name?: string;
  email?: string;
  addresses: UserAddressRow[];
};

/**
 * The lean `carts` document, narrowed to the `items` array.
 *
 * @remarks
 * `color` and `size` are carried here because the cart stores them, but this
 * router ignores both: neither reaches the order, which records only the
 * product and the quantity.
 */
type CartRow = {
  items: Array<{
    product: Types.ObjectId;
    quantity: number;
    color?: string;
    size?: ProductSize;
  }>;
};

/**
 * The four product fields pricing needs, from a lean `products` read.
 *
 * @remarks
 * Mirrors `.select("price salePercentage stock status")`. `title`, `images`,
 * `colors` and `sizes` are omitted because nothing on this path displays the
 * product; it only prices it and checks it can be sold.
 */
type ProductRow = {
  _id: Types.ObjectId;
  price: number;
  salePercentage: number;
  stock: number;
  status: "active" | "inactive";
};

/**
 * A promo code as read for validation.
 *
 * @remarks
 * Mirrors `.select("code percentage count minimumOrderValue startsAt
 * endsAt")`. `count` is the remaining number of uses, not the number already
 * used.
 */
type PromoRow = {
  code: string;
  percentage: number;
  count: number;
  minimumOrderValue: number;
  startsAt: Date;
  endsAt: Date;
};

export const customerCheckoutRouter = Router();

customerCheckoutRouter.use(requireAuth);

/**
 * `POST /customer/checkout/create-session` — prices the caller's cart, opens
 * a Razorpay order for the total and saves a pending `Order`.
 *
 * @remarks
 * Auth: signed-in customer. Body: `addressId` (required, must be one of the
 * caller's own saved addresses) and `promoCode` (optional, upper-cased before
 * lookup). Nothing else in the body is read — no prices, no quantities, no
 * item list.
 *
 * The cart is priced server-side. For each row the product must exist and be
 * `active`, and its `stock` must cover the quantity. `salePercentage` is
 * applied per unit and rounded to a whole rupee before multiplying by the
 * quantity, so the rounding is per unit rather than per line.
 *
 * A promo must be inside its `startsAt`/`endsAt` window and have `count` of
 * at least 1, and the subtotal must reach `minimumOrderValue`. The discount
 * is a rounded percentage of the subtotal, and the total is floored at 0. The
 * promo's `count` is **not** decremented here, so a code can be used to open
 * any number of sessions; it is only spent at `/checkout/confirm`.
 *
 * Stock is checked but not reserved. Between this call and `confirm` the same
 * stock can be sold to somebody else, and the second customer is the one who
 * fails.
 *
 * The saved `Order` snapshots the delivery name and a delivery line joined
 * from address, state and postal code, plus the promo and total. It stores
 * only `product` and `quantity` per item, so no unit price is kept and the
 * order cannot be re-costed later.
 *
 * The response returns `RAZORPAY_KEY_ID`, which is the publishable key and is
 * meant to reach the client.
 *
 * Every call opens a new order. Nothing supersedes or cancels an earlier
 * pending order for the same cart, so abandoned sessions accumulate.
 *
 * Side effects: creates an order at Razorpay, then writes one `orders`
 * document. A Razorpay SDK failure is not an `AppError` and surfaces as a
 * 500.
 *
 * @throws AppError 400 `"Address is required"` when `addressId` is blank.
 * @throws AppError 404 `"user not found"` when the caller's `users` record
 * cannot be read.
 * @throws AppError 404 `"Cart not found"` when the caller has no cart
 * document at all, which is distinct from having an empty one.
 * @throws AppError 400 `"Cart is empty"` when the cart holds no items.
 * @throws AppError 404 `"Address not found!!"` when `addressId` is not one of
 * the caller's addresses.
 * @throws AppError 400 `"One or more cart items are not avaibale"` (sic) when
 * a product is missing or not `active`.
 * @throws AppError 400 `"Cart items are out of stock"` when stock is below
 * the quantity wanted.
 * @throws AppError 404 `"Promo not found"` when the code does not exist.
 * @throws AppError 400 `"promo code is not active"` when the code is outside
 * its window or exhausted.
 * @throws AppError 400 `"Minimum order value for this promo is not at the
 * threesold"` (sic) when the subtotal is below the promo's minimum.
 */
customerCheckoutRouter.post(
  "/checkout/create-session",
  asyncHandler(async (req: Request, res: Response) => {
    const dbUser = await getDbUserFromReq(req);
    const addressId = String(req.body.addressId || "").trim();
    const promoCode = String(req.body.promoCode || "")
      .trim()
      .toUpperCase();

    requireText(addressId, "Address is required");

    //get user and cart info

    const [user, cart] = await Promise.all([
      User.findById(dbUser._id)
        .select("name email addresses")
        .lean<CheckoutUserRow | null>(),

      Cart.findOne({ user: dbUser._id }).select("items").lean<CartRow | null>(),
    ]);

    const foundUser = requireFound(user, "user not found", 404);
    const foundCart = requireFound(cart, "Cart not found", 404);

    if (!foundCart.items.length) {
      throw new AppError(400, "Cart is empty");
    }

    const selectedAddress = foundUser.addresses.find(
      (item) => String(item._id) === addressId,
    );

    if (!selectedAddress) {
      throw new AppError(404, "Address not found!!");
    }

    const products = await Product.find({
      _id: { $in: foundCart.items.map((item) => item.product) },
    })
      .select("price salePercentage stock status")
      .lean<ProductRow[]>();

    const productMap = new Map(
      products.map((item) => [String(item._id), item]),
    );

    let totalItems = 0;
    let subTotal = 0;

    const items = foundCart.items.map((cartItem) => {
      const product = productMap.get(String(cartItem.product));

      if (!product || product.status !== "active") {
        throw new AppError(400, "One or more cart items are not avaibale");
      }

      if (product.stock < cartItem.quantity) {
        throw new AppError(400, "Cart items are out of stock");
      }

      const finalPrice = product.salePercentage
        ? Math.round(
            product.price - (product.price * product.salePercentage) / 100,
          )
        : product.price;

      totalItems += cartItem.quantity;
      subTotal += finalPrice * cartItem.quantity;

      return {
        product: cartItem.product,
        quantity: cartItem.quantity,
      };
    });

    let appliedPromoCode = "";
    let discountAmount = 0;

    if (promoCode) {
      const promo = await Promo.findOne({ code: promoCode })
        .select("code percentage count minimumOrderValue startsAt endsAt")
        .lean<PromoRow | null>();

      const foundPromo = requireFound(promo, "Promo not found", 404);
      const now = new Date();

      if (
        now < foundPromo.startsAt ||
        now > foundPromo.endsAt ||
        foundPromo.count < 1
      ) {
        throw new AppError(400, "promo code is not active");
      }

      if (subTotal < foundPromo.minimumOrderValue) {
        throw new AppError(
          400,
          "Minimum order value for this promo is not at the threesold",
        );
      }

      appliedPromoCode = foundPromo.code;
      discountAmount = Math.round((subTotal * foundPromo.percentage) / 100);
    }

    const totalAmount = Math.max(subTotal - discountAmount, 0);

    const razorpayOrder = await razorpay.orders.create({
      amount: toSubUnits(totalAmount),
      currency: "INR",
      receipt: `Order_${Date.now()}`,
    });

    const deliveryAddress = [
      selectedAddress.address,
      selectedAddress.state,
      selectedAddress.postalCode,
    ]
      .filter(Boolean)
      .join(", ");

    const order = await Order.create({
      user: dbUser._id,
      customerName: foundUser.name || selectedAddress.fullName,
      customerEmail: foundUser.email || "",
      items,
      totalItems,
      deliveryName: selectedAddress.fullName,
      deliveryAddress,
      promoCode: appliedPromoCode,
      discountAmount,
      totalAmount,
      paymentStatus: "pending",
      orderStatus: "placed",
      razorpayOrderId: razorpayOrder.id,
    });

    res.json(
      ok({
        razorpay: {
          keyId: process.env.RAZORPAY_KEY_ID,
          orderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
        },
        order: {
          _id: String(order._id),
          totalItems,
          discountAmount,
          totalAmount,
        },
      }),
    );
  }),
);

/**
 * `POST /customer/checkout/confirm` — verifies the Razorpay callback, then
 * commits the sale: stock down, promo spent, cart emptied, order paid.
 *
 * @remarks
 * Auth: signed-in customer. Body requires `orderId`, `razorpay_payment_id`,
 * `razorpay_order_id` and `razorpay_signature`, all trimmed and non-empty.
 * The order is looked up scoped by the caller, so someone else's order
 * answers 404.
 *
 * Trust comes from the signature: the handler recomputes
 * `HMAC-SHA256("<order_id>|<payment_id>")` with `RAZORPAY_KEY_SECRET` and
 * compares it with the one sent. The order id must also match the
 * `razorpayOrderId` stored on the order. The comparison is plain string
 * equality, not a constant-time compare.
 *
 * Idempotent at the top: an already-paid order returns **200** with
 * `{ _id }` before any signature check or stock change, so a repeated
 * callback does not decrement stock twice.
 *
 * Each stock decrement is a conditional `updateOne` matching on
 * `stock >= quantity`, so a single item can never go negative.
 *
 * Not transactional, and the order of writes matters. Stock is decremented
 * item by item; if the third of five items no longer has stock the handler
 * throws, and the first two stay decremented. The order also stays
 * `pending` even though Razorpay has taken the money, and nothing refunds it
 * or restores the stock. The same gap applies to the promo decrement and the
 * cart clear, which run before the order is marked paid.
 *
 * The promo `count` is decremented conditionally on `count > 0`, and the
 * result is not checked — a promo exhausted in the meantime lets the order
 * through at the discounted price it was quoted.
 *
 * Side effects: per-item `$inc` on `products.stock`; a `$inc` on the promo's
 * `count`; the caller's cart items emptied; the order marked paid with
 * `paymentId` and `paidAt`. No notification of any kind is sent.
 *
 * @throws AppError 400 `"Order id is needed"` when `orderId` is blank.
 * @throws AppError 400 `"razorpayPaymentId is needed"` when
 * `razorpay_payment_id` is missing.
 * @throws AppError 400 `"razorpayOrderId is needed"` when
 * `razorpay_order_id` is missing.
 * @throws AppError 400 `"razorpaySignature is needed"` when
 * `razorpay_signature` is missing.
 * @throws AppError 404 `"Order not found"` when no such order belongs to the
 * caller.
 * @throws AppError 400 `"Order id mismatch"` when the Razorpay order id is
 * not the one stored on the order.
 * @throws AppError 400 `"Invalid payment signature"` when the HMAC does not
 * match.
 * @throws AppError 400 `"One or more cart items are out of stock"` when a
 * conditional stock decrement matches nothing; earlier items in the loop have
 * already been decremented by this point.
 */
customerCheckoutRouter.post(
  "/checkout/confirm",
  asyncHandler(async (req: Request, res: Response) => {
    const dbUser = await getDbUserFromReq(req);
    const orderId = String(req.body.orderId || "").trim();
    const razorpayPaymentId = String(req.body.razorpay_payment_id || "").trim();
    const razorpayOrderId = String(req.body.razorpay_order_id || "").trim();
    const razorpaySignature = String(req.body.razorpay_signature || "").trim();

    requireText(orderId, "Order id is needed");
    requireText(razorpayPaymentId, "razorpayPaymentId is needed");
    requireText(razorpayOrderId, "razorpayOrderId is needed");
    requireText(razorpaySignature, "razorpaySignature is needed");

    const order = await Order.findOne({ _id: orderId, user: dbUser._id });
    const foundOrder = requireFound(order, "Order not found", 404);

    if (foundOrder.paymentStatus === "paid") {
      res.json(ok({ _id: String(foundOrder._id) }));
      return;
    }

    if (foundOrder.razorpayOrderId !== razorpayOrderId) {
      throw new AppError(400, "Order id mismatch");
    }

    const signature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (signature !== razorpaySignature) {
      throw new AppError(400, "Invalid payment signature");
    }

    for (const item of foundOrder.items) {
      const updated = await Product.updateOne(
        {
          _id: item.product,
          stock: { $gte: item.quantity },
        },
        {
          $inc: { stock: -item.quantity },
        },
      );

      if (!updated.matchedCount) {
        throw new AppError(400, "One or more cart items are out of stock");
      }
    }

    if (foundOrder.promoCode) {
      await Promo.updateOne(
        {
          code: foundOrder.promoCode,
          count: { $gt: 0 },
        },
        {
          $inc: { count: -1 },
        },
      );
    }

    await Cart.updateOne({ user: dbUser._id }, { $set: { items: [] } });

    foundOrder.paymentStatus = "paid";
    foundOrder.paymentId = razorpayPaymentId;
    foundOrder.paidAt = new Date();
    await foundOrder.save();

    res.json(ok({ _id: String(foundOrder._id) }));
  }),
);
