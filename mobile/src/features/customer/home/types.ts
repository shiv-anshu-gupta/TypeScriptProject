/**
 * What the Home payload contains.
 *
 * @remarks
 * The shop edits all of it in the admin panel, so every section can be empty
 * and a newer server can send fields this build has never heard of.
 *
 * @packageDocumentation
 */

/**
 * What a banner opens when tapped - chosen in the admin panel.
 *
 * @remarks
 * Only `category` and `product` carry a `targetId`, which is what makes this
 * a union rather than one type with an optional field.
 *
 * A newer server can send a `type` this build does not implement. The
 * carousel checks before making a banner tappable, so an unknown link makes
 * the banner decorative rather than broken.
 */
export type BannerLink =
  | { type: "none" | "writeList" | "shop" }
  | { type: "category" | "product"; targetId: string };

/**
 * One promotional image on Home.
 *
 * @remarks
 * `imageUrl` may point at an image that no longer exists. The carousel drops
 * a banner whose picture fails to load and tries again on the next fetch,
 * rather than leaving a grey rectangle.
 */
export type CustomerHomeBanner = {
  _id: string;
  imageUrl: string;
  // Admin's name for the banner; read aloud by screen readers.
  title?: string;
  // Missing from servers older than banner links - treated as "none".
  link?: BannerLink;
  createdAt: string;
};

/**
 * One category tile.
 *
 * @remarks
 * `_id` is what the Shop screen filters by, so it is the value handed over
 * when a tile is tapped — not the name.
 */
export type CustomerHomeCategory = {
  _id: string;
  name: string;
  imageUrl?: string;
};

/**
 * A product as Home shows it.
 *
 * @remarks
 * Deliberately smaller than the catalogue's `CustomerProduct`: one image URL
 * rather than a gallery, and no description, stock or category. Enough for a
 * card; the details screen fetches the rest by id.
 *
 * `unit` and `unitValue` are here because the card's "+" has to add a
 * sensible starting quantity to the draft without another request.
 */
export type CustomerHomeProduct = {
  _id: string;
  title: string;
  brand: string;
  image: string;
  unit: string;
  unitValue?: number;
  createdAt: string;
};

/**
 * A discount code the shop is advertising.
 *
 * @remarks
 * Carried in the payload but not currently shown anywhere — this app has no
 * checkout to apply a code at. The shop prices a list by hand.
 */
export type CustomerHomeCoupon = {
  _id: string;
  code: string;
  percentage: number;
  count: number;
  minimumOrderValue: number;
  endsAt: string;
};

/**
 * The body of `GET /customer/home`.
 *
 * @remarks
 * Every array can be empty, and the store's fallback is exactly that — so a
 * screen never has to check whether a section exists, only whether it has
 * anything in it.
 */
export type CustomerHomeResponse = {
  banners: CustomerHomeBanner[];
  categories: CustomerHomeCategory[];
  recentProducts: CustomerHomeProduct[];
  coupons: CustomerHomeCoupon[];
};
