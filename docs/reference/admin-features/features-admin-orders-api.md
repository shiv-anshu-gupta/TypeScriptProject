# Orders api `api`

Server calls for the legacy orders table, which is no longer routed.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `client/src/features/admin/orders/api.ts` |
| Group | [Admin panel — features and hooks](index.md) |
| Exports | 2 |

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
| [`extractAdminOrders`](#function-extract-admin-orders) | Function | `function extractAdminOrders(): Promise<AdminOrdersResponse>` | — |
| [`updateAdminOrderStatus`](#function-update-admin-order-status) | Function | `function updateAdminOrderStatus( … ): Promise<AdminUpdateOrderStatusResponse>` | — |

## Exports in detail

### `extractAdminOrders` {#function-extract-admin-orders}

*Function*

```ts
function extractAdminOrders(): Promise<AdminOrdersResponse>
```

**Returns** `Promise<AdminOrdersResponse>`

*No description in the source.*

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/orders/api.ts#L28)

### `updateAdminOrderStatus` {#function-update-admin-order-status}

*Function*

```ts
function updateAdminOrderStatus(
  orderId: string,
  orderStatus: AdminOrderStatus,
): Promise<AdminUpdateOrderStatusResponse>
```

| Parameter | Type | Meaning |
|---|---|---|
| `orderId` | `string` | — |
| `orderStatus` | `AdminOrderStatus` | — |

**Returns** `Promise<AdminUpdateOrderStatusResponse>`

*No description in the source.*

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/orders/api.ts#L32)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/orders/api.ts)
