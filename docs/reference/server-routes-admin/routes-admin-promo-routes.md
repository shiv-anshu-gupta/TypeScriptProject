# adminPromoRouter `promo.routes`

Promo-code management for the shop.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/routes/admin/promo.routes.ts` |
| Group | [Server — routes: admin](index.md) |
| Exports | 1 |

## Description

Mounted at `/admin` in `server/src/server.ts`, giving `/admin/promos` and
`/admin/promos/:promoId`.

Every route here requires an admin (`requireAdmin` is applied router-wide).
The customer-facing check lives in `routes/customer/promo.routes.ts` and is
read-only.

All four routes answer with the complete promo list, newest first, rather
than with the record that changed, and the create returns 200 rather than
201. Nothing here is paginated.

`code` is the natural key: it is upper-cased on the way in and must be
unique across the collection, which is enforced in this router rather than
by an index.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`adminPromoRouter`](#constant-admin-promo-router) | Constant | `const adminPromoRouter: Router` | — |

## Exports in detail

### `adminPromoRouter` {#constant-admin-promo-router}

*Constant*

```ts
const adminPromoRouter: Router
```

*No description in the source.*

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/routes/admin/promo.routes.ts#L69)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/routes/admin/promo.routes.ts)
