/**
 * Discount codes for catalogue orders.
 *
 * @remarks
 * Created by the shop in routes/admin/promo.routes.ts and applied at checkout.
 * Grocery lists are priced by hand and do not use these.
 *
 * @packageDocumentation
 */
import mongoose, { HydratedDocument, model, Schema } from "mongoose";

/**
 * One discount code.
 *
 * @remarks
 * - `code` is unique and stored uppercase, so a customer typing it in any
 *   case matches. The unique index is what stops two codes colliding.
 * - `percentage` is 1-100, enforced by the schema; there is no flat-amount
 *   discount.
 * - `count` is how many uses remain, at least 1 - the checkout route is what
 *   decrements it, not this model.
 * - `minimumOrderValue` is in rupees, the subtotal the order must reach
 *   before the code applies.
 * - `startsAt` and `endsAt` are both required, so every code has a window;
 *   whether that window is checked is the checkout route's business, not the
 *   schema's.
 */
export type Promo = {
  code: string;
  percentage: number;
  count: number;
  minimumOrderValue: number;
  startsAt: Date;
  endsAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

/** A saved promo, as Mongoose hands it back. */
export type PromoDocument = HydratedDocument<Promo>;

const PromoSchema = new Schema<Promo>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    percentage: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    count: {
      type: Number,
      required: true,
      min: 1,
    },
    minimumOrderValue: {
      type: Number,
      required: true,
      min: 0,
    },
    startsAt: {
      type: Date,
      required: true,
    },
    endsAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true },
);

/**
 * The Promo model.
 *
 * @remarks
 * Resolved from `mongoose.models` first so a hot reload does not compile the
 * same model twice.
 *
 * `code` being unique gives it an index, which is also the one every lookup
 * uses - a code is only ever fetched by its own text.
 */
export const Promo =
  mongoose.models.Promo || model<Promo>("Promo", PromoSchema);
