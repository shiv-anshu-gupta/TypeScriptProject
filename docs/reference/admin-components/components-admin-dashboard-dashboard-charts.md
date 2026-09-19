# DashboardCharts `dashboard-charts`

The two seven-day dashboard charts: orders per day and sales per day.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `client/src/components/admin/dashboard/dashboard-charts.tsx` |
| Group | [Admin panel — components](index.md) |
| Exports | 1 |

## Description

Rendered by `pages/admin/Dashboard.tsx` below the stat cards. It fetches its
own data from `GET /admin/dashboard/daily` and keeps it in local component
state, so the series is refetched every time the component mounts — unlike
the stat cards, which are cached in a store for the whole session.

Charts are drawn with recharts. Because recharts emits SVG presentation
attributes, colours here are concrete hex values rather than the CSS
variables used everywhere else in the admin; see the note above `ACCENT`.
One consequence is that these charts do not follow a theme change.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`DashboardCharts`](#component-dashboard-charts) | React component | `function DashboardCharts(): Element` | Fetches the seven-day series and renders the orders bar chart and the sales area chart side by side. |

## Exports in detail

### `DashboardCharts` {#component-dashboard-charts}

*React component*

Fetches the seven-day series and renders the orders bar chart and the sales
area chart side by side.

```ts
function DashboardCharts(): Element
```

Takes no props.

**Returns** `Element`

Takes no props. On mount it calls `getAdminDashboardDaily`, i.e.
`GET /admin/dashboard/daily`, and keeps the result in local `useState` — the
data is not in a store, so it is refetched on every mount and is lost when
the component unmounts. Nothing polls. A `cancelled` flag in the effect
cleanup stops the late response writing to an unmounted component.

Trap: the `.catch(() => {})` is silent. A failed request leaves `days` empty
and both charts render blank axes with no message, exactly as a shop with
no activity would.

The seven buckets are IST calendar days computed on the server, and the X
axis renders the server-formatted `label` as-is. Orders are bucketed by the
list's `createdAt` and sales by its `paidAt`, so the two charts can peak on
different days for the same order.

While loading it renders two pulsing 268px placeholders so the grid keeps
its height.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/admin/dashboard/dashboard-charts.tsx#L136)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/admin/dashboard/dashboard-charts.tsx)
