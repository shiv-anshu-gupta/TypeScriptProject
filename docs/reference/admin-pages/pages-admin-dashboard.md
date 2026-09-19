# AdminDashboard `Dashboard`

The admin dashboard page at `/admin/dashboard`.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `client/src/pages/admin/Dashboard.tsx` |
| Group | [Admin panel — pages](index.md) |
| Exports | 1 |

## Description

Six stat cards from `GET /admin/dashboard/lite` via the zustand store, then
the seven-day charts, which fetch `GET /admin/dashboard/daily` themselves.

The page is not the shop's landing screen: `/admin` redirects to
`/admin/grocery-lists`, so the dashboard is only seen when the owner clicks
to it. It sits behind `ProtectedLayout` and an admin `RoleGuardLayout`.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`AdminDashboard`](#component-admin-dashboard) | React component | `function AdminDashboard(): Element` | Renders the dashboard: six stat cards above the seven-day charts. |

## Exports in detail

### `AdminDashboard` {#component-admin-dashboard}

*React component · default export*

Renders the dashboard: six stat cards above the seven-day charts.

```ts
function AdminDashboard(): Element
```

Takes no props.

**Returns** `Element`

Takes no props. It subscribes to the whole dashboard store and calls
`fetchDashboard` from an effect only when `hasLoaded` is false, so the data
is fetched once per browser session — navigating away and back shows the
same numbers until a full page reload. There is no refresh control and
nothing polls.

Trap: the store turns a failed request into all-zero stats without an error
state, so six zeroes here mean either an empty shop or a failed
`GET /admin/dashboard/lite`. The page cannot tell you which.

`loading` gates the whole body, so `DashboardCharts` is not mounted until
the stats call settles; its own daily fetch therefore starts after the
stats call, not alongside it. The charts keep their own loading state and
their own skeleton.

Exported as the default and mounted at `/admin/dashboard` in `router.tsx`.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/pages/admin/Dashboard.tsx#L123)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/pages/admin/Dashboard.tsx)
