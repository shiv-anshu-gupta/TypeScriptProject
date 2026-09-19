/**
 * The shop's main order: a free-text grocery list, priced by hand.
 *
 * @remarks
 * A customer writes a free-text grocery list (item + quantity, no price).
 * The shopkeeper receives it, fills in a price per item, and sends it back.
 * The customer then pays online or at the shop on pickup.
 *
 * This is the path most customers take, rather than the catalogue and cart.
 * Handled by routes/customer/grocery-list.routes.ts and
 * routes/admin/grocery-list.routes.ts; the conversation about a list lives in
 * Message.ts.
 *
 * @packageDocumentation
 */
import mongoose, { HydratedDocument, model, Schema, Types } from "mongoose";

/**
 * Where a list has got to. The meaning of each value is beside it.
 *
 * @remarks
 * Normal progression is received - priced - packing - packed - ready -
 * completed, with `cancelled` reachable from anywhere. Nothing in the schema
 * enforces the order; the admin routes decide which move is offered, and each
 * step stamps its own `...At` date.
 *
 * `priced` is the one the customer is waiting for: it is when a total exists
 * and payment becomes possible.
 */
export type GroceryListStatus =
  | "received" // shop has the list, not priced yet
  | "priced" // shopkeeper filled prices + total, sent back
  | "packing"
  | "packed"
  | "ready" // come to receive
  | "completed"
  | "cancelled";

/**
 * How the customer chose to pay.
 *
 * @remarks
 * `online` is a Razorpay order; `upi` is a direct transfer to the shop;
 * `at_shop` is cash or card on collection and is the default, since that is
 * what most customers do.
 */
export type GroceryListPaymentMethod = "online" | "upi" | "at_shop";

/**
 * Whether the money has arrived.
 *
 * @remarks
 * Only ever set to `paid` by the server, after Razorpay's signature has been
 * verified or the shopkeeper has confirmed payment at the counter - never on
 * the client's word.
 */
export type GroceryListPaymentStatus = "pending" | "paid";

/**
 * One line of the list.
 *
 * @remarks
 * `name` and `quantity` are the customer's own words - `quantity` is free
 * text ("2 kg", "1 packet") rather than a number, because that is how people
 * write a list and forcing units would slow them down.
 *
 * `rate` and `price` are in rupees and both start at 0; the shopkeeper fills
 * them in when pricing. `price` is the line total and is what sums to the
 * list's `totalAmount`.
 *
 * `available` false is the shop saying it is out of stock. The line stays on
 * the list so the customer can see what they will not be getting.
 *
 * Every name and quantity here has been through utils/sanitizeItem.ts,
 * whether it was typed or read off a photograph.
 */
export type GroceryListItem = {
  name: string;
  quantity: string; // free text, e.g. "2 kg", "1 packet"
  rate?: number; // optional per-unit price (₹ per piece/kg/box)
  price: number; // line total (0 until the shopkeeper prices it)
  available: boolean; // false = shop marked it out of stock
};

// A list holds no photos. A customer may photograph their handwritten paper,
// but that photo is read into items the moment it is taken and then thrown
// away - so what is stored is the text they checked, never the image.

/**
 * One list. Notes on individual fields are beside the fields.
 *
 * @remarks
 * `customerName`, `customerEmail` and `customerPhone` are copied onto the
 * list rather than read through `user`, so the shop still has the details it
 * was given at the time even if the customer later changes them.
 *
 * `totalAmount` stays 0 until the shopkeeper prices the list, so it cannot be
 * read as "free" - `status` says whether it means anything yet.
 *
 * Items are capped at `MAX_ITEMS_PER_LIST` (utils/sanitizeItem.ts), enforced
 * by the routes when adding to an existing list, not by this schema.
 *
 * The `...At` dates are stamps, written once when the list reaches that step
 * and left alone afterwards.
 */
export type GroceryList = {
  user: Types.ObjectId;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: GroceryListItem[];
  totalItems: number;
  totalAmount: number; // 0 until priced
  status: GroceryListStatus;
  paymentMethod: GroceryListPaymentMethod;
  paymentStatus: GroceryListPaymentStatus;
  razorpayOrderId: string;
  paymentId: string;
  // Drives the in-app notification badge. Set false by every admin change
  // that the customer should look at (routes/admin/grocery-list.routes.ts),
  // and back to true when they open the list.
  seenByCustomer: boolean;
  note: string;
  pricedAt?: Date | null;
  packedAt?: Date | null;
  readyAt?: Date | null;
  completedAt?: Date | null;
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/** A saved list, as Mongoose hands it back. */
export type GroceryListDocument = HydratedDocument<GroceryList>;

const GroceryListItemSchema = new Schema<GroceryListItem>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: String,
      default: "",
      trim: true,
    },
    rate: {
      type: Number,
      default: 0,
      min: 0,
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    available: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false },
);

const GroceryListSchema = new Schema<GroceryList>(
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
    customerPhone: {
      type: String,
      default: "",
      trim: true,
    },
    items: {
      type: [GroceryListItemSchema],
      default: [],
    },
    totalItems: {
      type: Number,
      required: true,
      min: 1,
    },
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        "received",
        "priced",
        "packing",
        "packed",
        "ready",
        "completed",
        "cancelled",
      ],
      default: "received",
    },
    paymentMethod: {
      type: String,
      enum: ["online", "upi", "at_shop"],
      default: "at_shop",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
    razorpayOrderId: {
      type: String,
      default: "",
      trim: true,
    },
    paymentId: {
      type: String,
      default: "",
      trim: true,
    },
    seenByCustomer: {
      type: Boolean,
      default: true, // true at creation; set false when the shop updates it
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
    pricedAt: {
      type: Date,
      default: null,
    },
    packedAt: {
      type: Date,
      default: null,
    },
    readyAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// The two ways a list is ever looked for, each newest-first:
//   (user, createdAt)   - a customer opening their own orders
//   (status, createdAt) - the shop's queue, filtered to one status
// Both put the sort field last so the index satisfies the sort as well as the
// match, and the database never has to order the results itself.
GroceryListSchema.index({ user: 1, createdAt: -1 });
GroceryListSchema.index({ status: 1, createdAt: -1 });

/**
 * The GroceryList model.
 *
 * @remarks
 * Resolved from `mongoose.models` first so a hot reload does not compile the
 * same model twice.
 *
 * Lists are never deleted - a cancelled one keeps its `cancelled` status, so
 * the shop's history stays whole.
 */
export const GroceryList =
  mongoose.models.GroceryList ||
  model<GroceryList>("GroceryList", GroceryListSchema);
