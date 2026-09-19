# Admin panel — pages

One page per route of the admin panel, plus the app shell and the router that chooses between them.

|  |  |
|---|---|
| Kind | Reference group |
| Source folder | `client/src/pages/` |
| Files | 14 |
| Exported symbols | 13 |
| Carrying a description | 12 of 13 symbols, 14 of 14 files |

## Files

| File | Title | Purpose | Exports |
|---|---|---|---|
| [`src/App.tsx`](app.md) | App | Root component: starts the auth bootstrap, then renders the router. | 1 |
| [`src/main.tsx`](main.md) | Main | Browser entry point for the sKirana admin single-page app. | 0 |
| [`src/pages/admin/Dashboard.tsx`](pages-admin-dashboard.md) | AdminDashboard | The admin dashboard page at `/admin/dashboard`. | 1 |
| [`src/pages/admin/GroceryLists.tsx`](pages-admin-grocery-lists.md) | AdminGroceryLists | `/admin/grocery-lists` — the screen the shop works from all day. | 1 |
| [`src/pages/admin/Messages.tsx`](pages-admin-messages.md) | AdminMessages | `/admin/messages` — every customer conversation in one list. | 1 |
| [`src/pages/admin/Orders.tsx`](pages-admin-orders.md) | AdminOrders | The legacy orders table, kept on disk but no longer routed. | 1 |
| [`src/pages/admin/Products.tsx`](pages-admin-products.md) | AdminProducts | The `/admin/products` screen — the shop's catalogue for the mobile app's Shop tab. | 1 |
| [`src/pages/admin/Promos.tsx`](pages-admin-promos.md) | AdminPromos | The promo-code admin screen: a searchable table of promos plus a create/edit dialog. | 1 |
| [`src/pages/admin/Settings.tsx`](pages-admin-settings.md) | AdminSettings | The home-banners admin screen. | 1 |
| [`src/pages/auth/Sign-in.tsx`](pages-auth-sign-in.md) | SignInPage | The `/sign-in/*` page. | 1 |
| [`src/pages/auth/Sign-up.tsx`](pages-auth-sign-up.md) | SignUpPage | The `/sign-up/*` page. | 1 |
| [`src/pages/legal/DeleteAccount.tsx`](pages-legal-delete-account.md) | DeleteAccountPage | The public account-deletion instructions page. | 1 |
| [`src/pages/legal/Privacy.tsx`](pages-legal-privacy.md) | PrivacyPage | The public privacy policy and terms of use page. | 1 |
| [`src/router.tsx`](router.md) | router | The route table — and the authority on which code in this app is alive. | 1 |

## Exported symbols

???+ info "All 13 exported symbols"

    | Symbol | Kind | Defined in | Brief |
    |---|---|---|---|
    | [`AdminDashboard`](pages-admin-dashboard.md#component-admin-dashboard) | React component | [`Dashboard`](pages-admin-dashboard.md) | Renders the dashboard: six stat cards above the seven-day charts. |
    | [`AdminGroceryLists`](pages-admin-grocery-lists.md#component-admin-grocery-lists) | React component | [`GroceryLists`](pages-admin-grocery-lists.md) | Lists the shop's orders, with the three tools used to find one. |
    | [`AdminMessages`](pages-admin-messages.md#component-admin-messages) | React component | [`Messages`](pages-admin-messages.md) | Lists every conversation, newest activity first, and opens one in place. |
    | [`AdminOrders`](pages-admin-orders.md#component-admin-orders) | React component | [`Orders`](pages-admin-orders.md) | — |
    | [`AdminProducts`](pages-admin-products.md#component-admin-products) | React component | [`Products`](pages-admin-products.md) | Renders the products card — toolbar plus table — and mounts both dialogs. |
    | [`AdminPromos`](pages-admin-promos.md#component-admin-promos) | React component | [`Promos`](pages-admin-promos.md) | Route component for `/admin/coupons`. |
    | [`AdminSettings`](pages-admin-settings.md#component-admin-settings) | React component | [`Settings`](pages-admin-settings.md) | Route component for `/admin/settings`. |
    | [`App`](app.md#component-app) | React component | [`App`](app.md) | Renders the whole admin app. |
    | [`DeleteAccountPage`](pages-legal-delete-account.md#component-delete-account-page) | React component | [`DeleteAccount`](pages-legal-delete-account.md) | Renders the deletion instructions, what is removed, and the timings. |
    | [`PrivacyPage`](pages-legal-privacy.md#component-privacy-page) | React component | [`Privacy`](pages-legal-privacy.md) | Renders the full privacy policy followed by the terms of use. |
    | [`router`](router.md#constant-router) | Constant | [`router`](router.md) | Every route the app can reach. |
    | [`SignInPage`](pages-auth-sign-in.md#component-sign-in-page) | React component | [`Sign-in`](pages-auth-sign-in.md) | Clerk's sign-in form inside the sKirana brand frame. |
    | [`SignUpPage`](pages-auth-sign-up.md#component-sign-up-page) | React component | [`Sign-up`](pages-auth-sign-up.md) | Clerk's sign-up form inside the sKirana brand frame. |

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/docs/tools/build-reference.mjs)
