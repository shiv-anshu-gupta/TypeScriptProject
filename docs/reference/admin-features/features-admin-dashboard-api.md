# Dashboard api `api`

HTTP calls for the admin dashboard.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `client/src/features/admin/dashboard/api.ts` |
| Group | [Admin panel — features and hooks](index.md) |
| Exports | 2 |

## Description

Both helpers go through `apiGet` from `@/lib/api`, so they inherit the
Clerk bearer token from the axios request interceptor, unwrap the
`{ status, data, errors }` envelope, and throw a plain `Error` carrying the
server's first error message when the request fails. Both server routes sit
behind `requireAdmin`, so a non-admin session gets a rejected promise, never
partial data.

There is no caching here. Caching is done by the callers: the zustand store
for the stats, and a `useEffect` in `DashboardCharts` for the daily series.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`getAdminDashboardDaily`](#function-get-admin-dashboard-daily) | Function | `function getAdminDashboardDaily(): Promise<AdminDashboardDaily>` | Fetches the seven-day orders and sales series used by the charts. |
| [`getAdminDashboardLite`](#function-get-admin-dashboard-lite) | Function | `function getAdminDashboardLite(): Promise<AdminDashboardLite>` | Fetches the six headline counters shown on the dashboard stat cards. |

## Exports in detail

### `getAdminDashboardDaily` {#function-get-admin-dashboard-daily}

*Function*

Fetches the seven-day orders and sales series used by the charts.

```ts
function getAdminDashboardDaily(): Promise<AdminDashboardDaily>
```

**Returns** `Promise<AdminDashboardDaily>` &mdash; An object with a `days` array of seven points.

**Throws**

- Error when the request fails or the envelope reports an error.

Calls `GET /admin/dashboard/daily`. The server returns exactly seven
buckets, oldest first, bucketed by IST calendar day so a late-evening order
lands on the right date. Days with no activity come back as zeroes rather
than being omitted, so the chart always has seven points. Orders are counted
by `createdAt` and sales by `paidAt`, which means an order placed one day
and paid the next contributes to two different buckets.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/dashboard/api.ts#L54)

### `getAdminDashboardLite` {#function-get-admin-dashboard-lite}

*Function*

Fetches the six headline counters shown on the dashboard stat cards.

```ts
function getAdminDashboardLite(): Promise<AdminDashboardLite>
```

**Returns** `Promise<AdminDashboardLite>` &mdash; The resolved stats object.

**Throws**

- Error when the request fails or the envelope reports an error.

Calls `GET /admin/dashboard/lite`. The server derives every figure from the
`GroceryList` collection plus product and category counts — there is no
legacy `Order` document involved. `totalOrders` counts lists whose status is
not `cancelled`, `pendingOrders` counts only lists with status `received`
(that is, un-priced ones), `completedOrders` counts status `completed`, and
`totalSales` sums `totalAmount` over lists with `paymentStatus: "paid"`.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/dashboard/api.ts#L36)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/dashboard/api.ts)
