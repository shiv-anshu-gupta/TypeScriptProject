# Cart, checkout, orders and wishlist {#legacy}

Five routers, all mounted at `/customer` or `/admin` in `mainEntryFunction`
(`server/src/server.ts`).

| Router | File | Symbol | Paths |
|---|---|---|---|
| Cart and wishlist | `server/src/routes/customer/cart-wishlist.routes.ts` | `customerCartWishlistRouter` | `/customer/cart` and `/customer/wishlist` and below |
| Promo check | `server/src/routes/customer/promo.routes.ts` | `customerPromoRouter` | `/customer/promos/apply` |
| Razorpay checkout | `server/src/routes/customer/checkout.routes.ts` | `customerCheckoutRouter` | `/customer/checkout/create-session` and `/customer/checkout/confirm` |
| Points checkout | `server/src/routes/customer/checkout-with-points.routes.ts` | `customerCheckoutWithPointsRouter` | `/customer/checkout/points` and `/customer/checkout/pay-with-points` |
| Orders | `server/src/routes/customer/orders.routes.ts` and `server/src/routes/admin/orders.routes.ts` | `customerOrderRouter` and `adminOrderRouter` | `/customer/orders` and `/admin/orders` and below |

This is the inherited e-commerce flow: pick from the catalogue, apply a promo
code, pay with Razorpay, then track delivery. The shop does not run on it. It
runs on [grocery lists](grocery-lists-customer.md), and the
[dashboard](dashboard.md) counts those as "orders".

---

## What no shipped client calls {#dead-island}

**Fifteen of the eighteen endpoints on this page are unreachable from any
shipped client.** The three exceptions are the wishlist routes, which the
mobile app uses.

### The evidence

**The mobile app has no cart, checkout or order screens at all.** Not dead
ones — absent. Every screen file on disk is mounted in
`mobile/src/navigation/RootNavigator.tsx` (`Tabs`, `ProductDetails`,
`Wishlist`, `SignIn` and `Legal`) and `mobile/src/navigation/TabNavigator.tsx`
(`Home`, `Shop`, `Lists` and `Account`). There are no others.

**The admin web contains a closed dead island.** `client/src/router.tsx` routes
only `/`, `/privacy`, `/terms`, `/delete-account`, `/sign-in`, `/sign-up` and
the `/admin/*` pages — `Dashboard`, `Products`, `Promos` (at `/admin/coupons`),
`GroceryLists`, `Messages` and `Settings`. Nothing under `pages/customer/**`,
`components/customer/**` or `features/customer/**` appears in the route table,
and every file that imports from that tree is itself inside it. The only two
outside references are documentation comments, in `client/src/router.tsx`
itself and `client/src/features/admin/products/constants.ts`, not real imports.

**`client/src/pages/admin/Orders.tsx` is imported by nothing.** It has no entry
in `client/src/router.tsx` and no link in
`client/src/components/admin/common/sidebar.tsx`. It is the sole consumer of
`client/src/features/admin/orders/store.ts`, which is the sole consumer of
`client/src/features/admin/orders/api.ts`. So both `/admin/orders` routes are
unreachable.

### Per endpoint

| Endpoints | Only call site | Reachable? |
|---|---|---|
| The six `/customer/cart` routes | `getCustomerCart`, `addCustomerCartItem`, `increaseCustomerCartItem`, `decreaseCustomerCartItem`, `removeCustomerCartItem` and `syncCustomerCart` in `client/src/features/customer/cart-and-checkout/api.ts` | No — dead island |
| The four `/customer/checkout` routes | `createCheckoutSession`, `confirmCheckout`, `getCheckoutPoints` and `payWithPointsCheckout`, same file | No — dead island |
| `POST /customer/promos/apply` | `applyCustomerPromo`, same file | No — dead island |
| `GET /customer/orders` and `PATCH /customer/orders/:orderId/return` | `getCustomerOrders` and `returnCustomerOrder` in `client/src/features/customer/orders/api.ts` | No — dead island |
| `GET /admin/orders` and `PATCH /admin/orders/:orderId/status` | `extractAdminOrders` and `updateAdminOrderStatus` in `client/src/features/admin/orders/api.ts` | No — only `pages/admin/Orders.tsx`, which is unrouted |
| The three `/customer/wishlist` routes | `getCustomerWishlist`, `addCustomerWishlist` and `removeCustomerWishlistItem` in `mobile/src/features/customer/wishlist/api.ts` | **Yes, in the mobile app.** The admin web defines the same three in its dead island |

???+ danger "Unreachable is not inert"
    Every route here is still live, still mounted and still authenticated.
    Anyone holding a valid customer session token can call them directly.

    `/customer/checkout/create-session` creates **real Razorpay orders**.
    `/customer/checkout/confirm` and `/customer/checkout/pay-with-points`
    **decrement real stock**, spend real promo counts and empty real carts.
    `/customer/orders/:orderId/return` credits real points.

    The `razorpay` module also still gates server boot: `checkEnv` in
    `server/src/utils/razorpay.ts` throws at import time when a key is
    missing, so the whole server fails to start to support endpoints nothing
    calls.

## The pricing fields do not exist {#nan-trap}

Both checkout routes price the cart from `product.price` and
`product.salePercentage`:

```ts
const finalPrice = product.salePercentage
  ? Math.round(product.price - (product.price * product.salePercentage) / 100)
  : product.price;
```

**Neither field is in the `products` schema.** `server/src/models/Product.ts`
declares `title`, `description`, `category`, `brand`, `stock`, `images`,
`colors`, `sizes`, `unit`, `unitValue`, `status` and `createdBy` — and no
price. Neither field exists on any of the 84 live product documents either. So
both `finalPrice` and the computed `subTotal` are `NaN`, and so is the
`totalAmount` written to the order and sent to Razorpay.

That alone makes both checkout routes unusable as written, independently of
whether a client calls them. See [products](../database/products.md).

---

# Cart {#cart}

## What this router owns

The catalogue basket. One cart per customer, kept between sessions, separate
from the grocery list.

## Who may call it

`customerCartWishlistRouter.use(requireAuth)` covers the whole router, so every
route needs a signed-in caller of any role. Each handler resolves its own
`users` record through `getDbUserFromReq`, and the cart and wishlist are always
the caller's own — no route accepts a user id.

## The cart shape {#cart-shape}

Every cart route answers with the whole cart, built by `getCartResponse`.

```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "productId": "68e2223344556677889900bb",
        "title": "Aashirvaad Multigrain Atta",
        "brand": "Aashirvaad",
        "image": "https://res.cloudinary.com/demo/image/upload/f_webp,q_auto,c_limit,w_500/v1/ecommerce-monster-video/products/atta.jpg",
        "quantity": 2,
        "color": "Red",
        "size": "M"
      }
    ],
    "totalQuantity": 2
  }
}
```

`formatProduct` renames `_id` to `productId` and collapses `images` to a single
`image` string: the cover image, else the first, else `""` — which `cdnImage`
hands back unchanged, so an imageless product yields an empty string rather
than a broken URL.

Everything else about the product is omitted — price, stock, `colors`, `sizes`,
`status` and the description. **That is why these responses cannot show a cart
total in money.**

A user with no cart document gets an empty cart, not a 404, and reading creates
nothing. Rows whose product has since been deleted are dropped silently by the
`flatMap`, never returned as `null`, so a client cannot tell a removed row from
one that was never added — and `totalQuantity` counts only the survivors.

## Variants {#variants}

A cart row is identified by **product and variant**, so the same product in two
colours is two rows. `isSameCartItem` compares the product reference as a
string and treats an absent colour or size as `""`, exactly and
case-sensitively.

`getSelectedvariant` decides what is required, and the **product** decides, not
the caller:

| Product | Caller sends | Result |
|---|---|---|
| `colors` non-empty | nothing | 400 `Color is required` |
| `colors` non-empty | a value not in the list | 400 `Selected color is invalid` |
| `colors` empty | anything | **ignored**; the stored value is `undefined` |
| `sizes` non-empty | nothing | 400 `Size is required` |
| `sizes` non-empty | a value not in the list | 400 `Selected size is invalid` |
| `sizes` empty | anything | ignored |

So a stray `color` on a plain grocery item is discarded rather than rejected,
and a variantless product has exactly one possible cart row.

???+ warning "Where the variant goes differs by route"
    `POST /cart/items` and `POST /cart/sync` read the variant from the **body**.
    Increase, decrease and delete read it from the **query string**, as
    `?color=...&size=...`. Sending it in the body on those three leaves it
    empty, which is rejected for any product that defines variants.

---

## `GET /customer/cart` {#get-cart}

**Auth:** signed-in customer. **Path, query and body parameters:** none.

Returns [the cart shape](#cart-shape).

**Errors:** 401 from the router guard.

**Side effects:** none; reading creates no cart document.

---

## `POST /customer/cart/items` {#post-cart-items}

Adds a product to the caller's cart and returns the whole cart.

**Auth:** signed-in customer. **Path and query parameters:** none.

### Request body

| Field | Type | Validation |
|---|---|---|
| `productId` | string | Required; trimmed, non-empty |
| `quantity` | number | Defaults to 1; must be a number of at least 1 |
| `color` | string | Required only when the product defines `colors` |
| `size` | string | Required only when the product defines `sizes` |

Only a product with `status: "active"` can be added; anything else is reported
as not found, so a caller cannot distinguish the two.

Stock is checked twice — the requested quantity on its own, and again as the
new running total when the row already exists — and both refusals use the same
message. Stock is only **read**, never reserved or decremented, so two callers
can each fill a cart past the real stock.

???+ warning "Known defect: the first cart row is duplicated"
    The "already in cart" branch tests `if (itemIndex > 0)` where every other
    comparable check in the file uses `>= 0`. Re-adding the product that sits
    at **index 0** falls through to the `else` branch and pushes a second
    identical row instead of increasing the first.

    So `carts.items` can hold two rows with identical
    `(product, color, size)`. Documented, not fixed.

**Errors**

| Status | Message |
|---|---|
| 400 | `Product id is required` |
| 400 | `Quantity must be at least 1` |
| 404 | `Product not found` — no **active** product has that id |
| 400 | `Color is required`, `Selected color is invalid`, `Size is required` or `Selected size is invalid` |
| 400 | `Quantity is more than the stock of this product` |

**Side effects:** creates the `carts` document when the caller has none, then
writes it. No push, no Telegram, no Cloudinary.

---

## `PATCH /customer/cart/items/:productId/increase` {#patch-increase}

Adds one to a cart row and returns the whole cart.

**Auth:** signed-in customer.

| Path parameter | Meaning |
|---|---|
| `productId` | The product `_id`; trimmed, non-empty |

| Query parameter | Meaning |
|---|---|
| `color` | The variant; see [variants](#variants) |
| `size` | The variant |

**Request body:** none is read.

The row is matched on product **and** variant, so increasing the red one does
not touch the blue one. The product must still be active, and the new quantity
must not exceed its stock; there is no upper bound other than stock.

A caller with no cart at all gets a **404** here, where
[`DELETE`](#delete-cart-item) answers 200 with an empty cart.

**Errors**

| Status | Message |
|---|---|
| 400 | `Product id is required` |
| 404 | `Cart not found` |
| 404 | `Product not found` |
| 400 | the four variant messages |
| 400 | `Cart item not found here` — the cart holds no row for that product and variant |
| 400 | `Quantity is more than the stock of this product` |

**Side effects:** writes the `carts` document.

---

## `PATCH /customer/cart/items/:productId/decrease` {#patch-decrease}

Takes one off a cart row, removing the row at zero, and returns the whole cart.

**Auth:** signed-in customer. Path and query parameters as for
[increase](#patch-increase). **Request body:** none is read.

Dropping to zero or below splices the row out entirely, so there is no separate
"remove" call for the last unit — the response simply comes back without that
row.

The product is still looked up and must still be active, purely so the variant
can be validated. A row for a product that has since been archived therefore
cannot be decremented, only deleted.

**Errors**

| Status | Message |
|---|---|
| 400 | `Product id is required` |
| 404 | `Cart not found` |
| 404 | `Product not found` |
| 400 | the four variant messages |
| 400 | `Cart item not found here` |

**Side effects:** writes the `carts` document.

---

## `DELETE /customer/cart/items/:productId` {#delete-cart-item}

Removes one cart row outright and returns the whole cart.

**Auth:** signed-in customer. Path and query parameters as for
[increase](#patch-increase). **Request body:** none is read.

Only the row matching that product and variant is removed; other variants of
the same product stay.

A caller with no cart document gets **200** with an empty cart and nothing is
written — unlike increase and decrease, which answer 404. Removing a row that
is not there is not an error either: the filter matches nothing and the cart is
saved unchanged.

The product must still exist and be active, so a row whose product was later
archived cannot be removed through this route.

**Errors**

| Status | Message |
|---|---|
| 400 | `Product id is required` |
| 404 | `Product not found` |
| 400 | the four variant messages |

**Side effects:** writes the `carts` document, except on the no-cart path.

---

## `POST /customer/cart/sync` {#post-cart-sync}

Intended to merge a client-side guest cart into the stored cart.

**Auth:** signed-in customer. **Path and query parameters:** none.

### Request body

| Field | Type | Validation |
|---|---|---|
| `items` | `[{ productId, quantity, color, size }]` | A body without an `items` array is treated as an empty list rather than rejected. Variants are read from the **body** here |

Merge, not replace: quantities are added to any matching row, and the result is
clamped to the product's stock rather than refused, so a sync never fails on
stock.

Rows are dropped **silently and individually** — no error, no report of what
was skipped — when the `productId` is blank, the quantity is not a number or is
below 1, the product is missing or not active, its stock is below 1, or the
colour or size fails validation. That last case is swallowed by a bare `catch`,
so the variant errors never reach the caller from this route.

???+ danger "This route cannot work as written"
    Two defects, documented rather than fixed.

    **With no existing cart it calls `cart.create(...)` on the `null` it has
    just tested for.** That is a `TypeError`, so any customer without a cart
    gets a 500.

    **`cart.save()` and `res.json()` are both inside the per-item loop.** A
    two-item sync writes the response twice and Express logs
    `ERR_HTTP_HEADERS_SENT`, while an **empty `items` array writes no response
    at all** and the request hangs until the client times out — 20 seconds for
    the mobile app.

**Errors:** the handler raises no `AppError` of its own, so there are no 4xx
responses beyond the router guard's 401.

**Side effects:** intended to create and write the `carts` document; in
practice it writes once per accepted row.

---

# Wishlist {#wishlist}

Three routes in the same router as the cart, and the only ones on this page a
shipped client reaches.

## The wishlist shape {#wishlist-shape}

The same row as a cart line, minus `quantity`, `color` and `size`, and with no
`totalQuantity` — a wishlist is a plain set of products.

```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "productId": "68e2223344556677889900bb",
        "title": "Aashirvaad Multigrain Atta",
        "brand": "Aashirvaad",
        "image": "https://res.cloudinary.com/demo/image/upload/f_webp,q_auto,c_limit,w_500/v1/ecommerce-monster-video/products/atta.jpg"
      }
    ]
  }
}
```

As with the cart, a missing wishlist document yields an empty list rather than
an error, and entries whose product has been deleted are dropped silently.

---

## `GET /customer/wishlist` {#get-wishlist}

**Auth:** signed-in customer. **Path, query and body parameters:** none.

Returns [the wishlist shape](#wishlist-shape).

**Errors:** 401 from the router guard.

**Side effects:** none; reading creates no document.

**Called by:** `getCustomerWishlist` in
`mobile/src/features/customer/wishlist/api.ts`.

---

## `POST /customer/wishlist/items` {#post-wishlist-items}

Saves a product to the caller's wishlist and returns the whole wishlist.

**Auth:** signed-in customer. **Path and query parameters:** none.

### Request body

| Field | Type | Validation |
|---|---|---|
| `productId` | string | Required; trimmed, non-empty |

A wishlist holds products, not variants, so `color` and `size` are neither read
nor stored — the same product in two colours is one entry.

Only a product with `status: "active"` can be saved.

Adding a product already on the list is a no-op that still answers 200 with the
list, and in that case nothing is written, so the route is safe to repeat.
De-duplication happens here, in the route, not in the schema.

**Errors**

| Status | Message |
|---|---|
| 400 | `Product id is required` |
| 404 | `Product not found` |

**Side effects:** creates the `wishlists` document when the caller has none,
then writes it only if the product was not already present.

**Called by:** `addCustomerWishlist` in
`mobile/src/features/customer/wishlist/api.ts`.

---

## `DELETE /customer/wishlist/items/:productId` {#delete-wishlist-item}

Removes a product from the caller's wishlist and returns the whole wishlist.

**Auth:** signed-in customer.

| Path parameter | Meaning |
|---|---|
| `productId` | The product `_id`; trimmed, non-empty |

**Query parameters:** none. **Request body:** none.

This is the one route in the router that does **not** look the product up, so
an id for a product that has since been deleted or archived is still removed
cleanly. Removing something that is not on the list is not an error either.

A caller with no wishlist document gets 200 with an empty list and nothing is
written.

**Errors**

| Status | Message |
|---|---|
| 400 | `Product id is required` |

**Side effects:** writes the `wishlists` document, except on the no-wishlist
path.

**Called by:** `removeCustomerWishlistItem` in
`mobile/src/features/customer/wishlist/api.ts`.

---

# Promo check {#promo-check}

## `POST /customer/promos/apply` {#post-promos-apply}

Checks a promo code against an order value and returns its terms.

**Auth:** signed-in customer, through
`customerPromoRouter.use(requireAuth)`. **Path and query parameters:** none.

### Request body

| Field | Type | Validation |
|---|---|---|
| `code` | string | Required. Trimmed and upper-cased before the lookup, so codes match case-insensitively |
| `orderValue` | number | Optional, defaults to 0. Must be a number and not negative |

This **validates only**. It does not reserve the code, decrement `count`, or
attach the promo to anything — the checkout routes re-run the same checks and
do the decrement. Two callers can therefore both be told that a
single-remaining code is usable.

```json
{
  "status": "success",
  "data": {
    "code": "DIWALI10",
    "percentage": 10,
    "count": 42,
    "minimumOrderValue": 500
  }
}
```

`startsAt` and `endsAt` are checked but not returned.

**Errors**

| Status | Message |
|---|---|
| 400 | `Promo code is required` |
| 400 | `Valid order value is required!` |
| 404 | `Promo not found` |
| 400 | `Promo code is not activated` — before `startsAt` |
| 400 | `Promo code is expired` — after `endsAt` |
| 400 | `Promo code limit is already excedded` — the misspelling is the live message; `count` has fallen below 1 |
| 400 | `Minimum order value for this promo is 500` — the threshold is quoted live |

**Side effects:** none.

---

# Checkout {#checkout}

Two routers, four endpoints. Both apply `requireAuth` router-wide and scope
every lookup by the caller's own user id.

Prices are never taken from the request. The cart is re-priced from the current
`Product` records on every call, so a stale or tampered client price is
ignored — which would be the right design if the price fields
[existed](#nan-trap).

Neither router runs in a transaction.

---

## `POST /customer/checkout/create-session` {#post-create-session}

Prices the caller's cart, opens a Razorpay order for the total and saves a
pending `Order`.

**Auth:** signed-in customer. **Path and query parameters:** none.

### Request body

| Field | Type | Validation |
|---|---|---|
| `addressId` | string | Required. Must be one of the caller's own saved addresses |
| `promoCode` | string | Optional. Upper-cased before the lookup |

Nothing else in the body is read — no prices, no quantities, no item list.

For each cart row the product must exist and be `active`, and its `stock` must
cover the quantity. `salePercentage` is applied per unit and rounded to a whole
rupee **before** multiplying by the quantity, so the rounding is per unit
rather than per line.

A promo must be inside its `startsAt` to `endsAt` window and have `count` of at
least 1, and the subtotal must reach `minimumOrderValue`. The discount is a
rounded percentage of the subtotal, and the total is floored at 0. The promo's
`count` is **not** decremented here, so a code can open any number of sessions;
it is only spent at [`/checkout/confirm`](#post-checkout-confirm).

Stock is checked but **not reserved**. Between this call and `confirm` the same
stock can be sold to somebody else, and the second customer is the one who
fails.

The saved `Order` snapshots `deliveryName` from the address's `fullName` and
`deliveryAddress` as the address, state and postal code joined with commas,
plus the promo and the total. It stores only `product` and `quantity` per item,
so no unit price is kept and the order cannot be re-costed later.

Every call opens a **new** order. Nothing supersedes or cancels an earlier
pending order for the same cart, so abandoned sessions accumulate.

```json
{
  "status": "success",
  "data": {
    "razorpay": {
      "keyId": "rzp_live_XXXXXXXXXXXX",
      "orderId": "order_QaBcDeFgHiJkLm",
      "amount": 89100,
      "currency": "INR"
    },
    "order": {
      "_id": "68e7778899001122ccddeeff",
      "totalItems": 3,
      "discountAmount": 99,
      "totalAmount": 891
    }
  }
}
```

`keyId` is `RAZORPAY_KEY_ID`, the publishable key, and is meant to reach the
client.

**Errors**

| Status | Message |
|---|---|
| 400 | `Address is required` |
| 404 | `user not found` — note the lower-case "user" |
| 404 | `Cart not found` — the caller has no cart **document**, which is distinct from having an empty one |
| 400 | `Cart is empty` |
| 404 | `Address not found!!` |
| 400 | `One or more cart items are not avaibale` — the misspelling is the live message; a product is missing or not `active` |
| 400 | `Cart items are out of stock` |
| 404 | `Promo not found` |
| 400 | `promo code is not active` — outside its window, or exhausted |
| 400 | `Minimum order value for this promo is not at the threesold` — the misspelling is the live message |
| 500 | a Razorpay SDK failure, which is not an `AppError` |

**Side effects:** creates an order at Razorpay, then writes one `orders`
document. No push, no Telegram, no Cloudinary.

---

## `POST /customer/checkout/confirm` {#post-checkout-confirm}

Verifies the Razorpay callback, then commits the sale: stock down, promo spent,
cart emptied, order paid.

**Auth:** signed-in customer. **Path and query parameters:** none.

### Request body

| Field | Type | Required |
|---|---|---|
| `orderId` | string | yes; trimmed, non-empty |
| `razorpay_payment_id` | string | yes |
| `razorpay_order_id` | string | yes |
| `razorpay_signature` | string | yes |

The order is looked up scoped by the caller, so someone else's order answers
404.

Trust comes from the signature. The handler recomputes
`HMAC-SHA256("<order_id>|<payment_id>")` with `RAZORPAY_KEY_SECRET` and
compares it with the one sent; the order id must also match the stored
`razorpayOrderId`. The comparison is plain string equality, not a constant-time
compare.

Idempotent at the top: an already-paid order returns **200** with `{ _id }`
before any signature check or stock change, so a repeated callback does not
decrement stock twice.

Each stock decrement is a conditional `updateOne` matching on
`stock: { $gte: quantity }`, so a single item can never go negative.

???+ danger "Not transactional, and the order of writes matters"
    Stock is decremented item by item. If the third of five items no longer has
    stock the handler throws, and **the first two stay decremented**. The order
    also stays `pending` even though Razorpay has taken the money, and nothing
    refunds it or restores the stock.

    The same gap applies to the promo decrement and the cart clear, which both
    run before the order is marked paid.

The promo `count` is decremented conditionally on `count > 0`, and the result
is **not checked** — a promo exhausted in the meantime lets the order through
at the discounted price it was quoted.

```json
{
  "status": "success",
  "data": { "_id": "68e7778899001122ccddeeff" }
}
```

**Errors**

| Status | Message |
|---|---|
| 400 | `Order id is needed` |
| 400 | `razorpayPaymentId is needed` |
| 400 | `razorpayOrderId is needed` |
| 400 | `razorpaySignature is needed` |
| 404 | `Order not found` |
| 400 | `Order id mismatch` |
| 400 | `Invalid payment signature` |
| 400 | `One or more cart items are out of stock` — a conditional decrement matched nothing; earlier items are already decremented |

**Side effects:** a per-item `$inc` on `products.stock`; an `$inc` on the
promo's `count`; the caller's cart items emptied; the order marked paid with
`paymentId` and `paidAt`. **No notification of any kind is sent.**

---

## `GET /customer/checkout/points` {#get-points}

The caller's current loyalty points balance.

**Auth:** signed-in customer. **Path, query and body parameters:** none. The
balance is always the caller's own.

The record is re-read rather than taken from the request, so the number is
current as of this call. It is coerced with `|| 0`, so a record with no
`points` field answers `0` rather than `null`.

Points are rupees at 1:1, which is why no currency is returned. They are earned
by [returning a delivered order](#patch-return); nothing else grants them.

```json
{
  "status": "success",
  "data": { "points": 450 }
}
```

**Errors**

| Status | Message |
|---|---|
| 404 | `User not found` — note the capital U; `pay-with-points` uses a lower-case `user not found` for the same condition |

**Side effects:** none.

---

## `POST /customer/checkout/pay-with-points` {#post-pay-with-points}

Prices the caller's cart and pays the whole total from their points balance, in
one call.

**Auth:** signed-in customer. **Path and query parameters:** none.

### Request body

| Field | Type | Validation |
|---|---|---|
| `addressId` | string | Required; must be one of the caller's own addresses |
| `promoCode` | string | Optional; upper-cased before the lookup |

No price, quantity or points amount is read from the body.

Pricing is identical to
[`create-session`](#post-create-session) — the logic is repeated line for line
in a second file rather than shared, so a change to the pricing or promo rules
has to be made twice.

It is all or nothing. The full total is deducted; there is no part payment and
no mixed payment with Razorpay. A total of 0, which a 100% promo can produce,
deducts nothing and still places the order.

The balance is protected by a conditional `updateOne` matching on
`points: { $gte: totalAmount }`, which is atomic and does hold under concurrent
calls.

???+ warning "The friendly pre-check is dead code"
    `if (totalAmount > foundUser.points)` can never fire. The `users` read
    selects only `"name email addresses"`, so `points` is `undefined` on the
    object, and comparing a number with `undefined` is always `false`. The
    `CheckoutUserRow` type claims `points: number`, which is why the compiler
    does not catch it.

    Callers short of points get the identical message from the conditional
    update instead, so the outcome is correct — only the friendly 400 is
    unreachable.

???+ danger "The compensation is partial"
    Everything after the deduction runs inside a `try`, and the `catch` credits
    the full total back before rethrowing. That covers the **points only**.
    Stock already decremented in the loop is **not** restored, and an emptied
    cart is not refilled. A mid-loop stock failure leaves the caller with their
    points back but some products short.

The order is written with `paymentStatus: "paid"` and a synthetic
`points_<timestamp>` value stored in **both** `razorpayOrderId` and
`paymentId`, which is how a points order is told apart from a Razorpay one
downstream. That value is a millisecond timestamp, not a unique id, and nothing
enforces uniqueness on it.

The balance in the response is re-read after the order is created, so it
reflects the deduction.

```json
{
  "status": "success",
  "data": {
    "_id": "68e7778899001122ccddeeff",
    "totalPoints": 0
  }
}
```

**Errors**

| Status | Message |
|---|---|
| 400 | `Address is required` |
| 404 | `user not found` |
| 404 | `Cart not found` |
| 400 | `Cart is empty` |
| 404 | `Address not found!!` |
| 400 | `One or more cart items are not avaibale` |
| 400 | `Cart items are out of stock` |
| 404 | `Promo not found` |
| 400 | `promo code is not active` |
| 400 | `Minimum order value for this promo is not at the threesold` |
| 400 | `Not enough points for this order` — from the conditional deduction |
| 400 | `One or more cart items are out of stock` — a conditional stock decrement matched nothing; the points are credited back but earlier decrements are not |

**Side effects:** a conditional `$inc` deducting `users.points`; a per-item
`$inc` on `products.stock`; an `$inc` on the promo's `count`, whose result is
not checked; the caller's cart items emptied; one `orders` document written;
and on any failure after the deduction, a compensating `$inc` crediting the
points back. **No notification of any kind is sent.**

---

# Orders {#orders}

Two routers. Both are summaries: the per-item `items` array, the delivery
address, the promo and the Razorpay identifiers are deliberately omitted from
every row, and `code` is derived from the last eight characters of the `_id`
rather than stored.

---

## `GET /customer/orders` {#get-customer-orders}

The caller's own orders, newest first.

**Auth:** signed-in customer, through `customerOrderRouter.use(requireAuth)`.
**Path, query and body parameters:** none. No pagination, so every order the
customer has ever placed comes back in one response.

```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "_id": "68e7778899001122ccddeeff",
        "code": "22CCDDEEFF",
        "totalItems": 3,
        "totalAmount": 891,
        "paymentStatus": "paid",
        "orderStatus": "delivered",
        "paidAt": "2026-09-10T07:41:12.000Z",
        "deliveredAt": "2026-09-12T11:20:00.000Z",
        "returnedAt": null,
        "createdAt": "2026-09-10T07:40:02.000Z"
      }
    ]
  }
}
```

**Errors:** 401 from the router guard.

**Side effects:** none, beyond the create-on-demand `users` write.

---

## `PATCH /customer/orders/:orderId/return` {#patch-return}

Returns a delivered order, restoring its stock and crediting the customer with
points.

**Auth:** signed-in customer.

| Path parameter | Meaning |
|---|---|
| `orderId` | The order `_id`; trimmed, non-empty |

**Query parameters:** none. **Request body:** none is read.

Two gates, both checked against the stored order and not against anything the
caller sends: the order must be `delivered` **and** carry a `deliveredAt`, and
that timestamp must be within **seven days**.

The points credit is the full `totalAmount` of the order, in rupees, added to
`users.points`. This is the only thing in the codebase that grants points.

???+ warning "The idempotency guard is a race"
    There is nothing beyond the status check. It holds because the order is
    moved to `returned` at the end, so a second call fails the `delivered`
    test — but two requests racing each other can both pass the gate and credit
    the points twice.

```json
{
  "status": "success",
  "data": {
    "_id": "68e7778899001122ccddeeff",
    "orderStatus": "returned",
    "returnedAt": "2026-09-14T09:05:33.120Z"
  }
}
```

**Errors**

| Status | Message |
|---|---|
| 400 | `Order Id is required` |
| 404 | `Order not found` |
| 400 | `Only delivered orders can be returned` — any other status, or no `deliveredAt` |
| 400 | `Return window expired` — more than seven days after delivery |

**Side effects:** an `$inc` on `products.stock` for each item, one at a time and
not in a transaction; an `$inc` on `users.points`; and the order saved as
`returned` with `returnedAt` stamped. A product that has since been deleted
makes its `updateOne` match nothing, silently. **Nothing is sent to the shop —
no push, no Telegram.**

---

## `GET /admin/orders` {#get-admin-orders}

Every order in the collection, newest first.

**Auth:** admin, through `adminOrderRouter.use(requireAdmin)`. **Path, query
and body parameters:** none. No filter and no pagination.

The same row shape as [`GET /customer/orders`](#get-customer-orders), plus
`customerName` and `customerEmail` — which are the snapshot taken when the
order was placed, not a live lookup on the user.

```json
{
  "status": "success",
  "data": {
    "items": [
      {
        "_id": "68e7778899001122ccddeeff",
        "code": "22CCDDEEFF",
        "customerName": "Asha Kumari",
        "customerEmail": "asha@example.com",
        "totalItems": 3,
        "totalAmount": 891,
        "paymentStatus": "paid",
        "orderStatus": "delivered",
        "paidAt": "2026-09-10T07:41:12.000Z",
        "deliveredAt": "2026-09-12T11:20:00.000Z",
        "returnedAt": null,
        "createdAt": "2026-09-10T07:40:02.000Z"
      }
    ]
  }
}
```

**Errors:** 401 and 403 from the router guard.

**Side effects:** none.

---

## `PATCH /admin/orders/:orderId/status` {#patch-admin-order-status}

Moves one order to another status.

**Auth:** admin.

| Path parameter | Meaning |
|---|---|
| `orderId` | The order `_id`; trimmed, non-empty |

### Request body

| Field | Type | Allowed values |
|---|---|---|
| `orderStatus` | string | `placed`, `shipped`, `delivered` and `returned` — the `ALLOWED_ORDER_STATUSES` tuple |

The list is also the transition rule: any of the four may be set from any
other, in any order, so an order can be moved back to `placed` after delivery.

Two statuses do more than set the field:

| Target | Extra effect |
|---|---|
| `returned` | Restores stock for every item — guarded against an order that is **already** `returned`, so stock cannot be credited twice |
| `delivered` | Stamps `deliveredAt`, but only the first time. A later re-delivery keeps the original timestamp, which is what the customer's seven-day return window is measured from |

Unlike [the customer's own return](#patch-return), this route does **not**
credit `users.points`. A comment in the handler describes that intent; the
step is not implemented.

```json
{
  "status": "success",
  "data": {
    "_id": "68e7778899001122ccddeeff",
    "orderStatus": "delivered",
    "deliveredAt": "2026-09-12T11:20:00.000Z",
    "returnedAt": null
  }
}
```

**Errors**

| Status | Message |
|---|---|
| 400 | `Order Id is required` |
| 400 | `orderStatus is required` |
| 400 | `Invalid order status` |
| 404 | `Order not found` |

**Side effects:** on a return, an `$inc` on `products.stock` for each item, one
at a time and not in a transaction; then one write to the order. **Nothing is
sent to the customer — no push, no Telegram.**
