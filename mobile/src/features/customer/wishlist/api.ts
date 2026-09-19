/**
 * The customer's saved products.
 *
 * @remarks
 * All three need a bearer token. Each answers with the **whole** wishlist
 * after the change, so a caller replaces its copy rather than patching it and
 * the store can never drift from the server.
 *
 * @packageDocumentation
 */

import { apiDelete, apiGet, apiPost } from "@/lib/api";
import type {
  AddCustomerWishlistItemBody,
  CustomerWishlistResponse,
} from "./types";

/**
 * `GET /customer/wishlist` — every product the customer has saved.
 *
 * @returns `{ items }`, possibly empty.
 * @throws Error When signed out, or the request fails.
 */
export async function getCustomerWishlist() {
  return apiGet<CustomerWishlistResponse>("/customer/wishlist");
}

/**
 * `POST /customer/wishlist/items` — saves a product.
 *
 * @returns The whole wishlist as it now stands.
 * @throws Error When signed out, or the product is unknown.
 */
export async function addCustomerWishlist(body: AddCustomerWishlistItemBody) {
  return apiPost<CustomerWishlistResponse, AddCustomerWishlistItemBody>(
    "/customer/wishlist/items",
    body,
  );
}

/**
 * `DELETE /customer/wishlist/items/:productId` — un-saves a product.
 *
 * @remarks
 * Addressed by the **product** id, not by a wishlist entry id.
 *
 * @returns The whole wishlist as it now stands.
 * @throws Error When signed out, or the request fails.
 */
export async function removeCustomerWishlistItem(productId: string) {
  return apiDelete<CustomerWishlistResponse>(
    `/customer/wishlist/items/${productId}`,
  );
}
