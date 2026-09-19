/**
 * What a saved product looks like.
 *
 * @packageDocumentation
 */

/**
 * One saved product.
 *
 * @remarks
 * A snapshot taken when it was saved, not a live product: enough to draw a
 * card and open the details screen, and nothing more. The key is `productId`
 * — there is no separate entry id — which is what `isSaved` and the heart on
 * a card compare against.
 */
export type CustomerWishlistItem = {
  productId: string;
  title: string;
  brand: string;
  image: string;
};

/**
 * The body every wishlist endpoint answers with.
 *
 * @remarks
 * The same shape for reading, adding and removing: always the whole list
 * after the change.
 */
export type CustomerWishlistResponse = {
  items: CustomerWishlistItem[];
};

/**
 * What is sent to save a product.
 */
export type AddCustomerWishlistItemBody = {
  productId: string;
};
