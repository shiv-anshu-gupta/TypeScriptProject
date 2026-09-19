/**
 * The promotional images across the top of the app's Home screen.
 *
 * @remarks
 * A banner is a picture the shop uploads, ordered by hand, optionally
 * scheduled, and optionally linked to somewhere in the app. Managed by the
 * admin in routes/admin/settings.routes.ts and served to the app by
 * routes/customer/home.routes.ts.
 *
 * @packageDocumentation
 */
import mongoose, { HydratedDocument, model, Schema, Types } from "mongoose";

/**
 * What a banner opens when a customer taps it in the app.
 *
 * @remarks
 * The meaning of each value is on the line beside it. `category` and
 * `product` need a `targetId`; the rest ignore it. Nothing in the schema
 * enforces that pairing - the admin route validates it, and the app treats a
 * link it cannot follow as `none`.
 *
 * The order of this array is not meaningful; it is the source of the schema's
 * enum and of {@link BannerLinkType}.
 */
export const BANNER_LINK_TYPES = [
  "none", // just a picture
  "writeList", // opens the "write your list" sheet
  "shop", // the Shop tab
  "category", // the Shop tab filtered to one category (targetId)
  "product", // one product's page (targetId)
] as const;
/** One of {@link BANNER_LINK_TYPES}. */
export type BannerLinkType = (typeof BANNER_LINK_TYPES)[number];

/**
 * Where a tap on the banner goes.
 *
 * @remarks
 * `targetId` is the category or product id for those two types, held as a
 * plain string rather than an ObjectId ref, so a banner survives the target
 * being deleted - it just stops going anywhere useful.
 */
export type BannerLink = {
  type: BannerLinkType;
  targetId?: string;
};

/**
 * One banner. Field-by-field notes are beside the fields.
 *
 * @remarks
 * Both `imageUrl` and `imagePublicId` come from the Cloudinary upload; the id
 * is what later deletes the picture, so neither is optional.
 *
 * `startsAt` and `endsAt` are a half-open window - a banner is live from
 * `startsAt` inclusive until `endsAt` exclusive. `null` on either side means
 * unbounded. See {@link liveBannerFilter}.
 */
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

/** A saved banner, as Mongoose hands it back. */
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

// `sortOrder` is indexed because the Home carousel's only query sorts by it;
// without the index that sort is done in memory on every app launch.

/**
 * Banners the app should show right now: switched on and inside their window.
 * Older banners saved before these fields existed count as on and unscheduled.
 *
 * @remarks
 * The looseness is deliberate and is what makes it safe to add these fields to
 * a collection that already had rows. `isActive` is tested with `$ne: false`,
 * so a document with no such field counts as on; each date is tested as
 * "null or past/future", so a document with no dates counts as unscheduled.
 *
 * @param now - the instant to judge against. Passed in rather than read here
 * so that one request judges every banner at the same moment.
 * @returns A filter object to hand to `Banner.find`. It performs no query
 * itself.
 */
export function liveBannerFilter(now: Date) {
  return {
    isActive: { $ne: false },
    $and: [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ endsAt: null }, { endsAt: { $gt: now } }] },
    ],
  };
}

/**
 * How many live banners the Home carousel shows.
 *
 * @remarks
 * Applied as the `limit` on the Home query and also sent to the admin panel,
 * so the shop is told the ceiling rather than discovering that a ninth banner
 * never appears.
 */
export const HOME_BANNER_LIMIT = 8;

/**
 * The Banner model.
 *
 * @remarks
 * Resolved from `mongoose.models` first so that a hot reload, which runs this
 * module again, does not try to compile the same model twice.
 */
export const Banner =
  mongoose.models.Banner || model<BannerItem>("Banner", bannerSchema);
