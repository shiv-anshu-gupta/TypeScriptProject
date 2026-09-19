# Products types `types`

Types for the admin products and categories screens.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `client/src/features/admin/products/types.ts` |
| Group | [Admin panel — features and hooks](index.md) |
| Exports | 11 |

## Description

These mirror the shapes the server returns from `/admin/products` and
`/admin/categories`. They are hand-written, not generated, so a server model
change has to be reflected here by hand.

Request bodies are never sent as JSON: `api.ts` turns
[`CreateProductBody`](#type-create-product-body), [`UpdateProductBody`](#type-update-product-body),
[`CreateCategoryBody`](#type-create-category-body) and [`UpdateCategoryBody`](#type-update-category-body) into multipart
form-data, because each can carry image files.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`Category`](#type-category) | Type | `type Category = { … };` | A product category as the server stores it. |
| [`CreateCategoryBody`](#type-create-category-body) | Type | `type CreateCategoryBody = { … };` | Body for `POST /admin/categories`. |
| [`CreateProductBody`](#type-create-product-body) | Type | `type CreateProductBody = { … };` | Body for `POST /admin/products`. |
| [`Product`](#type-product) | Type | `type Product = { … };` | A product as returned by `GET /admin/products` and `GET /admin/products/:id`. |
| [`ProductCategory`](#type-product-category) | Type | `type ProductCategory = { … };` | The category as embedded inside a [`Product`](#type-product). |
| [`ProductFormState`](#type-product-form-state) | Type | `type ProductFormState = { … };` | The in-memory state of the product dialog's form. |
| [`ProductImage`](#type-product-image) | Type | `type ProductImage = { … };` | One uploaded product picture. |
| [`ProductStatus`](#type-product-status) | Type | `type ProductStatus = "active" \| "inactive";` | Whether a product is shown in the mobile app's Shop tab. |
| [`ProductUnit`](#type-product-unit) | Type | `type ProductUnit = "kg" \| "g" \| "litre" \| "ml" \| "piece" \| "dozen" \| "pack";` | How a product is sold. |
| [`UpdateCategoryBody`](#type-update-category-body) | Type | `type UpdateCategoryBody = { … };` | Body for `PUT /admin/categories/:id`. |
| [`UpdateProductBody`](#type-update-product-body) | Type | `type UpdateProductBody = { … };` | Body for `PUT /admin/products/:id`. |

## Exports in detail

### `Category` {#type-category}

*Type*

A product category as the server stores it.

```ts
type Category = {
  _id: string;
  name: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
};
```

| Property | Type | Meaning |
|---|---|---|
| `_id` | `string` | — |
| `createdAt?` | `string` | — |
| `imageUrl?` | `string` | — |
| `name` | `string` | — |
| `updatedAt?` | `string` | — |

`imageUrl` is optional; the mobile app shows it as a circle on the Shop tab
and falls back to a tag icon when absent. Categories are edited from
`category-dialog.tsx`.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/products/types.ts#L25)

### `CreateCategoryBody` {#type-create-category-body}

*Type*

Body for `POST /admin/categories`.

```ts
type CreateCategoryBody = {
  name: string;
};
```

| Property | Type | Meaning |
|---|---|---|
| `name` | `string` | — |

The image is not part of this type. `createAdminCategory` takes the file as
a separate argument and appends it to the form data under `image`.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/products/types.ts#L116)

### `CreateProductBody` {#type-create-product-body}

*Type*

Body for `POST /admin/products`.

```ts
type CreateProductBody = {
  title: string;
  description: string;
  category: string;
  brand: string;
  unit: ProductUnit;
  unitValue: number;
  stock: number;
  status: ProductStatus;
};
```

| Property | Type | Meaning |
|---|---|---|
| `brand` | `string` | — |
| `category` | `string` | — |
| `description` | `string` | — |
| `status` | `ProductStatus` | — |
| `stock` | `number` | — |
| `title` | `string` | — |
| `unit` | `ProductUnit` | — |
| `unitValue` | `number` | — |

`category` is the category `_id`, not its name. There are no image fields:
new files are passed separately to `createAdminProduct` and appended as
repeated `images` parts.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/products/types.ts#L140)

### `Product` {#type-product}

*Type*

A product as returned by `GET /admin/products` and `GET /admin/products/:id`.

```ts
type Product = {
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
```

| Property | Type | Meaning |
|---|---|---|
| `_id` | `string` | — |
| `brand` | `string` | — |
| `category` | `ProductCategory` | — |
| `createdAt` | `string` | — |
| `description` | `string` | — |
| `images` | `ProductImage[]` | — |
| `status` | `ProductStatus` | — |
| `stock` | `number` | — |
| `title` | `string` | — |
| `unit?` | `ProductUnit` | — |
| `unitValue?` | `number` | — |
| `updatedAt` | `string` | — |

`unit` and `unitValue` are optional because products created before those
fields existed have neither; the table and the form both default to
`piece` and `1`.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/products/types.ts#L94)

### `ProductCategory` {#type-product-category}

*Type*

The category as embedded inside a [`Product`](#type-product).

```ts
type ProductCategory = {
  _id: string;
  name: string;
};
```

| Property | Type | Meaning |
|---|---|---|
| `_id` | `string` | — |
| `name` | `string` | — |

The product list endpoint populates only `_id` and `name`, so this is
deliberately narrower than [`Category`](#type-category) — there is no `imageUrl` here.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/products/types.ts#L56)

### `ProductFormState` {#type-product-form-state}

*Type*

The in-memory state of the product dialog's form.

```ts
type ProductFormState = {
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
```

| Property | Type | Meaning |
|---|---|---|
| `brand` | `string` | — |
| `category` | `string` | — |
| `coverImagePublicId` | `string` | — |
| `description` | `string` | — |
| `existingImages` | `ProductImage[]` | — |
| `newFiles` | `File[]` | — |
| `status` | `ProductStatus` | — |
| `stock` | `string` | — |
| `title` | `string` | — |
| `unit` | `ProductUnit` | — |
| `unitValue` | `string` | — |

This lives only in `useProductForm`; nothing is persisted, so closing the
dialog discards unsaved edits and any picked files.

It differs from [`UpdateProductBody`](#type-update-product-body) on purpose: `unitValue` and
`stock` are strings here because they come straight from number inputs and
must be allowed to be empty while typing. `submit` converts them.
`newFiles` holds already-compressed `File` objects that have passed
the 1 MB check.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/products/types.ts#L186)

### `ProductImage` {#type-product-image}

*Type*

One uploaded product picture.

```ts
type ProductImage = {
  url: string;
  publicId: string;
  isCover: boolean;
};
```

| Property | Type | Meaning |
|---|---|---|
| `isCover` | `boolean` | — |
| `publicId` | `string` | — |
| `url` | `string` | — |

`publicId` is the Cloudinary identifier and is the key used everywhere in
this cluster — cover selection and image removal both address images by
`publicId`, never by array index. At most one image should have
`isCover: true`; `getCoverImage` falls back to the first image when none is
flagged.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/products/types.ts#L43)

### `ProductStatus` {#type-product-status}

*Type*

Whether a product is shown in the mobile app's Shop tab.

```ts
type ProductStatus = "active" | "inactive";
```

Set from the radio group in `product-dialog.tsx`. Both values are listed in
the admin table regardless; the status only affects the customer app.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/products/types.ts#L68)

### `ProductUnit` {#type-product-unit}

*Type*

How a product is sold.

```ts
type ProductUnit = "kg" | "g" | "litre" | "ml" | "piece" | "dozen" | "pack";
```

Mirrors the backend Product model's unit enum. The selectable list lives in
`constants.ts` as `UNIT_OPTIONS` and must be kept in step with this union.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/products/types.ts#L77)

### `UpdateCategoryBody` {#type-update-category-body}

*Type*

Body for `PUT /admin/categories/:id`.

```ts
type UpdateCategoryBody = {
  name: string;
};
```

| Property | Type | Meaning |
|---|---|---|
| `name` | `string` | — |

Same shape as [`CreateCategoryBody`](#type-create-category-body). Omitting the file argument leaves
the stored image untouched — there is no way to clear a category image from
this UI.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/products/types.ts#L128)

### `UpdateProductBody` {#type-update-product-body}

*Type*

Body for `PUT /admin/products/:id`.

```ts
type UpdateProductBody = {
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
```

| Property | Type | Meaning |
|---|---|---|
| `brand` | `string` | — |
| `category` | `string` | — |
| `coverImagePublicId?` | `string` | — |
| `description` | `string` | — |
| `existingImages?` | `ProductImage[]` | — |
| `status` | `ProductStatus` | — |
| `stock` | `number` | — |
| `title` | `string` | — |
| `unit` | `ProductUnit` | — |
| `unitValue` | `number` | — |

`existingImages` is the full list of pictures that should survive the
update, serialised as JSON into the form data. Anything the admin removed in
the dialog is simply absent from that list, which is how deletion is
expressed. `coverImagePublicId` names which of them is the cover.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/products/types.ts#L160)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/products/types.ts)
