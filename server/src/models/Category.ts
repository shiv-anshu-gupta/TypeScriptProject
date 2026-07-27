import mongoose, { HydratedDocument } from "mongoose";

export type Category = {
  name: string;
  imageUrl: string;
  imagePublicId: string;
  createdAt: Date;
  updatedAt: Date;
};

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

export const Category =
  mongoose.models.Category ||
  mongoose.model<Category>("Category", CategorySchema);
