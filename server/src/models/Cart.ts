/**
 * A customer's basket in the catalogue side of the shop.
 *
 * @remarks
 * One cart per customer, kept between sessions. Separate from the grocery
 * list, which is the free-text route to the same shop - see GroceryList.ts.
 *
 * @packageDocumentation
 */
import mongoose, { HydratedDocument, model, Schema, Types } from "mongoose";
import { ProductSize } from "./Product";

/**
 * One line in the basket.
 *
 * @remarks
 * No price is stored. The product is referenced, so what the customer pays is
 * whatever the catalogue says at checkout, not what it said when they added
 * the item.
 *
 * `quantity` is at least 1 - removing a line deletes it rather than setting
 * zero. `color` and `size` are the chosen variant, absent for products that
 * have none.
 */
export type CartItem = {
  product: Types.ObjectId;
  quantity: number;
  color?: string;
  size?: ProductSize;
};

/**
 * One customer's basket.
 *
 * @remarks
 * `user` is unique, so a customer can only ever have one cart; the unique
 * index on it is also what every lookup uses.
 *
 * Items are embedded rather than a separate collection: a basket is small,
 * always read whole, and never queried across customers.
 */
export type Cart = {
  user: Types.ObjectId;
  items: CartItem[];
  createdAt: Date;
  updatedAt: Date;
};

/** A saved cart, as Mongoose hands it back. */
export type CartDocument = HydratedDocument<Cart>;

const cartItemSchema = new Schema<CartItem>(
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
    color: {
      type: String,
      trim: true,
    },
    size: {
      type: String,
      enum: ["S", "M", "L", "XL"],
    },
  },
  { _id: false },
);

const CartSchema = new Schema<Cart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
  },
  { timestamps: true },
);

/**
 * The Cart model.
 *
 * @remarks
 * Resolved from `mongoose.models` first so a hot reload does not compile the
 * same model twice. The value deliberately shares its name with the
 * {@link Cart} type - one is a value, the other a type, and TypeScript keeps
 * them apart.
 */
export const Cart = mongoose.models.Cart || model<Cart>("Cart", CartSchema);
