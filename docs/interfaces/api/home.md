# Home {#home-router}

`server/src/routes/customer/home.routes.ts` · exported as `customerHomeRouter` ·
mounted at `/customer` in `mainEntryFunction` (`server/src/server.ts`), and
mounted **first** among the eleven customer routers.

## What this router owns

The single payload behind the app's home screen: banners, categories, the
newest products and the live coupons, in one response.

## Who may call it

Anyone. The router deliberately calls neither `requireAuth` nor `requireAdmin`,
because the home screen is the first thing the app draws, before Clerk has
produced a token.

This is one of only two bounded reads in the whole API — eight banners, four
products, four coupons. The other is
[`GET /admin/grocery-lists/conversations`](grocery-lists-admin.md#get-conversations).

Everything here is shaped by hand rather than by the shared product and
category mappers, so the keys do not match
[`/customer/products`](products-customer.md) or
[`/customer/categories`](products-customer.md).

---

## `GET /customer/home` {#get-customer-home}

**Auth:** public.

**Path parameters:** none. **Query parameters:** none. **Request body:** none.

Four independent queries run in parallel through `Promise.all`.

| Section | Query | Limit | Image size |
|---|---|---|---|
| `banners` | `liveBannerFilter(now)` from `server/src/models/Banner.ts`, sorted by `sortOrder` then newest | `HOME_BANNER_LIMIT` = 8 | `banner`, 1200 px |
| `categories` | all of them, sorted A to Z by `name` | none | `thumb`, 200 px |
| `recentProducts` | `status: "active"`, newest first | 4 | `card`, 500 px |
| `coupons` | window covers now and `count` is above zero | 4 | — |

`liveBannerFilter` is written loosely on purpose, so that banners saved before
these fields existed still count as visible and unscheduled: `isActive` is
tested with `$ne: false`, and each date as "null or in the right direction".

### Banner tap targets

`resolveBannerLinks` checks that each banner's tap target still exists before
the banner goes out. A `category` link keeps its `targetId` only when that
category is still there; a `product` link also requires the product to still be
`active`. Anything else collapses to `{ "type": "none" }`, so a tap never lands
on an empty page. Link types that need no target — `none`, `writeList` and
`shop` — are passed through with the `type` alone, so `targetId` is absent
rather than null.

At most two lookups, batched with `$in`, and skipped entirely when no banner
uses that link type.

### Response

```json
{
  "status": "success",
  "data": {
    "banners": [
      {
        "_id": "68d9a1b2c3d4e5f6a7b8c9d0",
        "imageUrl": "https://res.cloudinary.com/demo/image/upload/f_webp,q_auto,c_limit,w_1200/v1/ecommerce-monster-video/banners/diwali.jpg",
        "title": "diwali offer",
        "link": { "type": "category", "targetId": "68c1112233445566778899aa" },
        "createdAt": "2026-09-01T06:15:22.104Z"
      }
    ],
    "categories": [
      {
        "_id": "68c1112233445566778899aa",
        "name": "बेबी प्रोडक्ट्स / Baby Products",
        "imageUrl": "https://res.cloudinary.com/demo/image/upload/f_webp,q_auto,c_limit,w_200/v1/ecommerce-monster-video/categories/baby.jpg"
      }
    ],
    "recentProducts": [
      {
        "_id": "68e2223344556677889900bb",
        "title": "Aashirvaad Multigrain Atta",
        "brand": "Aashirvaad",
        "image": "https://res.cloudinary.com/demo/image/upload/f_webp,q_auto,c_limit,w_500/v1/ecommerce-monster-video/products/atta.jpg",
        "unit": "kg",
        "unitValue": 5,
        "createAt": "2026-09-17T11:02:44.907Z"
      }
    ],
    "coupons": [
      {
        "_id": "68d0000011112222333344cc",
        "code": "DIWALI10",
        "percentage": 10,
        "count": 42,
        "minimumOrderValue": 500,
        "endsAt": "2026-11-05T18:30:00.000Z"
      }
    ]
  }
}
```

???+ warning "Two naming traps for callers"
    **The product timestamp is emitted as `createAt`, without the "e".** It is
    a mapper key, not the `createdAt` field on the document. A client reading
    `createdAt` there gets `undefined`.

    **The coupon query sorts by that same misspelling.** `Promo` has no
    `createAt` field in `server/src/models/Promo.ts`, so the sort is a no-op
    and *which* four live coupons come back is unspecified rather than "the
    newest four".

`unitValue` falls back to `1` when a product does not set one — 13 of the 84
live products predate the field, so this matters.

**Errors:** none of its own. The generic 500 applies.

**Side effects:** none. No database write, no Cloudinary call, no Gemini call,
no push, no Telegram. Image URLs are rewritten by `cdnImage` in
`server/src/utils/cloudinary.ts`, which is pure string work — Cloudinary builds
the derivative the first time the URL is fetched, by the client.

**Called by:** `getCustomerHomeDateOverview` in
`mobile/src/features/customer/home/api.ts`. The admin web defines the same
function in `client/src/features/customer/home/api.ts`, but nothing routed can
reach it — see [the legacy page](legacy-cart-checkout-orders.md#dead-island).
