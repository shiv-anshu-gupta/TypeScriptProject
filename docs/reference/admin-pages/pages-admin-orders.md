# AdminOrders `Orders`

The legacy orders table, kept on disk but no longer routed.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `client/src/pages/admin/Orders.tsx` |
| Group | [Admin panel — pages](index.md) |
| Exports | 1 |

## Description

**Not reachable.** `client/src/router.tsx` does not import
`pages/admin/Orders.tsx`, and `components/admin/common/sidebar.tsx` has no
entry for it, so there is no way to open this screen in the running app.

It belongs to the legacy `Order` model inherited from the e-commerce
template, with its own placed/shipped/delivered flow. The shop's orders are
**grocery lists** now - the server says so itself in
`server/src/routes/admin/dashboard.routes.ts` - and nothing produces `Order`
documents any more. The `/admin/orders` API routes are still mounted, so
re-adding the route would render an empty table rather than fail.

Treat this as reference material for the legacy model. New work belongs in
`features/admin/grocery-lists/` and `pages/admin/GroceryLists.tsx`.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`AdminOrders`](#component-admin-orders) | React component | `function AdminOrders(): Element` | — |

## Exports in detail

### `AdminOrders` {#component-admin-orders}

*React component · default export*

```ts
function AdminOrders(): Element
```

Takes no props.

**Returns** `Element`

*No description in the source.*

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/pages/admin/Orders.tsx#L102)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/pages/admin/Orders.tsx)
