# Dashboard {#dashboard-router}

`server/src/routes/admin/dashboard.routes.ts` · exported as
`adminDashboardRouter` · mounted at `/admin` in `mainEntryFunction`
(`server/src/server.ts`), and mounted **last** among the seven admin routers.

## What this router owns

Read-only counters and the seven-day trend behind the admin panel's home
screen. Both routes take no parameters and write nothing.

???+ info "\"Orders\" here means grocery lists"
    The shop runs on grocery lists, so every order and sales figure on this
    dashboard is computed from `grocerylists`. The `orders` collection is not
    read at all by either route — see
    [orders](../database/orders.md) for why that collection is effectively
    legacy.

## Who may call it

Admins only, through `adminDashboardRouter.use(requireAdmin)`.

---

## `GET /admin/dashboard/lite` {#get-lite}

The six headline counters.

**Auth:** admin. **Path, query and body parameters:** none.

Six queries run in parallel through `Promise.all`. All six are lifetime totals
with no date window.

| Field | Counts | Query |
|---|---|---|
| `totalProducts` | every product, **including inactive ones** | `Product.countDocuments()` with no filter |
| `totalCategories` | every category | `Category.countDocuments()` |
| `totalOrders` | every list that is not `cancelled` | `GroceryList.countDocuments({ status: { $ne: "cancelled" } })` |
| `pendingOrders` | lists still in `received` — **awaiting pricing**, not awaiting payment | `GroceryList.countDocuments({ status: "received" })` |
| `completedOrders` | lists in `completed` | `GroceryList.countDocuments({ status: "completed" })` |
| `totalSales` | the sum of `totalAmount` across lists whose `paymentStatus` is `paid`; `0` when there are none | a `$match` plus `$group` aggregation |

```json
{
  "status": "success",
  "data": {
    "totalProducts": 84,
    "totalCategories": 13,
    "totalSales": 18740,
    "totalOrders": 121,
    "pendingOrders": 78,
    "completedOrders": 15
  }
}
```

**Errors:** none of its own. 401 and 403 from the router guard apply.

**Side effects:** none.

**Called by:** `getAdminDashboardLite` in
`client/src/features/admin/dashboard/api.ts`.

---

## `GET /admin/dashboard/daily` {#get-daily}

Orders placed and money received on each of the last seven IST days.

**Auth:** admin. **Path, query and body parameters:** none.

Always returns exactly seven entries, oldest first and ending with today. A day
with no activity is present with zeroes rather than missing, so the chart needs
no gap filling.

### How the days are bucketed

`istDayKey` shifts an instant by a fixed +5:30 and takes the date part of the
ISO string. India observes no daylight saving, so the fixed offset is exact and
needs no timezone database.

The query looks back eight days rather than seven, to catch timezone edges, and
matches on either timestamp:

```js
{ $or: [{ createdAt: { $gte: since } }, { paidAt: { $gte: since } }] }
```

???+ warning "The two series are bucketed by different timestamps"
    `orders` counts non-cancelled lists by `createdAt`. `sales` sums
    `totalAmount` of paid lists by `paidAt`. A list created on Monday and paid
    on Wednesday therefore counts as an order on Monday and as sales on
    Wednesday, and a list can appear in one series and not the other.

`label` is built with `toLocaleDateString("en-IN", { weekday: "short", day:
"numeric" })`, so its exact wording depends on the locale data available to the
running server rather than on anything stored.

```json
{
  "status": "success",
  "data": {
    "days": [
      { "date": "2026-09-13", "label": "Sun 13", "orders": 4, "sales": 0 },
      { "date": "2026-09-14", "label": "Mon 14", "orders": 7, "sales": 1240 },
      { "date": "2026-09-15", "label": "Tue 15", "orders": 5, "sales": 860 },
      { "date": "2026-09-16", "label": "Wed 16", "orders": 6, "sales": 0 },
      { "date": "2026-09-17", "label": "Thu 17", "orders": 9, "sales": 2310 },
      { "date": "2026-09-18", "label": "Fri 18", "orders": 3, "sales": 450 },
      { "date": "2026-09-19", "label": "Sat 19", "orders": 2, "sales": 0 }
    ]
  }
}
```

**Errors:** none of its own.

**Side effects:** none. The read is `.lean()` and projected down to
`createdAt paidAt totalAmount status paymentStatus`.

**Called by:** `getAdminDashboardDaily` in
`client/src/features/admin/dashboard/api.ts`.
