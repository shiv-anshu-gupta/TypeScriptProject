import mongoose, { HydratedDocument, Schema, Types } from "mongoose";

export type ProductImage = {
  url: string;
  publicId: string;
  isCover: boolean;
};

export type ProductSize = "S" | "M" | "L" | "XL";
export type ProductStatus = "active" | "inactive";
export type ProductUnit =
  | "kg"
  | "g"
  | "litre"
  | "ml"
  | "piece"
  | "dozen"
  | "pack";

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

export const Product =
  mongoose.models.Product || mongoose.model<Product>("Product", ProductSchema);
