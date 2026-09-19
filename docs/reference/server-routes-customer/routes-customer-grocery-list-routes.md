# customerGroceryListRouter `grocery-list.routes`

Customer grocery-list routes: sending a handwritten shopping list to the shop, watching what the shop does with it, paying for it, and the chat attached to it.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/routes/customer/grocery-list.routes.ts` |
| Group | [Server — routes: customer](index.md) |
| Exports | 1 |

## Description

t.

Mounted at `/customer` in `server/src/server.ts`, so every path below reads
`/customer/grocery-lists...`.

`requireAuth` is applied to the whole router, so every route needs a
signed-in customer. No route here is public and none is admin-only. The
shopkeeper's side of the same lists and the same chat lives in
`server/src/routes/admin/grocery-list.routes.ts`.

Every list lookup is scoped by `user`, so a list owned by somebody else
answers 404 `"List not found"` rather than 403. A malformed `listId`
reaches Mongoose as a CastError and surfaces as a 500.

The division of labour matters when reading this file: the customer writes
item names, quantities and a note; the shop writes prices, `rate`,
`available`, `status` and the timestamps. The only list edit a customer can
make after sending is removing a single item, and only before packing
starts.

None of these routes paginate.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`customerGroceryListRouter`](#constant-customer-grocery-list-router) | Constant | `const customerGroceryListRouter: Router` | — |

## Exports in detail

### `customerGroceryListRouter` {#constant-customer-grocery-list-router}

*Constant*

```ts
const customerGroceryListRouter: Router
```

*No description in the source.*

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/routes/customer/grocery-list.routes.ts#L134)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/routes/customer/grocery-list.routes.ts)
