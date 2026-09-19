# customerOrderRouter `orders.routes`

A customer's own `Order` documents, and the return they can start on one.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/routes/customer/orders.routes.ts` |
| Group | [Server — routes: customer](index.md) |
| Exports | 1 |

## Description

Mounted at `/customer` in `server/src/server.ts`, giving
`GET /customer/orders` and `PATCH /customer/orders/:orderId/return`.

Both routes require a signed-in customer (`requireAuth` is applied
router-wide), and both queries are scoped by `user`, so one customer can
never read or return another's order.

These are the `orders` collection — the cart-and-checkout flow — not
grocery lists. The shop now runs on grocery lists, and the admin dashboard
counts those instead, so no shipped client reaches these two routes. They
remain live, and the return below still moves stock and points.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`customerOrderRouter`](#constant-customer-order-router) | Constant | `const customerOrderRouter: Router` | — |

## Exports in detail

### `customerOrderRouter` {#constant-customer-order-router}

*Constant*

```ts
const customerOrderRouter: Router
```

*No description in the source.*

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/routes/customer/orders.routes.ts#L42)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/routes/customer/orders.routes.ts)
