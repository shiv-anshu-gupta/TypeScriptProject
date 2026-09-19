/**
 * Every HTTP call the admin products and categories screens make.
 *
 * @remarks
 * All requests go through the wrappers in `client/src/lib/api.ts`, which add
 * the Clerk bearer token, unwrap the server's `{ status, data, errors }`
 * envelope and throw `new Error(errors[0].message)` on failure. So every
 * function here either resolves with the payload or throws — there is no
 * status code to inspect at the call site.
 *
 * Both products and categories are sent as **multipart form-data**, never
 * JSON, because both can carry image files. Content-Type is left to the
 * browser so the multipart boundary is set correctly.
 *
 * The server does police these uploads: multer on `/admin/products` caps each
 * file at 5 MB, allows at most 10, and rejects anything that is not JPEG, PNG
 * or WebP. The 1 MB limit enforced in `use-product-form.ts` and
 * `category-dialog.tsx` is a tighter client-side rule on top of that, chosen to
 * keep uploads fast, not to be the only defence.
 *
 * @see `client/src/lib/api.ts` for the envelope unwrapping and error mapping.
 *
 * @packageDocumentation
 */

import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import type {
  Category,
  CreateCategoryBody,
  CreateProductBody,
  Product,
  UpdateCategoryBody,
  UpdateProductBody,
} from "./types";

// category

/**
 * Fetches every category.
 *
 * @remarks
 * `GET /admin/categories`. Unpaginated and unfiltered — the whole list comes
 * back on each call. The category dialog's search box filters that array in
 * the browser; it does not re-query.
 *
 * @returns The categories, or throws with the server's message.
 */
export async function getAdminCategories() {
  return apiGet<Category[]>("/admin/categories");
}

/**
 * Packs a category name and an optional image into form data.
 *
 * @remarks
 * Only `name` and, when given, `image` are appended. Passing no file means the
 * stored image is left as it is on an update.
 *
 * @param image - Already compressed and size-checked by the caller.
 */
// Categories are sent as multipart form-data because they can carry an
// optional image (shown as circles in the mobile app).
function buildCategoryFormData(
  body: CreateCategoryBody | UpdateCategoryBody,
  image?: File | null,
) {
  const formData = new FormData();
  formData.append("name", body.name);

  if (image) {
    formData.append("image", image);
  }

  return formData;
}

/**
 * Creates a category.
 *
 * @remarks
 * `POST /admin/categories`, multipart form-data.
 *
 * @param image - Optional. The caller (`category-dialog.tsx`) compresses it
 * and rejects anything still over 1 MB before reaching here.
 */
export async function createAdminCategory(
  body: CreateCategoryBody,
  image?: File | null,
) {
  return apiPost<Category, FormData>(
    "/admin/categories",
    buildCategoryFormData(body, image),
  );
}

/**
 * Renames a category and optionally replaces its image.
 *
 * @remarks
 * `PUT /admin/categories/:id`, multipart form-data. Omitting `image` keeps the
 * existing picture; there is no way to remove one from this UI.
 */
export async function updateAdminCategory(
  categoryId: string,
  body: UpdateCategoryBody,
  image?: File | null,
) {
  return apiPut<Category, FormData>(
    `/admin/categories/${categoryId}`,
    buildCategoryFormData(body, image),
  );
}

/**
 * Deletes a category.
 *
 * @remarks
 * `DELETE /admin/categories/:id`. The server refuses when products still
 * reference the category; that refusal arrives as a thrown `Error` and
 * `category-dialog.tsx` shows its message verbatim, so do not replace it with
 * a generic string.
 *
 * @throws The server's message when the category is still in use.
 */
export async function deleteAdminCategory(categoryId: string) {
  return apiDelete<{ _id: string }>(`/admin/categories/${categoryId}`);
}

// products

/**
 * Fetches products, optionally filtered by a search term.
 *
 * @remarks
 * `GET /admin/products`, or `GET /admin/products?search=…` when a non-blank
 * term is given. Searching is done by the server, not in the browser.
 * `use-admin-products.ts` debounces the call by 250 ms, so each keystroke does
 * not become a request. The term is trimmed and URL-encoded here.
 *
 * The same endpoint backs the banner edit dialog's product picker.
 */
export async function getAdminProducts(search?: string) {
  const query = search?.trim()
    ? `/admin/products?search=${encodeURIComponent(search.trim())}`
    : `/admin/products`;

  return apiGet<Product[]>(query);
}

/**
 * Fetches one product.
 *
 * @remarks
 * `GET /admin/products/:id`. The products page does not use it — the edit
 * dialog is seeded from the row already held in state — so it exists for
 * callers outside this cluster.
 */
export async function getAdminProductById(productId: string) {
  return apiGet<Product>(`/admin/products/${productId}`);
}

/**
 * Packs a product body and its new files into form data.
 *
 * @remarks
 * Every scalar is appended as a string — `unitValue` and `stock` go through
 * `String()`. `existingImages` is `JSON.stringify`d into a single text field,
 * which is why multer's text-field limit applies to this route as well as its
 * file limit. The config leaves that at multer's default of 1 MB, far above a
 * list of ten image references. Each new file is appended under the repeated
 * key `images`.
 *
 * On create, `existingImages` and `coverImagePublicId` are simply absent from
 * the body, so neither field is sent.
 */
function buildProductFormData(
  body: CreateProductBody | UpdateProductBody,
  files: File[],
) {
  const formData = new FormData();
  formData.append("title", body.title);
  formData.append("description", body.description);
  formData.append("category", body.category);
  formData.append("brand", body.brand);
  formData.append("unit", body.unit);
  formData.append("unitValue", String(body.unitValue));
  formData.append("stock", String(body.stock));
  formData.append("status", body.status);

  if ("existingImages" in body && body.existingImages) {
    formData.append("existingImages", JSON.stringify(body.existingImages));
  }

  if ("coverImagePublicId" in body && body.coverImagePublicId) {
    formData.append("coverImagePublicId", body.coverImagePublicId);
  }

  files.forEach((file) => formData.append("images", file));

  return formData;
}

/**
 * Creates a product.
 *
 * @remarks
 * `POST /admin/products`, multipart form-data.
 *
 * @param files - New pictures, already compressed and filtered to 1 MB each by
 * `use-product-form.ts`. Nothing on the server re-checks their size or type.
 */
export async function createAdminProduct(
  body: CreateProductBody,
  files: File[],
) {
  const formData = buildProductFormData(body, files);

  return apiPost<Product, FormData>("/admin/products", formData);
}

/**
 * Updates a product.
 *
 * @remarks
 * `PUT /admin/products/:id`, multipart form-data. Images the admin removed are
 * expressed by their absence from `body.existingImages`, so sending an empty
 * `existingImages` with no new files removes every picture.
 *
 * @param files - Newly added pictures only. Images already on the product are
 * carried in `body.existingImages`, not here.
 */
export async function updateAdminProduct(
  productId: string,
  body: UpdateProductBody,
  files: File[],
) {
  const formData = buildProductFormData(body, files);

  return apiPut<Product, FormData>(`/admin/products/${productId}`, formData);
}

/**
 * Deletes a product.
 *
 * @remarks
 * `DELETE /admin/products/:id`. Irreversible. `use-product-form.ts` puts a
 * `window.confirm` in front of it; this function does not confirm anything
 * itself.
 */
export async function deleteAdminProduct(productId: string) {
  return apiDelete<{ _id: string }>(`/admin/products/${productId}`);
}
