# customerPromoRouter `promo.routes`

Promo-code checking for customers.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/routes/customer/promo.routes.ts` |
| Group | [Server — routes: customer](index.md) |
| Exports | 1 |

## Description

Mounted at `/customer` in `server/src/server.ts`, so the single path is
`POST /customer/promos/apply`.

The route requires a signed-in customer (`requireAuth` is applied
router-wide). It only reads promos; creating and editing them is admin work
and lives in `routes/admin/promo.routes.ts`.

No shipped client calls this route. It belongs to the cart-and-checkout
flow that the apps no longer reach, but it is live on the server.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`customerPromoRouter`](#constant-customer-promo-router) | Constant | `const customerPromoRouter: Router` | — |

## Exports in detail

### `customerPromoRouter` {#constant-customer-promo-router}

*Constant*

```ts
const customerPromoRouter: Router
```

*No description in the source.*

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/routes/customer/promo.routes.ts#L25)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/routes/customer/promo.routes.ts)
