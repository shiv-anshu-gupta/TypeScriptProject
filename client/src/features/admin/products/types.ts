/**
 * Types for the admin products and categories screens.
 *
 * @remarks
 * These mirror the shapes the server returns from `/admin/products` and
 * `/admin/categories`. They are hand-written, not generated, so a server model
 * change has to be reflected here by hand.
 *
 * Request bodies are never sent as JSON: `api.ts` turns
 * {@link CreateProductBody}, {@link UpdateProductBody},
 * {@link CreateCategoryBody} and {@link UpdateCategoryBody} into multipart
 * form-data, because each can carry image files.
 *
 * @packageDocumentation
 */

/**
 * A product category as the server stores it.
 *
 * @remarks
 * `imageUrl` is optional; the mobile app shows it as a circle on the Shop tab
 * and falls back to a tag icon when absent. Categories are edited from
 * `category-dialog.tsx`.
 */
export type Category = {
  _id: string;
  name: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
};

/**
 * One uploaded product picture.
 *
 * @remarks
 * `publicId` is the Cloudinary identifier and is the key used everywhere in
 * this cluster — cover selection and image removal both address images by
 * `publicId`, never by array index. At most one image should have
 * `isCover: true`; `getCoverImage` falls back to the first image when none is
 * flagged.
 */
export type ProductImage = {
  url: string;
  publicId: string;
  isCover: boolean;
};

/**
 * The category as embedded inside a {@link Product}.
 *
 * @remarks
 * The product list endpoint populates only `_id` and `name`, so this is
 * deliberately narrower than {@link Category} — there is no `imageUrl` here.
 */
export type ProductCategory = {
  _id: string;
  name: string;
};

/**
 * Whether a product is shown in the mobile app's Shop tab.
 *
 * @remarks
 * Set from the radio group in `product-dialog.tsx`. Both values are listed in
 * the admin table regardless; the status only affects the customer app.
 */
export type ProductStatus = "active" | "inactive";

/**
 * How a product is sold.
 *
 * @remarks
 * Mirrors the backend Product model's unit enum. The selectable list lives in
 * `constants.ts` as `UNIT_OPTIONS` and must be kept in step with this union.
 */
export type ProductUnit =
  | "kg"
  | "g"
  | "litre"
  | "ml"
  | "piece"
  | "dozen"
  | "pack";

/**
 * A product as returned by `GET /admin/products` and `GET /admin/products/:id`.
 *
 * @remarks
 * `unit` and `unitValue` are optional because products created before those
 * fields existed have neither; the table and the form both default to
 * `piece` and `1`.
 */
export type Product = {
  _id: string;
  title: string;
  description: string;
  brand: string;
  category: ProductCategory;
  images: ProductImage[];
  unit?: ProductUnit;
  unitValue?: number;
  stock: number;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
};

/**
 * Body for `POST /admin/categories`.
 *
 * @remarks
 * The image is not part of this type. `createAdminCategory` takes the file as
 * a separate argument and appends it to the form data under `image`.
 */
export type CreateCategoryBody = {
  name: string;
};

/**
 * Body for `PUT /admin/categories/:id`.
 *
 * @remarks
 * Same shape as {@link CreateCategoryBody}. Omitting the file argument leaves
 * the stored image untouched — there is no way to clear a category image from
 * this UI.
 */
export type UpdateCategoryBody = {
  name: string;
};

/**
 * Body for `POST /admin/products`.
 *
 * @remarks
 * `category` is the category `_id`, not its name. There are no image fields:
 * new files are passed separately to `createAdminProduct` and appended as
 * repeated `images` parts.
 */
export type CreateProductBody = {
  title: string;
  description: string;
  category: string;
  brand: string;
  unit: ProductUnit;
  unitValue: number;
  stock: number;
  status: ProductStatus;
};

/**
 * Body for `PUT /admin/products/:id`.
 *
 * @remarks
 * `existingImages` is the full list of pictures that should survive the
 * update, serialised as JSON into the form data. Anything the admin removed in
 * the dialog is simply absent from that list, which is how deletion is
 * expressed. `coverImagePublicId` names which of them is the cover.
 */
export type UpdateProductBody = {
  title: string;
  description: string;
  category: string;
  brand: string;
  unit: ProductUnit;
  unitValue: number;
  stock: number;
  status: ProductStatus;
  existingImages?: ProductImage[];
  coverImagePublicId?: string;
};

/**
 * The in-memory state of the product dialog's form.
 *
 * @remarks
 * This lives only in `useProductForm`; nothing is persisted, so closing the
 * dialog discards unsaved edits and any picked files.
 *
 * It differs from {@link UpdateProductBody} on purpose: `unitValue` and
 * `stock` are strings here because they come straight from number inputs and
 * must be allowed to be empty while typing. `submit` converts them.
 * `newFiles` holds already-compressed {@link File} objects that have passed
 * the 1 MB check.
 */
export type ProductFormState = {
  title: string;
  description: string;
  category: string;
  brand: string;
  unit: ProductUnit;
  unitValue: string;
  stock: string;
  status: ProductStatus;
  existingImages: ProductImage[];
  newFiles: File[];
  coverImagePublicId: string;
};
