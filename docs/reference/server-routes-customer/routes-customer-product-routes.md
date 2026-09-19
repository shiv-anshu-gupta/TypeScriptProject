# customerProductRouter `product.routes`

The public shop catalogue: categories, the product list and one product.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/routes/customer/product.routes.ts` |
| Group | [Server — routes: customer](index.md) |
| Exports | 1 |

## Description

Mounted at `/customer` in `server/src/server.ts`, giving
`/customer/categories`, `/customer/products` and `/customer/products/:id`.

Every route here is public. This router deliberately calls neither
`requireAuth` nor `requireAdmin`, so the app can show the shop before
anyone signs in. That is also why every product query is pinned to
`status: "active"` — an inactive product must not be visible to the
public, and the admin catalogue in `routes/admin/product.routes.ts` is
where any status can be read.

None of these routes is paginated.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`customerProductRouter`](#constant-customer-product-router) | Constant | `const customerProductRouter: Router` | — |

## Exports in detail

### `customerProductRouter` {#constant-customer-product-router}

*Constant*

```ts
const customerProductRouter: Router
```

*No description in the source.*

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/routes/customer/product.routes.ts#L28)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/routes/customer/product.routes.ts)
