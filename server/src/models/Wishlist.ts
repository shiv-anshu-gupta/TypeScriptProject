/**
 * Products a customer has saved for later.
 *
 * @remarks
 * One wishlist per customer, alongside their cart - see Cart.ts. Handled
 * together in routes/customer/cart-wishlist.routes.ts.
 *
 * @packageDocumentation
 */
import mongoose, { HydratedDocument, model, Schema, Types } from "mongoose";

/**
 * One customer's saved products.
 *
 * @remarks
 * Just references, with no quantity or variant - a wishlist records interest,
 * not an intention to buy a particular one.
 *
 * `user` is unique, so a customer has at most one. Nothing stops the same
 * product appearing twice; the routes are what keep the list distinct.
 *
 * A product that is later deleted leaves an id here that populates as null.
 */
export type Wishlist = {
  user: Types.ObjectId;
  products: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
};

/** A saved wishlist, as Mongoose hands it back. */
export type WishlistDocument = HydratedDocument<Wishlist>;

const wishlistSchema = new Schema<Wishlist>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    products: {
      type: [
        {
          type: Schema.Types.ObjectId,
          ref: "Product",
        },
      ],
      default: [],
    },
  },
  { timestamps: true },
);

/**
 * The Wishlist model.
 *
 * @remarks
 * Resolved from `mongoose.models` first so a hot reload does not compile the
 * same model twice. The unique index on `user` is also the only one a lookup
 * needs.
 */
export const Wishlist =
  mongoose.models.Wishlist || model<Wishlist>("Wishlist", wishlistSchema);
