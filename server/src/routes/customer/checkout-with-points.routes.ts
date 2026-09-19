/**
 * Paying for a catalogue order entirely from the loyalty points balance on
 * the caller's `users` record, plus reading that balance.
 *
 * @remarks
 * Mounted at `/customer` in `server/src/server.ts`, so the paths below are
 * `/customer/checkout/points` and `/customer/checkout/pay-with-points`.
 *
 * `requireAuth` is applied to the whole router, so both routes need a
 * signed-in customer. Neither is public and neither is admin-only. Both work
 * only on the caller's own balance and cart.
 *
 * Points are 1:1 with rupees: the order total in rupees is deducted from
 * `users.points` as it stands. There is no part payment — either the balance
 * covers the whole total or the call fails. No money and no Razorpay order is
 * involved, so the resulting order is written as already paid.
 *
 * Points are earned by returning a delivered order, which credits the full
 * `totalAmount` back (`orders.routes.ts`). Nothing in this router grants
 * them.
 *
 * `pay-with-points` repeats the pricing logic of
 * `checkout.routes.ts:create-session` line for line rather than sharing it,
 * so a change to the pricing or promo rules has to be made in both files.
 *
 * No shipped client calls either route, but both are live and
 * `pay-with-points` mutates real stock and real balances.
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
import { User } from "../../models/User";
import { requireFound, requireText } from "../../utils/helpers";
import { ok } from "../../utils/envelope";
import { Cart } from "../../models/Cart";
import { AppError } from "../../utils/AppError";
import { Promo } from "../../models/Promo";
import { Order } from "../../models/Order";

/**
 * One saved address as it arrives from the `addresses` sub-array of a lean
 * `users` document.
 *
 * @remarks
 * Only the fields the handler uses are modelled: `fullName` is copied to the
 * order, and `address`, `state` and `postalCode` are joined into the delivery
 * line. Every other address field is omitted.
 */
type UserAddressRow = {
  _id: Types.ObjectId;
  fullName: string;
  address: string;
  state: string;
  postalCode: string;
};

/**
 * The shape the lean `users` read is cast to in this file.
 *
 * @remarks
 * This type claims `points: number`, but the query it annotates selects only
 * `"name email addresses"`. The cast is therefore wider than the data: at
 * runtime `points` is `undefined` on the object, and the compiler cannot see
 * it. That is what makes the friendly pre-check in `pay-with-points`
 * unreachable. The balance is still protected by the conditional update that
 * follows it.
 *
 * `role`, `phone`, `clerkUserId` and the push-token arrays are omitted.
 */
type CheckoutUserRow = {
  _id: Types.ObjectId;
  name?: string;
  email?: string;
  points: number;
  addresses: UserAddressRow[];
};

/**
 * The lean `carts` document, narrowed to the `items` array.
 *
 * @remarks
 * `color` and `size` are present because the cart stores them, but this
 * router ignores both: the order records only the product and the quantity.
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
 * Mirrors `.select("price salePercentage stock status")`. Nothing display
 * related — `title`, `images`, `colors`, `sizes` — is read, because this path
 * only prices the product and checks it can be sold.
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
 * endsAt")`. `count` is the number of uses left, not the number already
 * taken.
 */
type PromoRow = {
  code: string;
  percentage: number;
  count: number;
  minimumOrderValue: number;
  startsAt: Date;
  endsAt: Date;
};

export const customerCheckoutWithPointsRouter = Router();

customerCheckoutWithPointsRouter.use(requireAuth);

/**
 * `GET /customer/checkout/points` — the caller's current loyalty points
 * balance.
 *
 * @remarks
 * Auth: signed-in customer. No query, path or body parameters are read. The
 * balance is always the caller's own; there is no way to ask for another
 * user's.
 *
 * The record is re-read rather than taken from the request, so the number is
 * current as of this call. It is coerced with `|| 0`, so a record with no
 * `points` field answers 0 rather than `null`.
 *
 * Points are rupees at 1:1, which is why no currency is returned.
 *
 * Side effects: none.
 *
 * @throws AppError 404 `"User not found"` when the caller's `users` record
 * cannot be read. Note the capital U; `pay-with-points` uses a lower-case
 * `"user not found"` for the same condition.
 */
customerCheckoutWithPointsRouter.get(
  "/checkout/points",
  asyncHandler(async (req: Request, res: Response) => {
    const dbUser = await getDbUserFromReq(req);

    const user = await User.findById(dbUser._id)
      .select("points")
      .lean<{ points: number } | null>();

    const foundUser = requireFound(user, "User not found", 404);

    res.json(
      ok({
        points: foundUser.points || 0,
      }),
    );
  }),
);

/**
 * `POST /customer/checkout/pay-with-points` — prices the caller's cart and
 * pays the whole total from their points balance, in one call.
 *
 * @remarks
 * Auth: signed-in customer. Body: `addressId` (required, must be one of the
 * caller's own saved addresses) and `promoCode` (optional, upper-cased before
 * lookup). No price, quantity or points amount is read from the body.
 *
 * Pricing is identical to `/customer/checkout/create-session`: products must
 * exist and be `active` with enough stock, `salePercentage` is applied and
 * rounded per unit, a promo must be inside its window with `count` of at
 * least 1 and the subtotal must reach `minimumOrderValue`, and the total is
 * floored at 0.
 *
 * It is all or nothing. The full total is deducted; there is no part payment
 * and no mixed payment with Razorpay. A total of 0, which a 100% promo can
 * produce, deducts nothing and still places the order.
 *
 * The balance is protected by a conditional `updateOne` matching on
 * `points >= totalAmount`, which is atomic and does hold under concurrent
 * calls.
 *
 * Known bug, left as it is: the friendly pre-check `totalAmount >
 * foundUser.points` can never fire, because the `users` read selects only
 * `"name email addresses"` and so `points` is `undefined` on the object.
 * Comparing a number with `undefined` is always false. Callers short of
 * points therefore get the identical message from the conditional update
 * instead, and the outcome is correct either way.
 *
 * Not transactional. Everything after the deduction runs inside a `try`, and
 * the `catch` credits the full total back before rethrowing. That covers the
 * points only: stock already decremented in the loop is **not** restored, and
 * an emptied cart is not refilled. So a mid-loop stock failure leaves the
 * caller with their points back but some products short.
 *
 * The order is written with `paymentStatus: "paid"` and a synthetic
 * `points_<timestamp>` value stored in both `razorpayOrderId` and
 * `paymentId`, which is how a points order is told apart from a Razorpay one
 * downstream. That value is a millisecond timestamp, not a unique id, and
 * nothing enforces uniqueness on it.
 *
 * The balance in the response is re-read after the order is created, so it
 * reflects the deduction.
 *
 * Side effects: conditional `$inc` deducting `users.points`; per-item `$inc`
 * on `products.stock`; a `$inc` on the promo's `count`, whose result is not
 * checked; the caller's cart items emptied; one `orders` document written; on
 * any failure after the deduction, a compensating `$inc` crediting the points
 * back. No notification of any kind is sent.
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
 * @throws AppError 400 `"Not enough points for this order"` when the
 * conditional deduction matches nothing. The identical message on the line
 * above it is the dead pre-check described in the remarks.
 * @throws AppError 400 `"One or more cart items are out of stock"` when a
 * conditional stock decrement matches nothing; the points are credited back
 * but earlier decrements in the loop are not.
 */
customerCheckoutWithPointsRouter.post(
  "/checkout/pay-with-points",
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

    if (totalAmount > foundUser.points) {
      throw new AppError(400, "Not enough points for this order");
    }

    const deductedUserPoints = await User.updateOne(
      {
        _id: dbUser._id,
        points: { $gte: totalAmount },
      },
      {
        $inc: { points: -totalAmount },
      },
    );

    if (!deductedUserPoints.matchedCount) {
      throw new AppError(400, "Not enough points for this order");
    }

    try {
      for (const item of items) {
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

      if (appliedPromoCode) {
        await Promo.updateOne(
          {
            code: appliedPromoCode,
            count: { $gt: 0 },
          },
          {
            $inc: { count: -1 },
          },
        );
      }

      await Cart.updateOne({ user: dbUser._id }, { $set: { items: [] } });

      const pointsPaymentId = `points_${Date.now()}`;

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
        paymentStatus: "paid",
        orderStatus: "placed",
        razorpayOrderId: pointsPaymentId,
        paymentId: pointsPaymentId,
        paidAt: new Date(),
      });

      const updatedUser = await User.findById(dbUser._id)
        .select("points")
        .lean<{ points: number } | null>();

      res.json(
        ok({
          _id: String(order._id),
          totalPoints: updatedUser?.points || 0,
        }),
      );
    } catch (error) {
      await User.updateOne(
        {
          _id: dbUser._id,
        },
        {
          $inc: { points: totalAmount },
        },
      );

      throw error;
    }
  }),
);
