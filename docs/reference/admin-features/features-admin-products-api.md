# Products api `api`

Every HTTP call the admin products and categories screens make.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `client/src/features/admin/products/api.ts` |
| Group | [Admin panel — features and hooks](index.md) |
| Exports | 9 |

## Description

All requests go through the wrappers in `client/src/lib/api.ts`, which add
the Clerk bearer token, unwrap the server's `{ status, data, errors }`
envelope and throw `new Error(errors[0].message)` on failure. So every
function here either resolves with the payload or throws — there is no
status code to inspect at the call site.

Both products and categories are sent as **multipart form-data**, never
JSON, because both can carry image files. Content-Type is left to the
browser so the multipart boundary is set correctly.

The server does police these uploads: multer on `/admin/products` caps each
file at 5 MB, allows at most 10, and rejects anything that is not JPEG, PNG
or WebP. The 1 MB limit enforced in `use-product-form.ts` and
`category-dialog.tsx` is a tighter client-side rule on top of that, chosen to
keep uploads fast, not to be the only defence.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`createAdminCategory`](#function-create-admin-category) | Function | `function createAdminCategory(body: CreateCategoryBody, image?: File \| null): Promise<Category>` | Creates a category. |
| [`createAdminProduct`](#function-create-admin-product) | Function | `function createAdminProduct(body: CreateProductBody, files: File[]): Promise<Product>` | Creates a product. |
| [`deleteAdminCategory`](#function-delete-admin-category) | Function | `function deleteAdminCategory(categoryId: string): Promise<{ _id: string }>` | Deletes a category. |
| [`deleteAdminProduct`](#function-delete-admin-product) | Function | `function deleteAdminProduct(productId: string): Promise<{ _id: string }>` | Deletes a product. |
| [`getAdminCategories`](#function-get-admin-categories) | Function | `function getAdminCategories(): Promise<Category[]>` | Fetches every category. |
| [`getAdminProductById`](#function-get-admin-product-by-id) | Function | `function getAdminProductById(productId: string): Promise<Product>` | Fetches one product. |
| [`getAdminProducts`](#function-get-admin-products) | Function | `function getAdminProducts(search?: string): Promise<Product[]>` | Fetches products, optionally filtered by a search term. |
| [`updateAdminCategory`](#function-update-admin-category) | Function | `function updateAdminCategory( … ): Promise<Category>` | Renames a category and optionally replaces its image. |
| [`updateAdminProduct`](#function-update-admin-product) | Function | `function updateAdminProduct( … ): Promise<Product>` | Updates a product. |

## Exports in detail

### `createAdminCategory` {#function-create-admin-category}

*Function*

Creates a category.

```ts
function createAdminCategory(body: CreateCategoryBody, image?: File | null): Promise<Category>
```

| Parameter | Type | Meaning |
|---|---|---|
| `body` | `CreateCategoryBody` | — |
| `image?` | `File \| null` | Optional. The caller (`category-dialog.tsx`) compresses it and rejects anything still over 1 MB before reaching here. |

**Returns** `Promise<Category>`

`POST /admin/categories`, multipart form-data.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/products/api.ts#L86)

### `createAdminProduct` {#function-create-admin-product}

*Function*

Creates a product.

```ts
function createAdminProduct(body: CreateProductBody, files: File[]): Promise<Product>
```

| Parameter | Type | Meaning |
|---|---|---|
| `body` | `CreateProductBody` | — |
| `files` | `File[]` | New pictures, already compressed and filtered to 1 MB each by `use-product-form.ts`. Nothing on the server re-checks their size or type. |

**Returns** `Promise<Product>`

`POST /admin/products`, multipart form-data.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/products/api.ts#L212)

### `deleteAdminCategory` {#function-delete-admin-category}

*Function*

Deletes a category.

```ts
function deleteAdminCategory(categoryId: string): Promise<{ _id: string }>
```

| Parameter | Type | Meaning |
|---|---|---|
| `categoryId` | `string` | — |

**Returns** `Promise<{ … }>`

**Throws**

- The server's message when the category is still in use.

`DELETE /admin/categories/:id`. The server refuses when products still
reference the category; that refusal arrives as a thrown `Error` and
`category-dialog.tsx` shows its message verbatim, so do not replace it with
a generic string.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/products/api.ts#L125)

### `deleteAdminProduct` {#function-delete-admin-product}

*Function*

Deletes a product.

```ts
function deleteAdminProduct(productId: string): Promise<{ _id: string }>
```

| Parameter | Type | Meaning |
|---|---|---|
| `productId` | `string` | — |

**Returns** `Promise<{ … }>`

`DELETE /admin/products/:id`. Irreversible. `use-product-form.ts` puts a
`window.confirm` in front of it; this function does not confirm anything
itself.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/products/api.ts#L250)

### `getAdminCategories` {#function-get-admin-categories}

*Function*

Fetches every category.

```ts
function getAdminCategories(): Promise<Category[]>
```

**Returns** `Promise<Category[]>` &mdash; The categories, or throws with the server's message.

`GET /admin/categories`. Unpaginated and unfiltered — the whole list comes
back on each call. The category dialog's search box filters that array in
the browser; it does not re-query.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/products/api.ts#L48)

### `getAdminProductById` {#function-get-admin-product-by-id}

*Function*

Fetches one product.

```ts
function getAdminProductById(productId: string): Promise<Product>
```

| Parameter | Type | Meaning |
|---|---|---|
| `productId` | `string` | — |

**Returns** `Promise<Product>`

`GET /admin/products/:id`. The products page does not use it — the edit
dialog is seeded from the row already held in state — so it exists for
callers outside this cluster.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/products/api.ts#L158)

### `getAdminProducts` {#function-get-admin-products}

*Function*

Fetches products, optionally filtered by a search term.

```ts
function getAdminProducts(search?: string): Promise<Product[]>
```

| Parameter | Type | Meaning |
|---|---|---|
| `search?` | `string` | — |

**Returns** `Promise<Product[]>`

`GET /admin/products`, or `GET /admin/products?search=…` when a non-blank
term is given. Searching is done by the server, not in the browser.
`use-admin-products.ts` debounces the call by 250 ms, so each keystroke does
not become a request. The term is trimmed and URL-encoded here.

The same endpoint backs the banner edit dialog's product picker.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/products/api.ts#L142)

### `updateAdminCategory` {#function-update-admin-category}

*Function*

Renames a category and optionally replaces its image.

```ts
function updateAdminCategory(
  categoryId: string,
  body: UpdateCategoryBody,
  image?: File | null,
): Promise<Category>
```

| Parameter | Type | Meaning |
|---|---|---|
| `categoryId` | `string` | — |
| `body` | `UpdateCategoryBody` | — |
| `image?` | `File \| null` | — |

**Returns** `Promise<Category>`

`PUT /admin/categories/:id`, multipart form-data. Omitting `image` keeps the
existing picture; there is no way to remove one from this UI.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/products/api.ts#L103)

### `updateAdminProduct` {#function-update-admin-product}

*Function*

Updates a product.

```ts
function updateAdminProduct(
  productId: string,
  body: UpdateProductBody,
  files: File[],
): Promise<Product>
```

| Parameter | Type | Meaning |
|---|---|---|
| `productId` | `string` | — |
| `body` | `UpdateProductBody` | — |
| `files` | `File[]` | Newly added pictures only. Images already on the product are carried in `body.existingImages`, not here. |

**Returns** `Promise<Product>`

`PUT /admin/products/:id`, multipart form-data. Images the admin removed are
expressed by their absence from `body.existingImages`, so sending an empty
`existingImages` with no new files removes every picture.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/products/api.ts#L232)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/products/api.ts)
