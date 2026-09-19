# useAdminDashboardLiteStore `store`

Zustand store holding the six dashboard stat-card figures.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `client/src/features/admin/dashboard/store.ts` |
| Group | [Admin panel — features and hooks](index.md) |
| Exports | 1 |

## Description

The store is module-level state, so it lives for the whole browser session
and survives route changes. It fetches at most once per session and has no
polling, no invalidation and no refresh action.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`useAdminDashboardLiteStore`](#hook-use-admin-dashboard-lite-store) | Hook | `const useAdminDashboardLiteStore: UseBoundStore<StoreApi<AdminDashboardStore>>` | Hook giving the dashboard page its stats, loading flag and fetch action. |

## Exports in detail

### `useAdminDashboardLiteStore` {#hook-use-admin-dashboard-lite-store}

*Hook*

Hook giving the dashboard page its stats, loading flag and fetch action.

```ts
const useAdminDashboardLiteStore: UseBoundStore<StoreApi<AdminDashboardStore>>
```

`fetchDashboard` calls `getAdminDashboardLite`, i.e.
`GET /admin/dashboard/lite`. The page calls it from an effect only when
`hasLoaded` is false, and `hasLoaded` is set on every outcome, so the store
fetches once per browser session: navigating away from the dashboard and
back shows the same numbers until a full page reload. There is no refresh
button and no polling.

Trap: the `catch` swallows the error and writes `fallbackStats`, so a failed
or unauthorised request renders six zeroes with no message. "All six are 0"
therefore means either a genuinely empty shop or a broken request, and the
UI cannot tell them apart. Check the network tab before believing the
numbers.

The store is created without a selector-equality helper, and the page
subscribes with `(state) => state`, so any change to the store re-renders
the whole dashboard. That is harmless here because there is only one write
per session.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/dashboard/store.ts#L70)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/dashboard/store.ts)
