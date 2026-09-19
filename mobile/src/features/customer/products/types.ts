/**
 * The catalogue's shapes.
 *
 * @remarks
 * Some of these are apparel leftovers from the storefront this app grew out
 * of — colours, sizes, brands. They are still returned by the server and
 * still rendered when a product has them, which for a grocery shop is
 * usually never.
 *
 * @packageDocumentation
 */

/**
 * The orders the catalogue can be sorted in.
 *
 * @remarks
 * One value at present. Prices are not published in this app, so there is
 * nothing else to sort by; the union is kept so adding one does not change
 * every signature.
 */
export type ProductSort = "recent";

/**
 * Clothing sizes.
 *
 * @remarks
 * An apparel leftover. Grocery products carry none, and the details screen
 * renders the size row only when the array is non-empty.
 */
export type ProductSize = "S" | "M" | "L" | "XL";

/**
 * How a product is sold.
 *
 * @remarks
 * Drives the quantity picker's whole shape: `piece`, `dozen` and `pack` are
 * counted, the rest are weighed or measured. It pairs with `unitValue`, the
 * pack size — 1 or absent means loose or single.
 */
export type ProductUnit =
  "kg" | "g" | "litre" | "ml" | "piece" | "dozen" | "pack";

/**
 * One category.
 *
 * @remarks
 * Filtering uses `_id`, never `name`. `imageUrl` is optional and the rail
 * falls back to a letter tile without it.
 */
export type ProductCategory = {
  _id: string;
  name: string;
  imageUrl?: string;
};

/**
 * One picture of a product.
 *
 * @remarks
 * `isCover` marks the one a card should show. Nothing guarantees a product
 * has exactly one, which is why `getCoverImage` falls back to the first
 * image and then to `""`.
 *
 * `publicId` is Cloudinary's handle, used by the admin panel to delete an
 * image; the mobile app only ever reads `url`.
 */
export type ProductImage = {
  url: string;
  publicId: string;
  isCover: boolean;
};

/**
 * A product, in full.
 *
 * @remarks
 * There is no price. Prices are not published in this app — the shop prices a
 * list by hand after the customer sends it.
 *
 * `stock` is shown as availability, not as a number to order against; the
 * shop confirms what it can supply when it prices.
 *
 * `status` is the shop's own switch. An `inactive` product should not be
 * reachable from a list request, so a screen that finds one is looking at
 * something stale.
 */
export type CustomerProduct = {
  _id: string;
  title: string;
  description: string;
  category: ProductCategory;
  brand: string;
  stock: number;
  images: ProductImage[];
  colors: string[];
  sizes: ProductSize[];
  unit: ProductUnit;
  unitValue?: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
};

/**
 * The catalogue filters.
 *
 * @remarks
 * `category` is an id. `brand`, `color` and `size` are supported by the
 * server and by the list hook, but no screen currently offers a way to set
 * them.
 */
export type GetCustomerProductsParams = {
  category?: string;
  brand?: string;
  color?: string;
  size?: string;
  search?: string;
  sort?: ProductSort;
};

/**
 * The body of the product details endpoint.
 *
 * @remarks
 * Related products are full products, so tapping one can push a new details
 * screen with its card already drawn.
 */
export type CustomerProductDetailsResponse = {
  product: CustomerProduct;
  relatedProducts: CustomerProduct[];
};
