/**
 * An order placed through the catalogue and cart, paid for up front.
 *
 * @remarks
 * The other, more used path through the shop is the hand-priced grocery list
 * - see GroceryList.ts. This one is the conventional e-commerce flow: pick
 * from the catalogue, apply a promo code, pay with Razorpay, then track
 * delivery.
 *
 * @packageDocumentation
 */
import mongoose, { HydratedDocument, model, Schema, Types } from "mongoose";

/**
 * Whether the money for an order arrived.
 *
 * @remarks
 * Moves to `paid` only once Razorpay's signature has been verified on the
 * server. `failed` is a payment that was attempted and refused; an order that
 * was simply never paid for stays `pending`.
 */
export type PaymentStatus = "pending" | "paid" | "failed";

/**
 * Where the goods have got to.
 *
 * @remarks
 * `placed` on creation, then `shipped` and `delivered` as the shop moves it
 * along, each stamping its date. `returned` is the end of an order that came
 * back. Nothing in the schema enforces the order of these.
 */
export type OrderStatus = "placed" | "shipped" | "delivered" | "returned";

/**
 * One line of an order.
 *
 * @remarks
 * Only the product and how many. No price is copied, so an order's lines
 * cannot be re-priced from the document itself - `totalAmount` on the order
 * is the record of what was charged.
 */
export type OrderItem = {
  product: Types.ObjectId;
  quantity: number;
};

/**
 * One order.
 *
 * @remarks
 * `customerName` and `customerEmail`, like `deliveryName` and
 * `deliveryAddress`, are copied onto the order, so a later change to the
 * customer's profile does not rewrite where a past order went.
 *
 * Money is in rupees: `discountAmount` is what the promo code took off and
 * `totalAmount` is what the customer was actually charged, after it.
 * `promoCode` is stored uppercase to match Promo.ts.
 *
 * `razorpayOrderId` is required, so an order row exists only once Razorpay
 * has been asked to take the money; `paymentId` arrives when it succeeds.
 */
export type Order = {
  user: Types.ObjectId;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  totalItems: number;
  deliveryName: string;
  deliveryAddress: string;
  promoCode?: string;
  discountAmount: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  razorpayOrderId: string;
  paymentId?: string;
  paidAt?: Date | null;
  deliveredAt?: Date | null;
  returnedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/** A saved order, as Mongoose hands it back. */
export type OrderDocument = HydratedDocument<Order>;

const OrderItemsSchema = new Schema<OrderItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,

      required: true,
      min: 1,
    },
  },
  { _id: false },
);

const OrderSchema = new Schema<Order>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    customerName: {
      type: String,
      default: "",
      trim: true,
    },
    customerEmail: {
      type: String,
      default: "",
      trim: true,
    },
    items: {
      type: [OrderItemsSchema],
      default: [],
    },
    totalItems: {
      type: Number,
      required: true,
      min: 1,
    },
    deliveryName: {
      type: String,
      required: true,
      trim: true,
    },
    deliveryAddress: {
      type: String,
      required: true,
      trim: true,
    },
    promoCode: {
      type: String,
      default: "",
      uppercase: true,
      trim: true,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    orderStatus: {
      type: String,
      enum: ["placed", "shipped", "delivered", "returned"],
      default: "placed",
    },
    razorpayOrderId: {
      type: String,
      required: true,
      trim: true,
    },
    paymentId: {
      type: String,
      default: "",
      trim: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    returnedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// The three ways an order is looked for, each newest-first: a customer's own
// orders, the shop's queue filtered by delivery status, and the same filtered
// by payment status. The sort field is last in each so the index serves the
// sort as well as the match.
OrderSchema.index({ user: 1, createdAt: -1 });
OrderSchema.index({ orderStatus: 1, createdAt: -1 });
OrderSchema.index({ paymentStatus: 1, createdAt: -1 });

/**
 * The Order model.
 *
 * @remarks
 * Resolved from `mongoose.models` first so a hot reload does not compile the
 * same model twice.
 */
export const Order =
  mongoose.models.Order || model<Order>("Order", OrderSchema);
