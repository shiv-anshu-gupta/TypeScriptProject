# Server — routes: admin

The Express routers behind the admin panel: everything the shop side of the app can call.

|  |  |
|---|---|
| Kind | Reference group |
| Source folder | `server/src/routes/admin/` |
| Files | 7 |
| Exported symbols | 7 |
| Carrying a description | 0 of 7 symbols, 7 of 7 files |

## Files

| File | Title | Purpose | Exports |
|---|---|---|---|
| [`src/routes/admin/dashboard.routes.ts`](routes-admin-dashboard-routes.md) | adminDashboardRouter | Read-only counters and the seven-day trend behind the admin panel's home screen. | 1 |
| [`src/routes/admin/grocery-list.routes.ts`](routes-admin-grocery-list-routes.md) | adminGroceryListRouter | The shopkeeper's side of a grocery list: pricing it, moving it through the packing statuses, correcting its items, and the chat attached to it. | 1 |
| [`src/routes/admin/orders.routes.ts`](routes-admin-orders-routes.md) | adminOrderRouter | The shop's view of the `orders` collection. | 1 |
| [`src/routes/admin/product.routes.ts`](routes-admin-product-routes.md) | adminProductRouter | The admin catalogue: categories and products, including their image uploads. | 1 |
| [`src/routes/admin/promo.routes.ts`](routes-admin-promo-routes.md) | adminPromoRouter | Promo-code management for the shop. | 1 |
| [`src/routes/admin/push-token.routes.ts`](routes-admin-push-token-routes.md) | adminPushTokenRouter | Browser registration for the Firebase web-push alerts the admin panel receives when an order arrives. | 1 |
| [`src/routes/admin/settings.routes.ts`](routes-admin-settings-routes.md) | adminSettingsRouter | Shop settings: the home-screen banner carousel. | 1 |

## Exported symbols

???+ info "All 7 exported symbols"

    | Symbol | Kind | Defined in | Brief |
    |---|---|---|---|
    | [`adminDashboardRouter`](routes-admin-dashboard-routes.md#constant-admin-dashboard-router) | Constant | [`dashboard.routes`](routes-admin-dashboard-routes.md) | — |
    | [`adminGroceryListRouter`](routes-admin-grocery-list-routes.md#constant-admin-grocery-list-router) | Constant | [`grocery-list.routes`](routes-admin-grocery-list-routes.md) | — |
    | [`adminOrderRouter`](routes-admin-orders-routes.md#constant-admin-order-router) | Constant | [`orders.routes`](routes-admin-orders-routes.md) | — |
    | [`adminProductRouter`](routes-admin-product-routes.md#constant-admin-product-router) | Constant | [`product.routes`](routes-admin-product-routes.md) | — |
    | [`adminPromoRouter`](routes-admin-promo-routes.md#constant-admin-promo-router) | Constant | [`promo.routes`](routes-admin-promo-routes.md) | — |
    | [`adminPushTokenRouter`](routes-admin-push-token-routes.md#constant-admin-push-token-router) | Constant | [`push-token.routes`](routes-admin-push-token-routes.md) | — |
    | [`adminSettingsRouter`](routes-admin-settings-routes.md#constant-admin-settings-router) | Constant | [`settings.routes`](routes-admin-settings-routes.md) | — |

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/docs/tools/build-reference.mjs)
