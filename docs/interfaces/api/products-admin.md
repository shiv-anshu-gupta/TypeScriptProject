# Catalogue — admin side {#products-admin}

`server/src/routes/admin/product.routes.ts` · exported as `adminProductRouter` ·
mounted at `/admin` in `mainEntryFunction` (`server/src/server.ts`), first among
the seven admin routers.

## What this router owns

Categories and products, including their image uploads. The customer-facing
twins are in [products-customer](products-customer.md) and show only active
products.

## Who may call it

`adminProductRouter.use(requireAdmin)` guards the router end to end, so every
route answers **401** to a caller with no Clerk session and **403
`Admin access only`** to a signed-in customer.

## Uploads {#uploads}

Four routes take `multipart/form-data` rather than JSON, through the shared
`upload` multer instance, so the global 100 kB `express.json` limit does not
apply to them.

| Property | Value |
|---|---|
| Storage | `multer.memoryStorage()` — files never touch disk, because the serverless filesystem is read-only and short-lived |
| Size | 5 MB per file (`MAX_IMAGE_BYTES`) |
| Count | at most 10 files per request |
| Types | `image/jpeg`, `image/png` and `image/webp` (`ALLOWED_IMAGE_TYPES`), checked on the **browser-declared** MIME type, not the bytes |

The same instance serves both resources, so the category routes inherit the
ten-file allowance even though they read a single field.

Nothing streams, so a request costs its own size in process memory while it
runs.

???+ warning "Only the type rejection is a clean 400"
    The `fileFilter` throws `AppError 400 "Only JPG, PNG or WebP images can be
    uploaded"`. Multer's own limit errors — a file over 5 MB, more than ten
    files, or a file under an unexpected field name — are raised as a
    `MulterError`, which **neither route wraps**. The caller sees **500
    `Internal server error`** instead of a 400 explaining what to fix.

    The banner upload in
    [settings-and-banners](settings-and-banners.md#post-banners) and the photo
    read in
    [grocery-lists-customer](grocery-lists-customer.md#post-read-photo) both
    translate them.

### What Cloudinary does to an upload

`uploadSingleBufferToCloudinary` in `server/src/utils/cloudinary.ts` streams the
buffer and asks for `crop: "limit"` at 1600 by 1600 with `quality: auto:good`,
so a picture is only ever **shrunk**, never enlarged or cropped. What comes
back is not byte-identical to what the admin chose. The returned `secure_url`
and `public_id` are both stored — the id is the only handle that can later
delete the picture.

| Resource | Cloudinary folder |
|---|---|
| Categories | `ecommerce-monster-video/categories` (`CATEGORY_IMAGE_FOLDER`) |
| Products | `ecommerce-monster-video/products` — the default in `uploadManyBuffersToCloudinary`, because the product routes pass no folder |

## Image clean-up is only half automatic {#image-leaks}

| Action | Cloudinary asset |
|---|---|
| Replacing a category image (`PUT /admin/categories/:id`) | **left behind** — the `publicId` is simply overwritten |
| Deleting a category | **left behind**, even though `imagePublicId` is on the document about to be discarded |
| Deleting a product | **left behind** — every image it owned |
| Editing a product (`PUT /admin/products/:id`) | removed images **are** deleted, best effort |

Nothing in this file reconciles the two stores, so orphaned assets accumulate.

## Response shapes are inconsistent by accident

- `POST /admin/products` returns **full-size** Cloudinary URLs.
- Every other product response goes through `sizedProduct(..., "card")`, so
  image URLs are 500 px wide.
- The category routes return **raw documents**, including `imagePublicId` and
  `__v`.

A client that caches the create response holds different URLs from the ones the
list gives it.

---

## `GET /admin/categories` {#get-admin-categories}

Every category, A to Z by `name`.

**Auth:** admin. **Path, query and body parameters:** none. No search, no
paging.

The documents go out raw. The customer twin
([`GET /customer/categories`](products-customer.md#get-customer-categories))
returns the same set — categories have no active/inactive flag, so there is
nothing to hide.

```json
{
  "status": "success",
  "data": [
    {
      "_id": "68c1112233445566778899aa",
      "name": "बेबी प्रोडक्ट्स / Baby Products",
      "imageUrl": "https://res.cloudinary.com/demo/image/upload/v1/ecommerce-monster-video/categories/baby.jpg",
      "imagePublicId": "ecommerce-monster-video/categories/baby",
      "createdAt": "2026-06-02T09:11:00.000Z",
      "updatedAt": "2026-06-02T09:11:00.000Z",
      "__v": 0
    }
  ]
}
```

**Errors:** 401 and 403 from the router guard.

**Side effects:** none.

**Called by:** `getAdminCategories` in
`client/src/features/admin/products/api.ts`.

---

## `POST /admin/categories` {#post-admin-categories}

Creates a category, with an optional picture.

**Auth:** admin. **Path and query parameters:** none.

### Request body — `multipart/form-data`

| Field | Type | Required | Validation |
|---|---|---|---|
| `name` | text | yes | Trimmed; must be non-empty |
| `image` | single file | no | See [uploads](#uploads). A second file under this name is a multer error and therefore a 500 |

Anything else in the body is ignored. Names are **not** checked for duplicates
and the schema has no unique index, so two categories may share a name.

With no file the category is created with `imageUrl` and `imagePublicId` set to
empty strings rather than left undefined.

Answers **201** with the raw created document.

**Errors**

| Status | Message |
|---|---|
| 400 | `Category name is needed` |
| 400 | `Only JPG, PNG or WebP images can be uploaded` — from the file filter |
| 500 | a Cloudinary failure, or any multer limit error |

**Side effects:** when a file is sent, one Cloudinary upload to
`ecommerce-monster-video/categories`; then one insert into `categories`. A
Cloudinary failure rejects and surfaces as a 500 with nothing written.

**Called by:** `createAdminCategory` in
`client/src/features/admin/products/api.ts`, sending `FormData`.

---

## `PUT /admin/categories/:id` {#put-admin-category}

Renames a category and optionally replaces its picture.

**Auth:** admin.

| Path parameter | Meaning |
|---|---|
| `id` | The category `_id`. A malformed id is a Mongoose `CastError`, so **500** rather than 400 or 404 |

### Request body — `multipart/form-data`

| Field | Type | Required |
|---|---|---|
| `name` | text | yes; trimmed, non-empty |
| `image` | single file | no |

Despite being a `PUT` this behaves as a **partial** update for the image:
omitting the file keeps the stored one rather than clearing it. There is no way
to remove a category picture through this API.

Answers with the raw updated document.

**Errors**

| Status | Message |
|---|---|
| 400 | `Category name is needed` |
| 404 | `Category not found` |

**Side effects:** when a file is sent, one Cloudinary upload; then one save to
`categories`. **The previous Cloudinary asset is not deleted** — see
[image clean-up](#image-leaks).

**Called by:** `updateAdminCategory` in
`client/src/features/admin/products/api.ts`.

---

## `DELETE /admin/categories/:id` {#delete-admin-category}

Removes a category that nothing points at.

**Auth:** admin.

| Path parameter | Meaning |
|---|---|
| `id` | The category `_id` |

**Query parameters:** none. **Request body:** none.

Every product holds a **required** reference to its category, so deleting one
that still has products would leave them orphaned. The route counts them first
and refuses. The count is taken at the moment of the check and not under a
transaction, so a product created between the count and the delete would still
be orphaned.

Answers `{ "_id": "..." }` only — the deleted document is not echoed back.

```json
{
  "status": "success",
  "data": { "_id": "68c1112233445566778899aa" }
}
```

**Errors**

| Status | Message |
|---|---|
| 404 | `Category not found` |
| 400 | `This category still has 7 products. Move or delete them first.` — the count is quoted live and the word is singular for a count of one |

**Side effects:** one delete from `categories`. **The Cloudinary image is not
removed.**

**Called by:** `deleteAdminCategory` in
`client/src/features/admin/products/api.ts`.

---

## `GET /admin/products` {#get-admin-products}

The catalogue as the shop sees it, newest first.

**Auth:** admin. **Request body:** none.

### Query parameters

| Parameter | Matching |
|---|---|
| `search` | Optional. Matches `title` **only** — not brand, description or category — case-insensitively, as a substring anywhere in the title. Escaped by `escapeRegex` in `server/src/utils/regex.ts` first, so punctuation is matched literally |

Unlike the customer route this ignores `status`, so **inactive products are
included**. There is no paging and no limit.

`category` is populated down to its `name`, and every image URL is rewritten to
the `card` size, so the edit screen loads the same 500 px files the grid does.

The body is a **bare array** under `data`, not an object with an `items` key.

```json
{
  "status": "success",
  "data": [
    {
      "_id": "68e2223344556677889900bb",
      "title": "Aashirvaad Multigrain Atta",
      "description": "Wheat flour with five grains.",
      "category": { "_id": "68c1112233445566778899aa", "name": "Staples" },
      "brand": "Aashirvaad",
      "stock": 24,
      "images": [
        {
          "url": "https://res.cloudinary.com/demo/image/upload/f_webp,q_auto,c_limit,w_500/v1/ecommerce-monster-video/products/atta.jpg",
          "publicId": "ecommerce-monster-video/products/atta",
          "isCover": true
        }
      ],
      "colors": [],
      "sizes": [],
      "unit": "kg",
      "unitValue": 5,
      "status": "active",
      "createdBy": "68b0000011112222333344dd",
      "createdAt": "2026-09-17T11:02:44.907Z",
      "updatedAt": "2026-09-17T11:02:44.907Z",
      "__v": 0
    }
  ]
}
```

**Errors:** none of its own.

**Side effects:** none.

**Called by:** `getAdminProducts` in
`client/src/features/admin/products/api.ts`.

---

## `GET /admin/products/:id` {#get-admin-product}

One product, for the edit screen.

**Auth:** admin.

| Path parameter | Meaning |
|---|---|
| `id` | The product `_id`. A malformed id is a Mongoose `CastError`, so **500** |

**Query parameters:** none. **Request body:** none.

Images come back at the `card` width (500 px), the same as the list, even
though this is the edit view where the full-size original would be the better
source. `category` is populated down to its `name`.

???+ info "The missing-product check is `requireText`, not `requireFound`"
    An emptiness guard is used as a presence check. It happens to work — a
    `null` product goes through `String(value || "")` and comes out empty — but
    it reads as a text validation and does not narrow the type for the line
    below.

**Errors**

| Status | Message |
|---|---|
| 404 | `Product not found` |

**Side effects:** none.

**Called by: nobody.** `getAdminProductById` is exported from
`client/src/features/admin/products/api.ts`, but nothing in `client/src`
imports it and `mobile/src` calls no admin route. The route is live and has no
caller.

---

## `POST /admin/products` {#post-admin-products}

Creates a product from a multipart form and its images.

**Auth:** admin. **Path and query parameters:** none.

### Request body — `multipart/form-data`

| Field | Type | Required | Validation |
|---|---|---|---|
| `images` | repeated files | yes, 1 to 10 | See [uploads](#uploads). The **first** file becomes the cover; there is no way to nominate a different one on create |
| `title` | text | yes | Trimmed, non-empty |
| `description` | text | yes | Trimmed, non-empty |
| `category` | text | yes | Must be the `_id` of an existing category |
| `brand` | text | yes | Trimmed, non-empty |
| `stock` | text | yes | Guarded only against `NaN` by `requireNumber`. A **negative** number passes here and is then refused by the schema's `min: 0` as a **500** rather than a 400. An empty field becomes `0` and passes |
| `status` | text | no | Defaults to `"active"`. Checked only by the schema enum, so a bad value is a **500** |
| `unit` | text | no | Defaults to `"piece"`. Same — a bad value is a 500 |
| `unitValue` | text | no | Kept only when finite and greater than zero; otherwise it silently becomes `1` |
| `colors` | — | no | Taken verbatim from the multipart body, **not validated here** |
| `sizes` | — | no | Taken verbatim, not validated here; the schema enum is the only guard |

`createdBy` is set from the calling admin's own user record and cannot be
supplied by the caller. **Price is not part of this route at all** — the
`products` schema has no price field; see
[products](../database/products.md).

The category existence check uses `requireText` on the document, as in
[`GET /admin/products/:id`](#get-admin-product).

Answers **201** with the product re-fetched and its category populated, but
**not** passed through `sizedProduct` — so this is the one product response
whose image URLs are the full-size Cloudinary originals.

**Errors**

| Status | Message |
|---|---|
| 400 | `Title is required` |
| 400 | `Description is required` |
| 400 | `Category is required` |
| 400 | `Brand is required` |
| 400 | `Stock is required` — `stock` does not parse as a number |
| 404 | `Category not found` |
| 400 | `Atleast one image is needed` — no file was uploaded |
| 400 | `Only JPG, PNG or WebP images can be uploaded` |

**Side effects:** one Cloudinary upload per file to
`ecommerce-monster-video/products`, then one insert into `products`. The
uploads happen **before** the insert, so a document that then fails schema
validation leaves its images stranded in Cloudinary.

**Called by:** `createAdminProduct` in
`client/src/features/admin/products/api.ts`, sending `FormData`.

---

## `PUT /admin/products/:id` {#put-admin-product}

Replaces a product's fields and reconciles its image set.

**Auth:** admin.

| Path parameter | Meaning |
|---|---|
| `id` | The product `_id` |

### Request body — `multipart/form-data`

The same text fields and the same rules as the create route, plus two more.
This is a **genuine replace**: omitting `status`, `unit` or `unitValue` resets
them to `"active"`, `"piece"` and `1` rather than leaving them alone.
`createdBy` is never touched, so the original author stays.

| Field | Type | Behaviour |
|---|---|---|
| `existingImages` | text, JSON | The images the client decided to keep. Only each entry's `publicId` is read — a `url` sent with it is ignored, and a `publicId` that matches no stored image is dropped, so a client cannot add images this way |
| `coverImagePublicId` | text | Names the cover |

`existingImages` behaviour by case:

| Case | Result |
|---|---|
| absent | keep everything currently stored |
| present but unparseable JSON | treated as `[]`, which **removes every existing image** |
| a list of `publicId` values | keep only those |

New files are appended after the kept ones.

`coverImagePublicId` behaviour:

| Case | Result |
|---|---|
| absent | the first image in the merged order becomes the cover |
| present and matching | that image becomes the cover |
| present but matching nothing | **no image is marked as the cover**, and nothing catches that |

Answers with `sizedProduct(..., "card")`, so image URLs are card width — unlike
the create route, which returns the full-size originals for the same product.

**Errors**

| Status | Message |
|---|---|
| 400 | `Title is required` |
| 400 | `Description is required` |
| 400 | `Category is required` |
| 400 | `Brand is required` |
| 400 | `Stock is required` |
| 404 | `Category not found` |
| 404 | `Product not found` |
| 400 | `Atleast one img is needed` — the kept and new images together come to nothing. **Note the wording differs** from the create route's `Atleast one image is needed` |

**Side effects:** one Cloudinary upload per new file; Cloudinary deletes for
every stored image no longer in the kept set — best effort, since
`deleteFromCloudinary` swallows its own failures; then one save to `products`.

???+ warning "The deletes run before the validation"
    The Cloudinary deletes happen **before** the "at least one image" check. A
    request that removes every image destroys the assets and only then answers
    400, leaving the product pointing at URLs that no longer resolve. The
    delete is also unconditional on the save succeeding, so a later validation
    failure has the same effect.

**Called by:** `updateAdminProduct` in
`client/src/features/admin/products/api.ts`.

---

## `DELETE /admin/products/:id` {#delete-admin-product}

Removes a product from the catalogue.

**Auth:** admin.

| Path parameter | Meaning |
|---|---|
| `id` | The product `_id` |

**Query parameters:** none. **Request body:** none.

There is no soft delete and no confirmation. Setting `status` to `"inactive"`
through [the update route](#put-admin-product) is the reversible alternative,
and the one to prefer: carts and past orders hold the product's id, and a
deleted one populates as `null`.

Answers `{ "_id": "..." }` only.

**Errors**

| Status | Message |
|---|---|
| 404 | `Product not found` |

**Side effects:** one delete from `products`. **The product's Cloudinary images
are not deleted.** Cart and wishlist rows keep the now-dangling id and are
filtered out when they are read — see
[carts](../database/carts.md) and [wishlists](../database/wishlists.md).

**Called by:** `deleteAdminProduct` in
`client/src/features/admin/products/api.ts`.
