# Orders types `types`

Types for the legacy orders table, which is no longer routed.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `client/src/features/admin/orders/types.ts` |
| Group | [Admin panel — features and hooks](index.md) |
| Exports | 5 |

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
| [`AdminOrder`](#type-admin-order) | Type | `type AdminOrder = { … };` | — |
| [`AdminOrdersResponse`](#type-admin-orders-response) | Type | `type AdminOrdersResponse = { … };` | — |
| [`AdminOrderStatus`](#type-admin-order-status) | Type | `type AdminOrderStatus = "placed" \| "shipped" \| "delivered" \| "returned";` | — |
| [`AdminPaymentStatus`](#type-admin-payment-status) | Type | `type AdminPaymentStatus = "pending" \| "paid" \| "failed";` | — |
| [`AdminUpdateOrderStatusResponse`](#type-admin-update-order-status-response) | Type | `type AdminUpdateOrderStatusResponse = { … };` | — |

## Exports in detail

### `AdminOrder` {#type-admin-order}

*Type*

```ts
type AdminOrder = {
  _id: string;
  code: string;
  customerName: string;
  customerEmail: string;
  totalItems: number;
  totalAmount: number;
  paymentStatus: AdminPaymentStatus;
  orderStatus: AdminOrderStatus;
  paidAt?: string | null;
  deliveredAt?: string | null;
  returnedAt?: string | null;
  createdAt: string;
};
```

| Property | Type | Meaning |
|---|---|---|
| `_id` | `string` | — |
| `code` | `string` | — |
| `createdAt` | `string` | — |
| `customerEmail` | `string` | — |
| `customerName` | `string` | — |
| `deliveredAt?` | `string \| null` | — |
| `orderStatus` | `AdminOrderStatus` | — |
| `paidAt?` | `string \| null` | — |
| `paymentStatus` | `AdminPaymentStatus` | — |
| `returnedAt?` | `string \| null` | — |
| `totalAmount` | `number` | — |
| `totalItems` | `number` | — |

*No description in the source.*

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/orders/types.ts#L24)

### `AdminOrdersResponse` {#type-admin-orders-response}

*Type*

```ts
type AdminOrdersResponse = {
  items: AdminOrder[];
};
```

| Property | Type | Meaning |
|---|---|---|
| `items` | `AdminOrder[]` | — |

*No description in the source.*

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/orders/types.ts#L39)

### `AdminOrderStatus` {#type-admin-order-status}

*Type*

```ts
type AdminOrderStatus = "placed" | "shipped" | "delivered" | "returned";
```

*No description in the source.*

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/orders/types.ts#L21)

### `AdminPaymentStatus` {#type-admin-payment-status}

*Type*

```ts
type AdminPaymentStatus = "pending" | "paid" | "failed";
```

*No description in the source.*

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/orders/types.ts#L22)

### `AdminUpdateOrderStatusResponse` {#type-admin-update-order-status-response}

*Type*

```ts
type AdminUpdateOrderStatusResponse = {
  _id: string;
  orderStatus: AdminOrderStatus;
  deliveredAt?: string | null;
  returnedAt?: string | null;
};
```

| Property | Type | Meaning |
|---|---|---|
| `_id` | `string` | — |
| `deliveredAt?` | `string \| null` | — |
| `orderStatus` | `AdminOrderStatus` | — |
| `returnedAt?` | `string \| null` | — |

*No description in the source.*

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/orders/types.ts#L43)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/orders/types.ts)
