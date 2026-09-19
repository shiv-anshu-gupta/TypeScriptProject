/**
 * The shelves the catalogue is divided into.
 *
 * @remarks
 * A category is little more than a name and a picture; products point at one
 * through their `category` field. Small and rarely changed, so it carries no
 * index of its own beyond `_id`.
 *
 * @packageDocumentation
 */
import mongoose, { HydratedDocument } from "mongoose";

/**
 * One category.
 *
 * @remarks
 * The picture is optional and both its fields default to `""` - a category
 * with no image shows as a plain chip in the app. When one is set,
 * `imagePublicId` is the Cloudinary handle needed to delete it later.
 *
 * Names are not unique in the schema; nothing stops two categories being
 * called the same thing.
 */
export type Category = {
  name: string;
  imageUrl: string;
  imagePublicId: string;
  createdAt: Date;
  updatedAt: Date;
};

/** A saved category, as Mongoose hands it back. */
export type CategoryDocument = HydratedDocument<Category>;

const CategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // Optional category image shown in the mobile app's category rail/circles.
    imageUrl: {
      type: String,
      default: "",
      trim: true,
    },
    imagePublicId: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true },
);

/**
 * The Category model.
 *
 * @remarks
 * Resolved from `mongoose.models` first so a hot reload does not compile the
 * same model twice.
 *
 * Deleting a category does NOT touch the products that point at it - they are
 * left referencing an id that no longer resolves, and populate yields null.
 */
export const Category =
  mongoose.models.Category ||
  mongoose.model<Category>("Category", CategorySchema);
