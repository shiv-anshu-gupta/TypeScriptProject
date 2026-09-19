# sKirana — Data model reference

Source of truth: `server/src/models/*.ts` (schemas) and `server/src/routes/**` (what
actually reads and writes them). Every claim below cites `path:line`.

Live-database facts (index lists, document counts, field usage) were read
read-only from the production `MONGO_URI` on **2026-09-19**. Counts move; the
*shape* observations are the point.

The database is MongoDB via Mongoose 9 (`server/src/db.ts:3-6`). One connection,
one database, no transactions anywhere in the codebase.

---

## 1. Overview

```mermaid
erDiagram
    USERS ||--o{ ADDRESSES : "embedded"
    USERS ||--o{ GROCERYLISTS : "user"
    USERS ||--o{ MESSAGES : "user"
    USERS ||--o| CARTS : "user (unique)"
    USERS ||--o| WISHLISTS : "user (unique)"
    USERS ||--o{ ORDERS : "user"
    USERS ||--o{ PRODUCTS : "createdBy"
    USERS ||--o{ BANNERS : "createdBy"

    CATEGORIES ||--o{ PRODUCTS : "category"

    GROCERYLISTS ||--o{ GROCERY_ITEMS : "embedded"
    GROCERYLISTS ||--o{ MESSAGES : "groceryList"

    CARTS ||--o{ CART_ITEMS : "embedded"
    PRODUCTS ||--o{ CART_ITEMS : "product"
    PRODUCTS ||--o{ ORDER_ITEMS : "product"
    PRODUCTS ||--o{ PRODUCT_IMAGES : "embedded"
    PRODUCTS }o--o{ WISHLISTS : "products[]"

    ORDERS ||--o{ ORDER_ITEMS : "embedded"
    ORDERS }o..o| PROMOS : "promoCode (string, not a ref)"

    BANNERS ||--o| BANNER_LINK : "embedded"
    BANNER_LINK }o..o| CATEGORIES : "targetId (string, soft)"
    BANNER_LINK }o..o| PRODUCTS : "targetId (string, soft)"
```

Solid lines are real `ObjectId` refs declared in a schema. Dotted lines are
*soft* pointers: a plain string that the code resolves by hand
(`server/src/models/Banner.ts:51`, `server/src/models/Order.ts:88-93`).

### Collections at a glance

| Collection | Model file | Live docs | Role |
|---|---|---|---|
| `users` | `server/src/models/User.ts:37` | 32 | People + addresses + push tokens + points |
| `products` | `server/src/models/Product.ts:63` | 84 | Catalogue |
| `categories` | `server/src/models/Category.ts:13` | 13 | Catalogue taxonomy |
| `grocerylists` | `server/src/models/GroceryList.ts:86` | 130 | **The live business object** — a customer's order |
| `messages` | `server/src/models/Message.ts:20` | 35 | Chat per grocery list, TTL 30 days |
| `banners` | `server/src/models/Banner.ts:38` | 4 | Home carousel |
| `orders` | `server/src/models/Order.ts:52` | 1 | Legacy cart-checkout order (see §5) |
| `carts` | `server/src/models/Cart.ts:44` | 2 | Legacy cart |
| `wishlists` | `server/src/models/Wishlist.ts:12` | 4 | Saved products |
| `promos` | `server/src/models/Promo.ts:16` | 3 | Discount codes |
| `customlists` | — none — | 0 | **Orphan.** No model, no code reference anywhere in the repo. Origin unverified; safe to ignore, probably safe to drop. |

There is **no** `pushtokens` / `adminpushtokens` collection. Push tokens are string
arrays on `users` — see §2.1.

---

## 2. Collections

### 2.1 `users` — `server/src/models/User.ts`

One record per person (customer or shopkeeper), created/kept in step with Clerk by
`server/src/services/user-sync.ts:66`.

| Field | Type | Default | Required | Meaning |
|---|---|---|---|---|
| `clerkUserId` | String | — | yes (`User.ts:41`) | Clerk's id for this person. Per Clerk **instance** — see the re-link trap in §4. |
| `name` | String | — | no (`User.ts:47`) | Display name. Customer-editable (`routes/customer/profile.routes.ts:48-54`). Null on some live docs. |
| `email` | String | — | no, but **unique** (`User.ts:54-60`) | Lower-cased, trimmed. The re-link key after a Clerk instance change. |
| `phone` | String | `""` | no (`User.ts:63-67`) | 10-digit Indian mobile, normalised (`utils/phone.ts:3-8`). |
| `role` | String enum | `"user"` | no (`User.ts:68-72`) | `user` \| `admin`. Set from `ADMIN_EMAILS` env at sync time (`services/user-sync.ts:31-38, 68-70, 92-95`). |
| `points` | Number | `0` | min 0 (`User.ts:73-77`) | Store credit. Credited on return (`routes/customer/orders.routes.ts:91-96`), debited at points checkout (`routes/customer/checkout-with-points.routes.ts:190-198`). |
| `addresses` | `[addressSchema]` | `[]` | no (`User.ts:78-81`) | Embedded, see below. |
| `pushTokens` | `[String]` | `[]` | no (`User.ts:83-86`) | Expo push tokens, one per mobile device. |
| `webPushTokens` | `[String]` | `[]` | no (`User.ts:89-92`) | FCM web-push tokens for admin browsers. |
| `createdAt` / `updatedAt` | Date | auto | — | `timestamps: true` (`User.ts:94`) |

**Embedded `addresses[]`** (`User.ts:5-35`) — `timestamps: false`, `_id` **not**
disabled, so each address has its own `_id`, which the address routes use as the
handle (`routes/customer/address.routes.ts:125`).

| Field | Type | Default | Required |
|---|---|---|---|
| `fullName` | String | — | yes (`User.ts:7-11`) |
| `address` | String | — | yes (`User.ts:12-16`) |
| `state` | String | — | yes (`User.ts:17-21`) |
| `postalCode` | String | — | yes (`User.ts:22-26`) |
| `isDefault` | Boolean | `false` | no (`User.ts:27-30`) |

**Indexes — declared:** `clerkUserId` unique (`User.ts:42-43`, note it is declared
*twice*: `unique: true` plus `index: true`, which yields one index), `email` unique
(`User.ts:57`).

**Indexes — live:** `_id_`, `clerkUserId_1` (unique), `email_1` (unique).
**No mismatch today.** The historical case is documented in the schema itself
(`User.ts:49-53`): `email_1` existed in the database as a legacy unique index
*before* anything in the code declared it, which is why a Clerk instance move
caused "User is not found in the DB" — a second record with the same email could
not be inserted. It is now declared, so the code says what the database enforces.

Live facts worth knowing: `email_1` is **not** sparse and **not** partial, so at
most *one* document may lack an email. Right now all 32 have one (0 null/empty,
0 missing), so nothing collides yet — but phone-only sign-up would break on the
second such user. 28 users have a phone, 23 have at least one `pushToken`,
**0 have a `webPushToken`** (so admin browser alerts currently reach nobody —
`utils/webPush.ts:86-94` returns early).

### 2.2 `products` — `server/src/models/Product.ts`

The shop catalogue. Products are browsable and wishlist-able; note that grocery
lists are free text and do **not** reference products at all.

| Field | Type | Default | Required | Meaning |
|---|---|---|---|---|
| `title` | String | — | yes (`Product.ts:65-69`) | Trimmed. Searched by case-insensitive regex (`routes/customer/product.routes.ts:67`). |
| `description` | String | — | yes (`Product.ts:70-74`) | |
| `category` | ObjectId → `Category` | — | yes (`Product.ts:75-79`) | |
| `brand` | String | — | yes (`Product.ts:80-84`) | Also a filter facet. |
| `stock` | Number | — | yes, min 0 (`Product.ts:85-89`) | Decremented on paid checkout, incremented on return. |
| `images` | `[productImageSchema]` | `[]` | no (`Product.ts:90-93`) | At least one is enforced in the route, not the schema (`routes/admin/product.routes.ts:200-202, 336-338`). |
| `colors` | `[String]` | `[]` | no (`Product.ts:94-97`) | Free text; a non-empty list makes colour mandatory at add-to-cart (`routes/customer/cart-wishlist.routes.ts:110-120`). |
| `sizes` | `[String]` enum | `[]` | no (`Product.ts:98-102`) | `S` \| `M` \| `L` \| `XL`. |
| `unit` | String enum | `"piece"` | no (`Product.ts:103-107`) | `kg` \| `g` \| `litre` \| `ml` \| `piece` \| `dozen` \| `pack`. |
| `unitValue` | Number | `1` | min 0 (`Product.ts:108-112`) | How much of `unit` is one sellable item (a 10 kg bag → `10` + `kg`). |
| `status` | String enum | `"active"` | no (`Product.ts:113-117`) | `active` \| `inactive`. Every customer-facing query filters `status: "active"`. |
| `createdBy` | ObjectId → `User` | — | yes (`Product.ts:118-122`) | The admin who added it. Never read back by any route. |
| `createdAt` / `updatedAt` | Date | auto | — | `Product.ts:124` |

**Embedded `images[]`** (`Product.ts:41-61`, `_id: false`): `url` (String, required),
`publicId` (String, required — the Cloudinary handle used for deletion),
`isCover` (Boolean, default `false`).

**Indexes — declared:** `{status:1, createdAt:-1}`, `{status:1, category:1, createdAt:-1}`,
`{status:1, brand:1, createdAt:-1}` (`Product.ts:136-138`; the comment at
`Product.ts:127-135` records the COLLSCAN they were added to fix).
**Indexes — live:** all three present, plus `_id_`. No mismatch.

Live facts: all 84 products are `active`. `unitValue` is **absent from 13 of 84
documents** — they predate the field; readers compensate with `?? 1`
(`routes/customer/home.routes.ts:140`). Unit spread: `pack` 40, `kg` 18, `piece` 11,
`g` 11, `ml` 4.

**Trap:** the two checkout routes price products from `price` and `salePercentage`
(`routes/customer/checkout.routes.ts:100, 121-126` and
`routes/customer/checkout-with-points.routes.ts:118, 139-143`). Neither field is in
the schema and **neither exists on any of the 84 live documents** (verified: 0 and 0).
The computed subtotal is therefore `NaN`. See §5.

### 2.3 `categories` — `server/src/models/Category.ts`

| Field | Type | Default | Required | Meaning |
|---|---|---|---|---|
| `name` | String | — | yes (`Category.ts:15-19`) | Bilingual in production, e.g. `"बेबी प्रोडक्ट्स / Baby Products"` (`scripts/rename-categories-bilingual.ts`). |
| `imageUrl` | String | `""` | no (`Category.ts:21-25`) | Shown in the app's category rail. |
| `imagePublicId` | String | `""` | no (`Category.ts:26-30`) | Cloudinary handle. |
| `createdAt` / `updatedAt` | Date | auto | — | `Category.ts:32` |

**Indexes — declared:** none. **Live:** `_id_` only. No mismatch.
`name` is **not** unique, in the schema or the database — duplicates are prevented
only by `scripts/seed-categories.ts:48` skipping names it already sees, and by the
admin not typing one twice. 13 live documents, all fields populated.

### 2.4 `grocerylists` — `server/src/models/GroceryList.ts`

The real order object. A customer writes free text (item + quantity, no price), the
shop prices it and sends it back. Holds **no photos**: a photographed paper list is
parsed to text in-request and the image is discarded (`GroceryList.ts:26-28`,
`routes/customer/grocery-list.routes.ts:74-77`).

| Field | Type | Default | Required | Meaning |
|---|---|---|---|---|
| `user` | ObjectId → `User` | — | yes (`GroceryList.ts:88-92`) | Owner. Every customer query scopes on it. |
| `customerName` | String | `""` | no (`GroceryList.ts:93-97`) | **Snapshot** taken at send time; falls back to email (`routes/customer/grocery-list.routes.ts:239`). |
| `customerEmail` | String | `""` | no (`GroceryList.ts:98-102`) | Snapshot. |
| `customerPhone` | String | `""` | no (`GroceryList.ts:103-107`) | Snapshot. Absent from 3 of 130 live docs. |
| `items` | `[GroceryListItemSchema]` | `[]` | no (`GroceryList.ts:108-111`) | See below. |
| `totalItems` | Number | — | **yes, min 1** (`GroceryList.ts:112-116`) | Kept in step by hand: `items.length` on add/remove (`routes/admin/grocery-list.routes.ts:466`, `routes/customer/grocery-list.routes.ts:364`). |
| `totalAmount` | Number | `0` | min 0 (`GroceryList.ts:117-121`) | `0` until priced; sum of *available* item prices. |
| `status` | String enum | `"received"` | no (`GroceryList.ts:122-134`) | `received` \| `priced` \| `packing` \| `packed` \| `ready` \| `completed` \| `cancelled`. |
| `paymentMethod` | String enum | `"at_shop"` | no (`GroceryList.ts:135-139`) | `online` \| `upi` \| `at_shop`. |
| `paymentStatus` | String enum | `"pending"` | no (`GroceryList.ts:140-144`) | `pending` \| `paid`. |
| `razorpayOrderId` | String | `""` | no (`GroceryList.ts:145-149`) | Set when the customer starts an online payment. |
| `paymentId` | String | `""` | no (`GroceryList.ts:150-154`) | Razorpay payment id after verification. |
| `seenByCustomer` | Boolean | `true` | no (`GroceryList.ts:155-158`) | Drives the app's badge; every shop-side write sets it `false`. |
| `note` | String | `""` | no (`GroceryList.ts:159-163`) | Max 300 chars, enforced in the route (`utils/sanitizeItem.ts:11`). Merged sends append with `" \| "` (`routes/customer/grocery-list.routes.ts:209-213`). |
| `pricedAt` | Date \| null | `null` | no (`GroceryList.ts:164-167`) | |
| `packedAt` | Date \| null | `null` | no (`GroceryList.ts:168-171`) | |
| `readyAt` | Date \| null | `null` | no (`GroceryList.ts:172-175`) | |
| `completedAt` | Date \| null | `null` | no (`GroceryList.ts:176-179`) | |
| `paidAt` | Date \| null | `null` | no (`GroceryList.ts:180-183`) | Drives the dashboard sales-per-day chart (`routes/admin/dashboard.routes.ts:101-104`). |
| `createdAt` / `updatedAt` | Date | auto | — | `GroceryList.ts:185`. `updatedAt` is the admin list's sort key, because merges keep `createdAt` (`routes/admin/grocery-list.routes.ts:91-96`). |

**Embedded `items[]`** (`GroceryList.ts:56-84`, `_id: false`):

| Field | Type | Default | Required | Meaning |
|---|---|---|---|---|
| `name` | String | — | yes | Sanitised item text (≤ 60 chars). |
| `quantity` | String | `""` | no | **Free text**: `"2 kg"`, `"1 packet"` (≤ 12 chars). |
| `rate` | Number | `0` | min 0 | Optional per-unit price. |
| `price` | Number | `0` | min 0 | Line total; `0` until priced, and `0` for anything out of stock. |
| `available` | Boolean | `true` | no | `false` = shop marked it out of stock; it stays on the list but is never charged. |

**Indexes — declared:** `{user:1, createdAt:-1}`, `{status:1, createdAt:-1}`
(`GroceryList.ts:188-189`). **Live:** both present plus `_id_`. No mismatch.
Note the admin list page sorts by `updatedAt` (`routes/admin/grocery-list.routes.ts:95`)
and no index covers that.

Live facts (130 docs): status `received` 78, `completed` 15, `priced` 13,
`cancelled` 9, `packing` 9, `ready` 5, `packed` 1. Payment: `pending` 113,
`paid` 17. Method: `at_shop` 110, `upi` 17, `online` 3. Item sub-fields `rate` and
`available` are absent from older lists (present on the first item of 75 and 79 of
130 respectively) — readers normalise with `rate ?? 0` and `available !== false`
(`routes/admin/grocery-list.routes.ts:70-72`).

### 2.5 `messages` — `server/src/models/Message.ts`

One chat message on one grocery list. Deliberately its own collection so a long
conversation never bloats the order document (`Message.ts:3-5`).

| Field | Type | Default | Required | Meaning |
|---|---|---|---|---|
| `groceryList` | ObjectId → `GroceryList` | — | yes (`Message.ts:22-26`) | The conversation it belongs to. |
| `user` | ObjectId → `User` | — | yes (`Message.ts:27-31`) | The **customer** who owns the list, on both directions of the chat (`routes/admin/grocery-list.routes.ts:574`). Used for scoping and push. |
| `sender` | String enum | — | yes (`Message.ts:32-36`) | `customer` \| `staff`. |
| `senderName` | String | `""` | no (`Message.ts:37-41`) | Snapshot; `SHOP_NAME` env for staff (`routes/admin/grocery-list.routes.ts:571`). |
| `text` | String | — | yes, **maxlength 1000** (`Message.ts:42-47`) | Also checked in both routes before save. |
| `createdAt` / `updatedAt` | Date | auto | — | `Message.ts:49` |

**Indexes — declared:** `{groceryList:1, createdAt:1}` (`Message.ts:53`) and a **TTL**
index `{createdAt:1}` with `expireAfterSeconds = 2592000` (30 days) (`Message.ts:58-59`).
**Live:** `groceryList_1_createdAt_1` and `createdAt_1` with `ttl:2592000s`, plus
`_id_`. No mismatch.

The TTL is a **hard delete performed by MongoDB itself** — no cron, no code, no
audit trail. Chat older than 30 days is simply gone, while the grocery list it
belonged to stays. Expect `messages` → `grocerylists` to resolve, never the reverse.

### 2.6 `banners` — `server/src/models/Banner.ts`

Home-carousel images.

| Field | Type | Default | Required | Meaning |
|---|---|---|---|---|
| `imageUrl` | String | — | yes (`Banner.ts:40`) | Cloudinary URL; re-sized per request by `cdnImage(..., "banner")`. |
| `imagePublicId` | String | — | yes (`Banner.ts:41`) | Cloudinary handle, deleted with the banner. |
| `title` | String | `""` | no, maxlength 80 (`Banner.ts:42`) | Admin's label; also the screen-reader text. |
| `isActive` | Boolean | `true` | no (`Banner.ts:43`) | Hidden banners stay in the admin list but never reach the app. |
| `sortOrder` | Number | `0` | no, **indexed** (`Banner.ts:44`) | Carousel position, 0 first. |
| `link.type` | String enum | `"none"` | no (`Banner.ts:46-50`) | `none` \| `writeList` \| `shop` \| `category` \| `product`. |
| `link.targetId` | String | — | no (`Banner.ts:51`) | **Plain string, not a ref.** Validated to be a live Category/Product id at write time (`routes/admin/settings.routes.ts:150-163`). |
| `startsAt` | Date \| null | `null` | no (`Banner.ts:53`) | Optional schedule window. |
| `endsAt` | Date \| null | `null` | no (`Banner.ts:54`) | Must be after `startsAt` (route-enforced, `settings.routes.ts:267-269`). |
| `createdBy` | ObjectId → `User` | — | yes (`Banner.ts:55`) | Never read back. |
| `createdAt` / `updatedAt` | Date | auto | — | `Banner.ts:57` |

`liveBannerFilter(now)` (`Banner.ts:62-70`) is what the app sees: `isActive: {$ne:false}`
and inside the window, written so that documents predating these fields still count
as visible and unscheduled. `HOME_BANNER_LIMIT = 8` (`Banner.ts:73`).

**Indexes — declared:** `sortOrder` (`Banner.ts:44`). **Live:** `sortOrder_1` plus
`_id_`. No index mismatch.

**Document mismatch, though:** all **4 live banner documents contain only**
`_id`, `imageUrl`, `imagePublicId`, `createdBy`, `createdAt`, `updatedAt`, `__v`.
They have **no** `title`, `isActive`, `sortOrder`, `link`, `startsAt` or `endsAt`.
Everything that reads them uses `?? `/`!== false` fallbacks, so this is invisible
until you query directly. Also note `listBanners()` **writes** when it detects
colliding positions: opening the admin banners page backfills `sortOrder` 0..n via
`bulkWrite` (`routes/admin/settings.routes.ts:127-142`). Since the live docs still
have no `sortOrder`, that backfill has not run on production yet — a GET will
mutate 4 documents the first time.

### 2.7 `orders` — `server/src/models/Order.ts`

The classic cart → Razorpay → delivery order. **Effectively legacy** (see §5):
1 live document, `placed`/`pending`, created 2025. The admin dashboard now counts
grocery lists as orders (`routes/admin/dashboard.routes.ts:21-40`).

| Field | Type | Default | Required | Meaning |
|---|---|---|---|---|
| `user` | ObjectId → `User` | — | yes (`Order.ts:54-58`) | |
| `customerName` | String | `""` | no (`Order.ts:59-63`) | Snapshot. |
| `customerEmail` | String | `""` | no (`Order.ts:64-68`) | Snapshot. |
| `items` | `[OrderItemsSchema]` | `[]` | no (`Order.ts:69-72`) | `{ product: ObjectId→Product (req), quantity: Number (req, min 1) }`, `_id:false` (`Order.ts:35-50`). |
| `totalItems` | Number | — | yes, min 1 (`Order.ts:73-77`) | Sum of quantities, not line count. |
| `deliveryName` | String | — | yes (`Order.ts:78-82`) | Copied from the chosen address. |
| `deliveryAddress` | String | — | yes (`Order.ts:83-87`) | Flattened `"address, state, postalCode"` (`routes/customer/checkout.routes.ts:174-180`). |
| `promoCode` | String | `""` | no, uppercased (`Order.ts:88-93`) | **A code string, not a ref to `promos`.** |
| `discountAmount` | Number | `0` | min 0 (`Order.ts:94-98`) | |
| `totalAmount` | Number | — | yes, min 0 (`Order.ts:99-103`) | |
| `paymentStatus` | String enum | `"pending"` | no (`Order.ts:104-108`) | `pending` \| `paid` \| `failed` — **nothing in the codebase ever writes `failed`** (grepped across `routes/` and `services/`). |
| `orderStatus` | String enum | `"placed"` | no (`Order.ts:109-113`) | `placed` \| `shipped` \| `delivered` \| `returned`. |
| `razorpayOrderId` | String | — | **yes** (`Order.ts:114-118`) | For points-paid orders this is a synthetic `points_<timestamp>` (`routes/customer/checkout-with-points.routes.ts:235, 258`). |
| `paymentId` | String | `""` | no (`Order.ts:119-123`) | |
| `paidAt` / `deliveredAt` / `returnedAt` | Date \| null | `null` | no (`Order.ts:124-135`) | |
| `createdAt` / `updatedAt` | Date | auto | — | `Order.ts:137` |

**Indexes — declared:** `{user:1,createdAt:-1}`, `{orderStatus:1,createdAt:-1}`,
`{paymentStatus:1,createdAt:-1}` (`Order.ts:140-142`). **Live:** all three plus
`_id_`. No mismatch.

### 2.8 `carts` — `server/src/models/Cart.ts`

One cart per user. Legacy alongside `orders`.

| Field | Type | Default | Required | Meaning |
|---|---|---|---|---|
| `user` | ObjectId → `User` | — | yes, **unique** (`Cart.ts:46-51`) | One cart per person. |
| `items` | `[cartItemSchema]` | `[]` | no (`Cart.ts:52-55`) | |
| `createdAt` / `updatedAt` | Date | auto | — | `Cart.ts:57` |

**Embedded `items[]`** (`Cart.ts:20-42`, `_id:false`): `product` (ObjectId → Product,
required), `quantity` (Number, required, min 1), `color` (String, optional),
`size` (String enum `S|M|L|XL`, optional). Identity of a line is
`(product, color, size)` (`routes/customer/cart-wishlist.routes.ts:137-148`).

**Indexes — declared:** `user` unique. **Live:** `user_1` unique plus `_id_`. No mismatch.
Emptied wholesale on successful checkout (`routes/customer/checkout.routes.ts:280`).

### 2.9 `wishlists` — `server/src/models/Wishlist.ts`

| Field | Type | Default | Required | Meaning |
|---|---|---|---|---|
| `user` | ObjectId → `User` | — | yes, **unique** (`Wishlist.ts:14-19`) | One wishlist per person. |
| `products` | `[ObjectId → Product]` | `[]` | no (`Wishlist.ts:20-28`) | Flat array of ids; de-duplicated in the route (`routes/customer/cart-wishlist.routes.ts:477-484`), not by the schema. |
| `createdAt` / `updatedAt` | Date | auto | — | `Wishlist.ts:30` |

**Indexes — declared:** `user` unique. **Live:** `user_1` unique plus `_id_`. No mismatch.

### 2.10 `promos` — `server/src/models/Promo.ts`

| Field | Type | Default | Required | Meaning |
|---|---|---|---|---|
| `code` | String | — | yes, **unique**, uppercase, trim (`Promo.ts:18-24`) | The key customers type. |
| `percentage` | Number | — | yes, min 1, max 100 (`Promo.ts:25-30`) | |
| `count` | Number | — | yes, **min 1** (`Promo.ts:31-35`) | Remaining redemptions. |
| `minimumOrderValue` | Number | — | yes, min 0 (`Promo.ts:36-40`) | |
| `startsAt` | Date | — | yes (`Promo.ts:41-44`) | |
| `endsAt` | Date | — | yes (`Promo.ts:45-48`) | Must be after `startsAt` (route, `routes/admin/promo.routes.ts:69-71`). |
| `createdAt` / `updatedAt` | Date | auto | — | `Promo.ts:50` |

**Indexes — declared:** `code` unique. **Live:** `code_1` unique plus `_id_`. No mismatch.

**Trap:** redemption does `$inc: {count: -1}` through `updateOne`
(`routes/customer/checkout.routes.ts:269-277`), which runs **no validators**, so
`count` can legitimately sit at `0` in the database despite the schema's `min: 1`.
That is the intended "used up" state — `count: {$gt: 0}` is the real gate
(`routes/customer/promo.routes.ts:44`, `routes/customer/home.routes.ts:111`).

### 2.11 Push tokens — no collection of their own

There is no `PushToken` or `AdminPushToken` model. Tokens are arrays on `users`:

* Customer devices (Expo): `users.pushTokens`, written with `$addToSet`/`$pull`
  in `routes/customer/push-token.routes.ts:22-25, 40-43`, read in `utils/push.ts:67-71`.
* Admin browsers (FCM web push): `users.webPushTokens`, written in
  `routes/admin/push-token.routes.ts:21-24, 38-41`, read in `utils/webPush.ts:86-89`,
  and **self-pruning** — tokens FCM reports as dead are `$pull`ed from *every* admin
  (`utils/webPush.ts:97-102`).

---

## 3. Relationships, ownership and cascades

**Ownership.** `users._id` is the owner key for `grocerylists`, `messages`, `carts`,
`wishlists` and `orders`. Every customer route re-queries with `user: dbUser._id`
rather than trusting an id from the client (e.g.
`routes/customer/grocery-list.routes.ts:337, 385, 498`). Admin routes are ungated by
owner — `requireAdmin` (`middleware/auth.ts:39-49`) sees everything.

| From → To | Kind | On delete of the target |
|---|---|---|
| `products.category` → `categories` | hard ref, required | **Blocked.** Category deletion 400s while any product points at it (`routes/admin/product.routes.ts:115-126`). |
| `carts.items.product` → `products` | hard ref | **No cascade.** Deleted products leave dangling ids; `populate` yields `null` and the row is dropped at read time (`routes/customer/cart-wishlist.routes.ts:64-66`). |
| `wishlists.products[]` → `products` | hard ref | **No cascade.** Same null-guard (`routes/customer/cart-wishlist.routes.ts:93-97`). |
| `orders.items.product` → `products` | hard ref | **No cascade.** Return-to-stock silently no-ops on a missing product (`routes/customer/orders.routes.ts:84-89`). |
| `banners.link.targetId` → category/product | soft string | **No cascade.** The app degrades the tap action to `none` when the target is gone or inactive (`routes/customer/home.routes.ts:42-51`). The admin view shows a stale id with no name (`routes/admin/settings.routes.ts:80-101`). |
| `messages.groceryList` → `grocerylists` | hard ref | **No cascade either way** — and nothing deletes a grocery list at all. Messages disappear on their own via TTL (`Message.ts:58-59`). |
| `orders.promoCode` → `promos.code` | soft string | No cascade; a deleted promo leaves the code as a historical label. |
| `products.createdBy`, `banners.createdBy` → `users` | hard ref | No cascade; never read back. |

**Nothing deletes a `User`, `GroceryList`, `Message`, `Cart`, `Wishlist` or `Order`.**
The only delete operations in the whole server are category, product, promo and
banner (`routes/admin/product.routes.ts:128, 383`, `routes/admin/promo.routes.ts:171`,
`routes/admin/settings.routes.ts:282`). Banner delete also removes the Cloudinary
image best-effort, swallowing failures (`settings.routes.ts:287-291`).

**Cascading *updates* that do exist:**

* Editing your profile rewrites the denormalised `customerName`/`customerPhone` on
  all your **open** grocery lists; `completed` and `cancelled` ones keep the old
  snapshot on purpose (`routes/customer/profile.routes.ts:70-81`).
* Sending a list may **update an existing list instead of creating one** (the merge
  window, §4).
* Clerk re-link rewrites `users.clerkUserId` in place, so everything already pointing
  at that `_id` follows the person automatically (`services/user-sync.ts:103-117`).
* `scripts/seed.ts:230-233` `deleteMany`s Banners, Categories, Products and Promos.
  It is a destructive dev script pointed at whatever `MONGO_URI` is in the env.

**Cloudinary leaks** (files the database forgets about): replacing a category image
does not delete the old one (`routes/admin/product.routes.ts:91-98`), and deleting a
product does not delete its images (`routes/admin/product.routes.ts:373-386`).
Product *edits* do clean up removed images (`product.routes.ts:326-332`).

---

## 4. Invariants and traps enforced in code, not in the schema

| Invariant | Where it lives |
|---|---|
| Item name/quantity are stripped of control, zero-width and bidi characters, then reduced to an allowlist of letters (any script, incl. Devanagari marks), digits and `. , & ' - / ( ) % ×` | `utils/sanitizeItem.ts:18-45, 55-69` |
| Objects/arrays in a string field collapse to `""`, so a `{$gt:""}` payload can never reach a query | `utils/sanitizeItem.ts:60-64` |
| Name ≥ 2 chars, name ≤ 60, quantity ≤ 12, note ≤ 300, ≤ 50 items per send, ≤ 100 items per list, ≤ 500 raw rows accepted | `utils/sanitizeItem.ts:7-13, 80-99`; applied at `routes/customer/grocery-list.routes.ts:152-153, 195-200` and `routes/admin/grocery-list.routes.ts:447-453` |
| **Merge window:** a new send merges into your existing `received` + `pending` list if that list was touched in the last 6 hours; otherwise it opens a new one. This is why two visits can share one `_id`, and why `createdAt` is not the admin sort key | `routes/customer/grocery-list.routes.ts:173-234` |
| Pricing must send exactly as many items as the list holds; names/quantities are taken from the stored list, only price/rate from the shop | `routes/admin/grocery-list.routes.ts:146-173` |
| An unavailable item is always priced `0` and excluded from the total | `routes/admin/grocery-list.routes.ts:169-171, 351-354` |
| A list cannot be priced to a total below ₹1 | `routes/admin/grocery-list.routes.ts:180-183` |
| A list cannot be moved past `received`/`priced` (except to `cancelled`) until `totalAmount ≥ 1` | `routes/admin/grocery-list.routes.ts:231-233` |
| A list cannot be marked paid before it is priced | `routes/admin/grocery-list.routes.ts:280-282` |
| `completed` / `cancelled` lists reject item edits and additions — but **not** further status changes | `routes/admin/grocery-list.routes.ts:389-391, 443-445` |
| A customer may remove an item only while `received`/`priced`, only while unpaid, and never down to zero items | `routes/customer/grocery-list.routes.ts:340-357` |
| `seenByCustomer` is forced to `false` on every shop-side write (price, status, mark-paid, availability, item edit, item add) | `routes/admin/grocery-list.routes.ts:188, 249, 295, 355, 419, 467` |
| Razorpay payments are only accepted after an HMAC-SHA256 signature check against the stored `razorpayOrderId` | `routes/customer/grocery-list.routes.ts:466-477`, `routes/customer/checkout.routes.ts:239-250` |
| Phone numbers are normalised to 10 digits starting 6-9 (strips `+91`/leading `0`) and rejected otherwise | `utils/phone.ts:3-8`, used at `routes/customer/profile.routes.ts:57-62` and `routes/customer/grocery-list.routes.ts:142-147` |
| Stock decrements are conditional (`stock: {$gte: qty}`) so two concurrent checkouts cannot oversell | `routes/customer/checkout.routes.ts:252-266` |
| Points debits are conditional (`points: {$gte: total}`) with a compensating credit if any later step throws — the closest thing to a transaction in the codebase | `routes/customer/checkout-with-points.routes.ts:190-202, 273-283` |
| Returns are allowed only on `delivered` orders within 7 days of `deliveredAt` | `routes/customer/orders.routes.ts:71-82` |
| `role: "admin"` is derived from the `ADMIN_EMAILS` env var at every sync, not set by hand | `services/user-sync.ts:31-38, 68-70, 92-95, 111` |
| Re-link by email requires a **verified** email, otherwise anyone could claim another person's record | `services/user-sync.ts:100-118` |
| Request bodies are capped at 100 kb before they reach any handler | `server.ts:49` |
| Search strings are regex-escaped before being used as `$regex` | `utils/regex.ts` via `routes/customer/product.routes.ts:67`, `routes/admin/product.routes.ts:143` |

**Known bugs that shape the data** (report, not guesswork — read the lines):

* `routes/customer/cart-wishlist.routes.ts:210` — `if (itemIndex > 0)` should be
  `>= 0`. Re-adding the **first** line of a cart pushes a duplicate row instead of
  increasing its quantity, so `carts.items` can hold two rows with identical
  `(product, color, size)`.
* `routes/customer/cart-wishlist.routes.ts:382` — `cart.create(...)` is called on a
  `cart` that is `null` at that point; `/cart/sync` throws for any user without a
  cart. The `res.json` at line 439 is also inside the `for` loop, so the route
  responds once per item and never at all for an empty payload.
* `routes/customer/home.routes.ts:113` — promos are sorted by `createAt` (sic), a
  field that does not exist; the sort is a no-op.
* `routes/admin/grocery-list.routes.ts:320-371` — marking an item unavailable does
  not change `totalItems`, which is correct (the item stays on the list), but
  `totalItems` and `items.length` can still drift from historical writes; treat
  `items.length` as the truth and `totalItems` as a cached copy.

---

## 5. Lifecycles

### GroceryList `status`

Created as `received` (`routes/customer/grocery-list.routes.ts:245`). Pricing is its
own endpoint and is the only way to reach `priced`
(`routes/admin/grocery-list.routes.ts:186`). Everything else goes through
`PATCH /grocery-lists/:id/status`, whose allowed target set is flat — the only guard
is `totalAmount ≥ 1` (`routes/admin/grocery-list.routes.ts:34-40, 224-233`).

```mermaid
stateDiagram-v2
    [*] --> received : customer sends a list
    received --> received : re-send within 6h (merge)
    received --> priced : PATCH /prices, total >= 1
    priced --> packing
    packing --> packed : sets packedAt
    packed --> ready : sets readyAt
    ready --> completed : sets completedAt
    completed --> [*]

    received --> cancelled : allowed even unpriced
    priced --> cancelled
    packing --> cancelled
    packed --> cancelled
    ready --> cancelled
    cancelled --> [*]

    note right of priced
        The admin endpoint accepts any of
        packing / packed / ready / completed / cancelled
        from any state. The arrows above are the intended
        path, not a constraint the code enforces.
        Only guard: totalAmount >= 1 unless cancelling.
        There is no route back to received or priced.
    end note
```

### Payment status (`grocerylists.paymentStatus`)

```mermaid
stateDiagram-v2
    [*] --> pending : list created (paymentMethod = at_shop)
    pending --> pending : PATCH /pay-at-shop (method = at_shop)
    pending --> pending : POST /pay-online (method = online, stores razorpayOrderId)
    pending --> paid : POST /confirm-payment, valid HMAC signature
    pending --> paid : PATCH /mark-paid by the shop
    paid --> [*]

    note right of paid
        confirm-payment: method = online, stores paymentId, paidAt
          (routes/customer/grocery-list.routes.ts:479-483)
        mark-paid: paidAt set, and at_shop is rewritten to upi
          (routes/admin/grocery-list.routes.ts:289-295)
        No code path ever moves paid back to pending.
        Both endpoints are idempotent: an already-paid list
        returns success without rewriting anything.
    end note
```

`orders.paymentStatus` has a third value, `failed`, that nothing ever writes
(`server/src/models/Order.ts:106`).

### Why `orders`/`carts` count as legacy

The mobile app's whole order flow is grocery lists. The admin dashboard computes
"orders", "pending", "completed" and "total sales" from `grocerylists`, not `orders`
(`routes/admin/dashboard.routes.ts:21-40`). The cart checkout routes are still
mounted (`server.ts:81-82`) but price products from `price`/`salePercentage`, fields
that exist in neither the schema nor any of the 84 live product documents — so the
subtotal they compute is `NaN`. Live counts agree: 1 order, 2 carts, 130 grocery lists.

---

## 6. If you are adding a field

A field has to be added in four or five places before it reaches a screen. Missing
any one of them fails silently — usually as `undefined` in the UI, not an error.

1. **Schema** — `server/src/models/<Model>.ts`. Give it a default. Existing
   documents will **not** have it (see `unitValue`, 71/84, and every banner field),
   so readers must tolerate absence; a default in the schema only applies to new
   writes and to Mongoose-hydrated reads, not to `.lean()` results or raw driver reads.
2. **Route mapper** — the hand-written `mapX` function that converts a document to
   the API shape. Fields not listed there never leave the server:
   * `routes/admin/grocery-list.routes.ts:51-87` (`mapGroceryList`, admin)
   * `routes/customer/grocery-list.routes.ts:33-58` (`mapGroceryList`, customer)
   * `routes/admin/settings.routes.ts:103-122` (`mapBanner`)
   * `routes/customer/home.routes.ts:42-59, 121-151` (home payload)
   * `routes/customer/address.routes.ts:18-27` (`mapAddress`)
   * `routes/admin/promo.routes.ts:21-32` (`mapPromo`)
   * `routes/customer/profile.routes.ts:20-26` (`mapProfile`)
3. **Projections** — anything with `.select("...")` or `.lean<RowType>()` silently
   drops your field even when the mapper asks for it. Check
   `routes/customer/orders.routes.ts:34-36`, `routes/admin/orders.routes.ts:42-44`,
   `routes/customer/home.routes.ts:104`, `routes/admin/dashboard.routes.ts:86`.
4. **Mobile types** — `mobile/src/features/customer/<feature>/types.ts`
   (e.g. `mobile/src/features/customer/grocery-list/types.ts:32-49` for a list field).
5. **Admin web types** — `client/src/features/<area>/<feature>/types.ts`
   (e.g. `client/src/features/admin/grocery-lists/types.ts:39-59`), plus the request
   body type if the admin writes the field
   (`client/src/features/admin/grocery-lists/types.ts:77-88`).

If the field must be queryable or sortable, add an index in the same commit and
remember the declared/live gap: **indexes only appear in the database when a process
with that model actually connects and `autoIndex` runs**. Verify against the live
cluster before assuming a declared index exists.

---

## 7. Multi-tenant readiness

Classification only: what each collection would have to become if several shops each
ran their own catalogue and their own lists in this one database. No migration design.

| Collection | Classification | Reason |
|---|---|---|
| `users` | **Stays global** (identity), **plus a new join** for staff | A person is identified by their Clerk id and email, which are instance-wide, and a customer may shop at several shops. But `role` is a single global flag (`User.ts:68-72`) and admin-ness comes from one `ADMIN_EMAILS` env list (`services/user-sync.ts:31-38`) — that has to become a per-shop membership/role join. `webPushTokens` targeting already broadcasts to *every* admin (`utils/webPush.ts:86-89`). |
| `products` | **Shop-scoped** | Each shop owns its catalogue; every customer query would need `shop` as the leading key, which also means all three compound indexes (`Product.ts:136-138`) get re-fronted by `shop`. |
| `categories` | **Shop-scoped** | Category CRUD is per-catalogue and the delete guard counts only that catalogue's products (`routes/admin/product.routes.ts:115-126`). A shared taxonomy is possible but would need a per-shop join to decide which categories a shop shows — more work, not less. |
| `grocerylists` | **Shop-scoped** | A list is addressed to one shopkeeper. The admin view is an unfiltered `GroceryList.find()` (`routes/admin/grocery-list.routes.ts:94`), which would leak every shop's orders without a scope. Both declared indexes would need `shop` prefixed. |
| `messages` | **Shop-scoped, needs a denormalised shop field** | Scope is inherited from the parent list, so correctness only needs the list. But the conversations view aggregates the *whole* `messages` collection before joining lists (`routes/admin/grocery-list.routes.ts:487-503`) — with no `shop` on the message itself, that aggregation cannot be scoped or indexed. |
| `banners` | **Shop-scoped** | The Home carousel is the shop's own shopfront, and `link.targetId` points at that shop's products/categories (`routes/admin/settings.routes.ts:150-163`). |
| `promos` | **Shop-scoped** | A discount is the shop's money. The `code` unique index (`Promo.ts:18-24`) must become unique per `(shop, code)`, or two shops can never use "DIWALI10". |
| `orders` | **Shop-scoped** (legacy) | Same reasoning as grocery lists; the admin list is unfiltered (`routes/admin/orders.routes.ts:41`). Low priority — 1 live document. |
| `carts` | **Needs a changed key** | A cart holds products that belong to one shop, so it becomes per `(user, shop)`. The `user` unique index (`Cart.ts:46-51`) blocks that today and must become a compound unique. |
| `wishlists` | **Stays global** | It is a flat list of product ids, and each product already carries its own shop, so a single per-user wishlist spanning shops reads correctly with no new field. `user` unique (`Wishlist.ts:14-19`) stays valid. |
| `users.pushTokens` | **Stays global** | A token identifies a device, not a shop relationship; per-shop targeting is a query over the membership join, not a change to the array. |
| `users.webPushTokens` | **Needs the staff join** | It is read by `role: "admin"` across all users (`utils/webPush.ts:86-89`); with several shops that alerts the wrong shopkeepers. |
| `users.addresses` | **Stays global** | A delivery address belongs to the person (`User.ts:5-35`). |
| `customlists` | **Drop** | Empty, no model, no reference in the repo. |

---

*Anything not stated above was not verified. Live-database numbers are a snapshot
of 2026-09-19 and should be re-read before you rely on them.*
