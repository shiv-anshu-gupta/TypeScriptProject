/**
 * The catalogue: categories, the product list and one product's details.
 *
 * @remarks
 * All three are public. They work signed out and are what lets Home and Shop
 * be usable before anybody logs in.
 *
 * @packageDocumentation
 */

import { apiGet } from "@/lib/api";
import type {
  CustomerProduct,
  CustomerProductDetailsResponse,
  GetCustomerProductsParams,
  ProductCategory,
} from "./types";

/**
 * `GET /customer/categories` — every category the shop is showing.
 *
 * @returns The categories, in the shop's own order.
 * @throws Error On a network or server failure. Callers fall back to an empty
 * rail rather than an error screen.
 */
export async function getCustomerCategories() {
  return apiGet<ProductCategory[]>("/customer/categories");
}

/**
 * `GET /customer/products` — the catalogue, filtered.
 *
 * @remarks
 * The query string is built by hand, one `encodeURIComponent` value at a
 * time, because React Native has no `URLSearchParams`. Empty values are
 * dropped rather than sent blank, so an unfiltered call is a clean
 * `/customer/products`.
 *
 * Everything comes back at once — there is no paging, which suits a single
 * shop's catalogue and is what lets the Shop grid filter without a spinner
 * per page.
 *
 * @param params - Every field optional; `search` is free text and the caller
 * is expected to have debounced it.
 * @returns The matching products, possibly none.
 * @throws Error On a network or server failure.
 */
export async function getCustomerProducts(params?: GetCustomerProductsParams) {
  const query: string[] = [];

  if (params?.category)
    query.push(`category=${encodeURIComponent(params.category)}`);
  if (params?.brand) query.push(`brand=${encodeURIComponent(params.brand)}`);
  if (params?.color) query.push(`color=${encodeURIComponent(params.color)}`);
  if (params?.size) query.push(`size=${encodeURIComponent(params.size)}`);
  if (params?.search) query.push(`search=${encodeURIComponent(params.search)}`);
  if (params?.sort) query.push(`sort=${encodeURIComponent(params.sort)}`);

  const queryString = query.join("&");

  const url = queryString
    ? `/customer/products?${queryString}`
    : `/customer/products`;

  return apiGet<CustomerProduct[]>(url);
}

/**
 * `GET /customer/products/:id` — one product, with the related ones.
 *
 * @returns `{ product, relatedProducts }`.
 * @throws Error When the id is unknown, or the request fails.
 */
export async function getCustomerProductDetails(productId: string) {
  return apiGet<CustomerProductDetailsResponse>(
    `/customer/products/${productId}`,
  );
}
