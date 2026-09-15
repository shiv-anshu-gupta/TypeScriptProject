import mongoose, { HydratedDocument, model, Schema, Types } from "mongoose";

// What a banner opens when a customer taps it in the app.
export const BANNER_LINK_TYPES = [
  "none", // just a picture
  "writeList", // opens the "write your list" sheet
  "shop", // the Shop tab
  "category", // the Shop tab filtered to one category (targetId)
  "product", // one product's page (targetId)
] as const;
export type BannerLinkType = (typeof BANNER_LINK_TYPES)[number];

export type BannerLink = {
  type: BannerLinkType;
  targetId?: string;
};

export type BannerItem = {
  imageUrl: string;
  imagePublicId: string;
  // Admin's name for the banner; also read aloud to screen-reader users.
  title: string;
  // Hidden banners stay in the list but never reach the app.
  isActive: boolean;
  // Position in the Home carousel, 0 first.
  sortOrder: number;
  link: BannerLink;
  // Optional window - e.g. a festival offer that shows only for a week.
  startsAt: Date | null;
  endsAt: Date | null;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type BannerDocument = HydratedDocument<BannerItem>;

const bannerSchema = new Schema<BannerItem>(
  {
    imageUrl: { type: String, required: true, trim: true },
    imagePublicId: { type: String, required: true, trim: true },
    title: { type: String, default: "", trim: true, maxlength: 80 },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0, index: true },
    link: {
      type: {
        type: String,
        enum: BANNER_LINK_TYPES,
        default: "none",
      },
      targetId: { type: String, trim: true },
    },
    startsAt: { type: Date, default: null },
    endsAt: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

// Banners the app should show right now: switched on and inside their window.
// Older banners saved before these fields existed count as on and unscheduled.
export function liveBannerFilter(now: Date) {
  return {
    isActive: { $ne: false },
    $and: [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: null }, { endsAt: { $gt: now } }] },
    ],
  };
}

// How many live banners the Home carousel shows.
export const HOME_BANNER_LIMIT = 8;

export const Banner =
  mongoose.models.Banner || model<BannerItem>("Banner", bannerSchema);
