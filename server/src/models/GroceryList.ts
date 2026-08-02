import mongoose, { HydratedDocument, model, Schema, Types } from "mongoose";

// A customer writes a free-text grocery list (item + quantity, no price).
// The shopkeeper receives it, fills in a price per item, and sends it back.
// The customer then pays online or at the shop on pickup.
export type GroceryListStatus =
  | "received" // shop has the list, not priced yet
  | "priced" // shopkeeper filled prices + total, sent back
  | "packing"
  | "packed"
  | "ready" // come to receive
  | "completed"
  | "cancelled";

export type GroceryListPaymentMethod = "online" | "upi" | "at_shop";
export type GroceryListPaymentStatus = "pending" | "paid";

export type GroceryListItem = {
  name: string;
  quantity: string; // free text, e.g. "2 kg", "1 packet"
  price: number; // 0 until the shopkeeper prices it
};

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
  seenByCustomer: boolean; // drives the in-app notification badge
  note: string;
  pricedAt?: Date | null;
  packedAt?: Date | null;
  readyAt?: Date | null;
  completedAt?: Date | null;
  paidAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

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
    price: {
      type: Number,
      default: 0,
      min: 0,
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

GroceryListSchema.index({ user: 1, createdAt: -1 });
GroceryListSchema.index({ status: 1, createdAt: -1 });

export const GroceryList =
  mongoose.models.GroceryList ||
  model<GroceryList>("GroceryList", GroceryListSchema);
