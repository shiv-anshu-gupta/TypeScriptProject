/**
 * The shop's catalogue.
 *
 * @remarks
 * Products are what the Shop tab lists and what a cart and an order refer to.
 * A grocery list does not use them at all - it is free text.
 *
 * Pictures are stored at their uploaded address and resized in the URL on the
 * way out; see utils/cloudinary.ts and utils/productImages.ts.
 *
 * @packageDocumentation
 */
import mongoose, { HydratedDocument, Schema, Types } from "mongoose";

/**
 * One picture of a product.
 *
 * @remarks
 * `url` is the Cloudinary delivery address as uploaded, without any
 * transformation - `cdnImage` adds one per request. `publicId` is the handle
 * that can delete it.
 *
 * `isCover` marks the one shown in listings. Nothing here enforces that
 * exactly one image carries it.
 */
export type ProductImage = {
  url: string;
  publicId: string;
  isCover: boolean;
};

/** Clothing sizes, for products that have them. */
export type ProductSize = "S" | "M" | "L" | "XL";

/**
 * Whether a product is on sale.
 *
 * @remarks
 * `inactive` hides it from customers without deleting it, so its history in
 * past orders stays intact. Every customer-facing query filters on this,
 * which is why it leads all three indexes below.
 */
export type ProductStatus = "active" | "inactive";

/**
 * How a product is measured.
 *
 * @remarks
 * Paired with `unitValue` to describe one sellable item - see the note there.
 */
export type ProductUnit =
  | "kg"
  | "g"
  | "litre"
  | "ml"
  | "piece"
  | "dozen"
  | "pack";

/**
 * One product. Notes on individual fields are beside the fields.
 *
 * @remarks
 * There is no price field. Money is settled per order - on a grocery list by
 * the shopkeeper pricing each line, and on a catalogue order by the total
 * recorded at checkout.
 *
 * `stock` is a plain count and is not decremented by this model; whether an
 * order reduces it is the routes' business.
 *
 * `colors` and `sizes` are the variants offered, and may both be empty - a
 * bag of rice has neither.
 */
export type Product = {
  title: string;
  description: string;
  category: Types.ObjectId;
  brand: string;
  stock: number;
  images: ProductImage[];
  colors: string[];
  sizes: ProductSize[];
  unit: ProductUnit;
  // How much of `unit` makes one sellable item, e.g. a 10 kg bag => unitValue 10,
  // unit "kg". Loose items sold by the unit keep the default of 1.
  unitValue: number;
  status: ProductStatus;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * A saved product, as Mongoose hands it back.
 *
 * @remarks
 * What `sizedProduct` (utils/productImages.ts) takes, on the way out to a
 * client.
 */
export type ProductDocument = HydratedDocument<Product>;

const productImageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    publicId: {
      type: String,
      required: true,
      trim: true,
    },
    isCover: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  },
);

const ProductSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
    },
    images: {
      type: [productImageSchema],
      default: [],
    },
    colors: {
      type: [String],
      default: [],
    },
    sizes: {
      type: [String],
      default: [],
      enum: ["S", "M", "L", "XL"],
    },
    unit: {
      type: String,
      enum: ["kg", "g", "litre", "ml", "piece", "dozen", "pack"],
      default: "piece",
    },
    unitValue: {
      type: Number,
      default: 1,
      min: 0,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// Every catalogue query filters on `status` and sorts by `createdAt`, and
// without these the database reads the WHOLE collection and sorts it in
// memory for each one - measured on the live data: `keysExamined: 0`, a
// COLLSCAN feeding a blocking SORT. That is survivable at 84 products and is
// not at a few thousand.
//
// The first two are both needed: an index on (status, category, createdAt)
// cannot serve a plain (status) query sorted by date, because within it dates
// are only ordered inside each category.
ProductSchema.index({ status: 1, createdAt: -1 });
ProductSchema.index({ status: 1, category: 1, createdAt: -1 });
ProductSchema.index({ status: 1, brand: 1, createdAt: -1 });

/**
 * The Product model.
 *
 * @remarks
 * Resolved from `mongoose.models` first so a hot reload does not compile the
 * same model twice.
 *
 * Prefer deactivating a product to deleting it: carts and past orders hold
 * its id, and a deleted one populates as null.
 */
export const Product =
  mongoose.models.Product || mongoose.model<Product>("Product", ProductSchema);
