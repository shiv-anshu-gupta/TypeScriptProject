# adminGroceryListRouter `grocery-list.routes`

The shopkeeper's side of a grocery list: pricing it, moving it through the packing statuses, correcting its items, and the chat attached to it.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/routes/admin/grocery-list.routes.ts` |
| Group | [Server — routes: admin](index.md) |
| Exports | 1 |

## Description

Mounted at `/admin` in `server/src/server.ts`, so the paths below read
`/admin/grocery-lists...`. The router is guarded end to end by
`requireAdmin`, so every route answers 401 to a caller with no Clerk
session and 403 to a signed-in customer. No route here is public.

Seven of the ten routes answer with the WHOLE list collection rather than
the record that changed: the admin panel treats each mutation as a full
refresh, so a caller should replace its local state with `data.items`
instead of patching one row. The two chat reads and the chat write are the
exceptions.

The customer's own routes live in `routes/customer/grocery-list.routes.ts`
and map the same documents differently — see `mapGroceryList`.

Ownership is never checked here. An admin may read and change any
customer's list and any list's chat.

`cleanItems` is imported but never called: the admin routes clean one field
at a time with `cleanField`, because they edit an existing list rather than
accept a whole array. The import is dead but harmless.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`adminGroceryListRouter`](#constant-admin-grocery-list-router) | Constant | `const adminGroceryListRouter: Router` | — |

## Exports in detail

### `adminGroceryListRouter` {#constant-admin-grocery-list-router}

*Constant*

```ts
const adminGroceryListRouter: Router
```

*No description in the source.*

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/routes/admin/grocery-list.routes.ts#L223)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/routes/admin/grocery-list.routes.ts)
