# adminProductRouter `product.routes`

The admin catalogue: categories and products, including their image uploads.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/routes/admin/product.routes.ts` |
| Group | [Server — routes: admin](index.md) |
| Exports | 1 |

## Description

Mounted at `/admin` in `server/src/server.ts`, so the paths below read
`/admin/categories...` and `/admin/products...`. The router is guarded end
to end by `requireAdmin`, so every route answers 401 to a caller with no
Clerk session and 403 to a signed-in customer. The customer-facing twins
live in `routes/customer/product.routes.ts` and show only active products.

Four routes take `multipart/form-data` rather than JSON, through the
`upload` middleware, so the global 100 kb `express.json` limit does
not apply to them.

Image lifecycle is only half automatic. Replacing a category image and
deleting a category or a product all leave the old Cloudinary assets in
place; only `PUT /admin/products/:id` deletes anything. Nothing in this
file reconciles the two stores, so orphaned assets accumulate.

Responses are inconsistent by accident: `POST /admin/products` returns
full-size Cloudinary URLs while every other product response is passed
through `sizedProduct(..., "card")`, and the category routes return raw
documents including `imagePublicId` and `__v`.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`adminProductRouter`](#constant-admin-product-router) | Constant | `const adminProductRouter: Router` | — |

## Exports in detail

### `adminProductRouter` {#constant-admin-product-router}

*Constant*

```ts
const adminProductRouter: Router
```

*No description in the source.*

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/routes/admin/product.routes.ts#L75)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/routes/admin/product.routes.ts)
