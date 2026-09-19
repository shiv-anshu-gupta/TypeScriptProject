# customerCheckoutRouter `checkout.routes`

Card-and-UPI checkout for the product catalogue: turning the caller's cart into an `Order` with a Razorpay order behind it, then confirming payment.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/routes/customer/checkout.routes.ts` |
| Group | [Server — routes: customer](index.md) |
| Exports | 1 |

## Description

Mounted at `/customer` in `server/src/server.ts`, so the paths below are
`/customer/checkout/create-session` and `/customer/checkout/confirm`.

`requireAuth` is applied to the whole router, so both routes need a
signed-in customer. Neither is public and neither is admin-only. Every
lookup is scoped by the caller's own user id.

This is the catalogue checkout, not the grocery-list one. It is separate
from `grocery-list.routes.ts`, which handles its own Razorpay flow against
a `GroceryList`.

Two things a caller cannot see from the signatures. First, prices are never
taken from the request: the cart is re-priced from the current `Product`
records on every call, so a stale or tampered client price is ignored.
Second, the work is split across the two routes — `create-session` writes
an order but reserves no stock, and `confirm` is where stock, the promo
count and the cart actually change.

Neither route runs in a transaction. See the note on `confirm` for what
that costs.

No shipped client calls either route, but both are live and both create
real Razorpay orders and mutate real stock.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`customerCheckoutRouter`](#constant-customer-checkout-router) | Constant | `const customerCheckoutRouter: Router` | — |

## Exports in detail

### `customerCheckoutRouter` {#constant-customer-checkout-router}

*Constant*

```ts
const customerCheckoutRouter: Router
```

*No description in the source.*

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/routes/customer/checkout.routes.ts#L134)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/routes/customer/checkout.routes.ts)
