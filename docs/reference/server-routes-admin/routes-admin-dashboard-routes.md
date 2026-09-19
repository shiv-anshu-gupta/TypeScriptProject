# adminDashboardRouter `dashboard.routes`

Read-only counters and the seven-day trend behind the admin panel's home screen.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/routes/admin/dashboard.routes.ts` |
| Group | [Server — routes: admin](index.md) |
| Exports | 1 |

## Description

Mounted at `/admin` in `server/src/server.ts`, giving
`GET /admin/dashboard/lite` and `GET /admin/dashboard/daily`.

Both routes require an admin (`requireAdmin` is applied router-wide), take
no parameters and write nothing.

"Orders" here means grocery lists, not the `orders` collection. The shop
runs on grocery lists, so every order and sales figure on this dashboard is
computed from `grocerylists`; the `orders` collection is not read at all.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`adminDashboardRouter`](#constant-admin-dashboard-router) | Constant | `const adminDashboardRouter: Router` | — |

## Exports in detail

### `adminDashboardRouter` {#constant-admin-dashboard-router}

*Constant*

```ts
const adminDashboardRouter: Router
```

*No description in the source.*

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/routes/admin/dashboard.routes.ts#L31)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/routes/admin/dashboard.routes.ts)
