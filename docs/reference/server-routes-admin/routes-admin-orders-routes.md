# adminOrderRouter `orders.routes`

The shop's view of the `orders` collection.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/routes/admin/orders.routes.ts` |
| Group | [Server — routes: admin](index.md) |
| Exports | 1 |

## Description

Mounted at `/admin` in `server/src/server.ts`, giving `GET /admin/orders`
and `PATCH /admin/orders/:orderId/status`.

Both routes require an admin (`requireAdmin` is applied router-wide).

These are cart-and-checkout orders, not grocery lists. The shop now runs on
grocery lists and the admin panel has no orders page, so no shipped client
reaches either route; they remain live, and the status change below still
moves stock.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`adminOrderRouter`](#constant-admin-order-router) | Constant | `const adminOrderRouter: Router` | — |

## Exports in detail

### `adminOrderRouter` {#constant-admin-order-router}

*Constant*

```ts
const adminOrderRouter: Router
```

*No description in the source.*

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/routes/admin/orders.routes.ts#L58)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/routes/admin/orders.routes.ts)
