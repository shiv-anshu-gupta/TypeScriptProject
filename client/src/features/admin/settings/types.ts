/**
 * Types for the app's home banners.
 *
 * @remarks
 * `AdminBanner` is the stored record; `UpdateBannerBody` is the partial patch
 * the admin page sends; `BannerStatus` is derived in the browser by
 * `bannerStatuses` and never travels over the wire.
 *
 * @packageDocumentation
 */

// What a banner opens when a customer taps it in the app.
/**
 * Where a tap on a banner leads in the mobile app.
 *
 * @remarks
 * `none` makes the banner a picture only. `writeList` opens the write-list
 * sheet — the app's main flow — and `shop` the Shop tab; neither needs a
 * target. `category` and `product` each require a `targetId`, which the edit
 * dialog refuses to leave blank.
 */
export type BannerLinkType = "none" | "writeList" | "shop" | "category" | "product";

/**
 * One banner as the server stores it.
 *
 * @remarks
 * `imagePublicId` is the Cloudinary handle, used server-side when the banner is
 * deleted. `sortOrder` is the stored position, but the client relies on the
 * array order the server returns rather than re-sorting by this field.
 * `link.targetName` is resolved by the server for category and product links
 * and is absent once the target is deleted. `startsAt` and `endsAt` are ISO
 * strings or `null` for "no limit".
 */
export type AdminBanner = {
  _id: string;
  imageUrl: string;
  imagePublicId: string;
  title: string;
  isActive: boolean;
  sortOrder: number;
  link: { type: BannerLinkType; targetId?: string; targetName?: string };
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
};

/**
 * Payload of every banner endpoint.
 *
 * @remarks
 * Read, upload, update, reorder and delete all return this same shape, so any
 * response can replace client state.
 */
export type AdminBannersResponse = {
  items: AdminBanner[];
  // How many live banners the app's Home carousel shows.
  limit: number;
};

/**
 * Body of `PATCH /admin/settings/banners/:id`.
 *
 * @remarks
 * Every field is optional: the visibility toggle sends `isActive` alone, the
 * edit dialog sends title, link and both dates. `startsAt` or `endsAt` set to
 * `null` clears that end of the schedule. Note the link here carries only
 * `targetId` — `targetName` is the server's to resolve.
 */
export type UpdateBannerBody = Partial<{
  title: string;
  isActive: boolean;
  link: { type: BannerLinkType; targetId?: string };
  startsAt: string | null;
  endsAt: string | null;
}>;

// Where a banner stands right now, as the app sees it.
/**
 * A banner's computed state.
 *
 * @remarks
 * Derived in the browser by `bannerStatuses`; the server stores none of it.
 * `hidden` means `isActive` is false, `scheduled` that `startsAt` is still in
 * the future, `ended` that `endsAt` has passed, and `overLimit` that the banner
 * is otherwise live but sits past the carousel limit, so the app will not show
 * it.
 */
export type BannerStatus = "live" | "hidden" | "scheduled" | "ended" | "overLimit";
