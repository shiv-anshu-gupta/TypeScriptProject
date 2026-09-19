# Catalogue — customer side {#products-customer}

`server/src/routes/customer/product.routes.ts` · exported as
`customerProductRouter` · mounted at `/customer` in `mainEntryFunction`
(`server/src/server.ts`).

## What this router owns

The public shop catalogue: the category list, the product list and one
product's page.

## Who may call it

Anyone. This router calls neither `requireAuth` nor `requireAdmin`, so the app
can show the shop before anyone signs in. That is also why every product query
here is pinned to `status: "active"` — an inactive product must not be visible
to the public. The admin twin in
[products-admin](products-admin.md) is where any status can be read.

None of these routes is paginated.

## Image sizes

Product images are rewritten on the way out by `sizedProduct` in
`server/src/utils/productImages.ts`, which calls `cdnImage` in
`server/src/utils/cloudinary.ts`. Only the address changes; the stored original
is untouched.

| Variant | Width | Used by |
|---|---|---|
| `card` | 500 px | the product list, and `relatedProducts` |
| `detail` | 900 px | one product's own page |

---

## `GET /customer/categories` {#get-customer-categories}

Every category, sorted A to Z by `name`.

**Auth:** public. **Path, query and body parameters:** none.

The documents are returned raw, without a mapper, so `data` is a bare array
carrying `imagePublicId` and `__v` as well. `imageUrl` is the stored Cloudinary
URL at full size — unlike [`/customer/home`](home.md), it is **not** rewritten
to a thumbnail here.

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

**Errors:** none of its own.

**Side effects:** none.

**Called by:** `getCustomerCategories` in
`mobile/src/features/customer/products/api.ts`.

---

## `GET /customer/products` {#get-customer-products}

Active products, optionally filtered and searched.

**Auth:** public. **Request body:** none.

### Query parameters

All optional, all trimmed.

| Parameter | Matching | Notes |
|---|---|---|
| `category` | exact, on the category ObjectId | A value that is not a valid ObjectId raises a Mongoose `CastError`, which surfaces as a **500**, not a 400 |
| `brand` | exact string | |
| `color` | membership in the product's `colors` array | |
| `size` | membership in the product's `sizes` array | |
| `search` | case-insensitive substring of `title` only | Escaped by `escapeRegex` in `server/src/utils/regex.ts` first, so `(`, `*`, `+` and `?` are matched literally rather than becoming an invalid or expensive pattern |
| `sort` | **ignored** | It is declared on the `ProductAppliedFilterListQuery` type and then never read. `sortOption` is hard-coded to `{ createdAt: -1 }` |

`status: "active"` is always added. Results are not filtered by stock and are
not paginated, so the whole matching set comes back in one response.

`category` is populated down to its `name`.

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

**Called by:** `getCustomerProducts` in
`mobile/src/features/customer/products/api.ts`, which builds
`/customer/products?${queryString}` and falls back to the bare path.

---

## `GET /customer/products/:id` {#get-customer-product}

One active product, plus up to four others from the same category.

**Auth:** public.

### Path parameters

| Parameter | Meaning |
|---|---|
| `id` | A product ObjectId. A value that is not a valid ObjectId raises a Mongoose `CastError`, which surfaces as a **500** |

**Query parameters:** none. **Request body:** none.

The lookup requires `status: "active"`, so an inactive product is reported as
missing rather than hidden behind a different error.

The two halves of the response are sized differently on purpose: `product`
carries 900 px `detail` images for the product page, while `relatedProducts`
carries 500 px `card` images for the strip beneath it. Related products exclude
the product itself and are the four newest in its category, so a product alone
in its category gets an empty array.

```json
{
  "status": "success",
  "data": {
    "product": {
      "_id": "68e2223344556677889900bb",
      "title": "Aashirvaad Multigrain Atta",
      "category": { "_id": "68c1112233445566778899aa", "name": "Staples" },
      "brand": "Aashirvaad",
      "stock": 24,
      "images": [
        {
          "url": "https://res.cloudinary.com/demo/image/upload/f_webp,q_auto,c_limit,w_900/v1/ecommerce-monster-video/products/atta.jpg",
          "publicId": "ecommerce-monster-video/products/atta",
          "isCover": true
        }
      ],
      "unit": "kg",
      "unitValue": 5,
      "status": "active"
    },
    "relatedProducts": []
  }
}
```

**Errors**

| Status | Message |
|---|---|
| 404 | `Product not found` — no **active** product has that id |
| 500 | the generic message, when `id` is not a valid ObjectId |

**Side effects:** none.

**Called by:** `getCustomerProductDetails` in
`mobile/src/features/customer/products/api.ts`.
