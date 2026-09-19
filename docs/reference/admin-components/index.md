# Admin panel — components

The React components the admin pages are assembled from: dialogs, tables, toolbars, the sidebar and the auth layouts.

|  |  |
|---|---|
| Kind | Reference group |
| Source folder | `client/src/components/` |
| Files | 25 |
| Exported symbols | 28 |
| Carrying a description | 27 of 28 symbols, 24 of 25 files |

## Files

| File | Title | Purpose | Exports |
|---|---|---|---|
| [`src/components/admin/AdminPushBell.tsx`](components-admin-admin-push-bell.md) | AdminPushBell | The header control for browser push alerts. | 1 |
| [`src/components/admin/common/sidebar.tsx`](components-admin-common-sidebar.md) | Sidebar | The admin navigation: its item list and the three pieces that render it. | 4 |
| [`src/components/admin/dashboard/dashboard-charts.tsx`](components-admin-dashboard-dashboard-charts.md) | DashboardCharts | The two seven-day dashboard charts: orders per day and sales per day. | 1 |
| [`src/components/admin/grocery-lists/grocery-list-card.tsx`](components-admin-grocery-lists-grocery-list-card.md) | GroceryListCard | One customer order, and everything the shop does to it. | 1 |
| [`src/components/admin/grocery-lists/grocery-list-chat.tsx`](components-admin-grocery-lists-grocery-list-chat.md) | GroceryListChat | The chat thread between the shop and one customer about one order. | 1 |
| [`src/components/admin/grocery-lists/price-calculator.tsx`](components-admin-grocery-lists-price-calculator.md) | PriceCalculator | The per-row calculator popover on the grocery-lists card. | 1 |
| [`src/components/admin/products/category-dialog.tsx`](components-admin-products-category-dialog.md) | CategoryDialog | The "Manage Categories" dialog: add, rename, re-image and delete categories. | 1 |
| [`src/components/admin/products/image-picker.tsx`](components-admin-products-image-picker.md) | ImagePicker | The image area of the product dialog: two pickers, the existing pictures and previews of newly added files. | 1 |
| [`src/components/admin/products/product-dialog.tsx`](components-admin-products-product-dialog.md) | ProductDialog | The create/edit product dialog. | 1 |
| [`src/components/admin/products/products-table.tsx`](components-admin-products-products-table.md) | ProductsTable | The products table on `/admin/products`. | 1 |
| [`src/components/admin/products/products-toolbar.tsx`](components-admin-products-products-toolbar.md) | ProductToolbar | The search box and action buttons above the products table. | 1 |
| [`src/components/admin/promos/promo-dialog.tsx`](components-admin-promos-promo-dialog.md) | PromoDialog | The create/edit promo dialog. | 1 |
| [`src/components/admin/promos/promo-toolbar.tsx`](components-admin-promos-promo-toolbar.md) | PromoToolbar | The controls above the promos table: a search box and an "Add promo" button. | 1 |
| [`src/components/admin/promos/promos-table.tsx`](components-admin-promos-promos-table.md) | PromoTable | The promos table: one row per promo code, with edit and delete controls. | 1 |
| [`src/components/admin/settings/banner-edit-dialog.tsx`](components-admin-settings-banner-edit-dialog.md) | BannerEditDialog | The banner edit dialog: name, tap target and optional schedule. | 1 |
| [`src/components/admin/settings/banner-list.tsx`](components-admin-settings-banner-list.md) | BannerList | The ordered list of banners, with reorder, visibility, edit and delete controls. | 1 |
| [`src/components/admin/settings/banner-phone-preview.tsx`](components-admin-settings-banner-phone-preview.md) | BannerPhonePreview | A mock phone showing the live banners as the app's Home carousel draws them. | 1 |
| [`src/components/admin/settings/banner-uploader.tsx`](components-admin-settings-banner-uploader.md) | BannerUploader | The drag-and-drop banner uploader. | 1 |
| [`src/components/auth/AuthShell.tsx`](components-auth-auth-shell.md) | AuthShell | The brand frame around the Clerk sign-in and sign-up forms. | 1 |
| [`src/components/auth/ProtectedLayout.tsx`](components-auth-protected-layout.md) | ProtectedLayout | Route guard: requires a signed-in Clerk session. | 1 |
| [`src/components/auth/PublicOnlyLayout.tsx`](components-auth-public-only-layout.md) | PublicOnlyLayout | Route guard for the sign-in and sign-up pages: keeps signed-in users out. | 1 |
| [`src/components/auth/RoleGuardLayout.tsx`](components-auth-role-guard-layout.md) | RoleGuardLayout | Route guard: requires the signed-in user to hold an allowed role. | 1 |
| [`src/components/common/Loader.tsx`](components-common-loader.md) | Commonloader | The full-screen spinner shown while the route guards wait. | 1 |
| [`src/components/layout/AdminLayout.tsx`](components-layout-admin-layout.md) | AdminLayout | The shell every admin page renders inside: sidebar, header, content area. | 1 |
| [`src/components/layout/CustomerLayout.tsx`](components-layout-customer-layout.md) | CustomerLayout | — | 1 |

## Exported symbols

???+ info "All 28 exported symbols"

    | Symbol | Kind | Defined in | Brief |
    |---|---|---|---|
    | [`AdminBrand`](components-admin-common-sidebar.md#component-admin-brand) | React component | [`sidebar`](components-admin-common-sidebar.md) | The shop name and icon. |
    | [`AdminLayout`](components-layout-admin-layout.md#component-admin-layout) | React component | [`AdminLayout`](components-layout-admin-layout.md) | Frames the admin pages with navigation and a sticky header. |
    | [`adminNavItems`](components-admin-common-sidebar.md#constant-admin-nav-items) | Constant | [`sidebar`](components-admin-common-sidebar.md) | The navigation entries, in display order. |
    | [`AdminNavList`](components-admin-common-sidebar.md#component-admin-nav-list) | React component | [`sidebar`](components-admin-common-sidebar.md) | Renders [`adminNavItems`](components-admin-common-sidebar.md#constant-admin-nav-items) as router links, highlighting the current page. |
    | [`AdminPushBell`](components-admin-admin-push-bell.md#component-admin-push-bell) | React component | [`AdminPushBell`](components-admin-admin-push-bell.md) | Lets the shopkeeper switch on OS-level alerts for new orders. |
    | [`AdminSidebar`](components-admin-common-sidebar.md#component-admin-sidebar) | React component | [`sidebar`](components-admin-common-sidebar.md) | The fixed 280px sidebar, shown only from the `lg` breakpoint upwards. |
    | [`AuthShell`](components-auth-auth-shell.md#component-auth-shell) | React component | [`AuthShell`](components-auth-auth-shell.md) | Wraps a Clerk auth form in the sKirana brand frame. |
    | [`BannerEditDialog`](components-admin-settings-banner-edit-dialog.md#component-banner-edit-dialog) | React component | [`banner-edit-dialog`](components-admin-settings-banner-edit-dialog.md) | Modal form for one banner's name, tap target and schedule. |
    | [`BannerList`](components-admin-settings-banner-list.md#component-banner-list) | React component | [`banner-list`](components-admin-settings-banner-list.md) | Renders one row per banner, plus the delete confirmation dialog. |
    | [`BannerPhonePreview`](components-admin-settings-banner-phone-preview.md#component-banner-phone-preview) | React component | [`banner-phone-preview`](components-admin-settings-banner-phone-preview.md) | Renders the phone mock and its carousel. |
    | [`BannerUploader`](components-admin-settings-banner-uploader.md#component-banner-uploader) | React component | [`banner-uploader`](components-admin-settings-banner-uploader.md) | Lets the admin pick banner images, shows what is wrong with each, and uploads the acceptable ones. |
    | [`CategoryDialog`](components-admin-products-category-dialog.md#component-category-dialog) | React component | [`category-dialog`](components-admin-products-category-dialog.md) | Dialog for managing product categories. |
    | [`Commonloader`](components-common-loader.md#component-commonloader) | React component | [`Loader`](components-common-loader.md) | A centred spinner with a caption. |
    | [`CustomerLayout`](components-layout-customer-layout.md#component-customer-layout) | React component | [`CustomerLayout`](components-layout-customer-layout.md) | — |
    | [`DashboardCharts`](components-admin-dashboard-dashboard-charts.md#component-dashboard-charts) | React component | [`dashboard-charts`](components-admin-dashboard-dashboard-charts.md) | Fetches the seven-day series and renders the orders bar chart and the sales area chart side by side. |
    | [`GroceryListCard`](components-admin-grocery-lists-grocery-list-card.md#component-grocery-list-card) | React component | [`grocery-list-card`](components-admin-grocery-lists-grocery-list-card.md) | Renders one order with every action the shop can take on it. |
    | [`GroceryListChat`](components-admin-grocery-lists-grocery-list-chat.md#component-grocery-list-chat) | React component | [`grocery-list-chat`](components-admin-grocery-lists-grocery-list-chat.md) | Shows and sends messages for one order. |
    | [`ImagePicker`](components-admin-products-image-picker.md#component-image-picker) | React component | [`image-picker`](components-admin-products-image-picker.md) | Picks product images and manages the ones already saved. |
    | [`PriceCalculator`](components-admin-grocery-lists-price-calculator.md#component-price-calculator) | React component | [`price-calculator`](components-admin-grocery-lists-price-calculator.md) | A popover calculator that writes its result into one line's price. |
    | [`ProductDialog`](components-admin-products-product-dialog.md#component-product-dialog) | React component | [`product-dialog`](components-admin-products-product-dialog.md) | Dialog for creating or editing one product. |
    | [`ProductsTable`](components-admin-products-products-table.md#component-products-table) | React component | [`products-table`](components-admin-products-products-table.md) | Lists products with cover image, title, brand, category, unit, status and stock. |
    | [`ProductToolbar`](components-admin-products-products-toolbar.md#component-product-toolbar) | React component | [`products-toolbar`](components-admin-products-products-toolbar.md) | The products search field plus "Manage Category" and "Add Product". |
    | [`PromoDialog`](components-admin-promos-promo-dialog.md#component-promo-dialog) | React component | [`promo-dialog`](components-admin-promos-promo-dialog.md) | Modal form for creating or editing one promo. |
    | [`PromoTable`](components-admin-promos-promos-table.md#component-promo-table) | React component | [`promos-table`](components-admin-promos-promos-table.md) | Renders the promo rows, or a single full-width cell while loading or when the list is empty. |
    | [`PromoToolbar`](components-admin-promos-promo-toolbar.md#component-promo-toolbar) | React component | [`promo-toolbar`](components-admin-promos-promo-toolbar.md) | Search field plus "Add promo" button. |
    | [`ProtectedLayout`](components-auth-protected-layout.md#component-protected-layout) | React component | [`ProtectedLayout`](components-auth-protected-layout.md) | Renders child routes only once Clerk reports a signed-in user. |
    | [`PublicOnlyLayout`](components-auth-public-only-layout.md#component-public-only-layout) | React component | [`PublicOnlyLayout`](components-auth-public-only-layout.md) | Sends an already signed-in user away from the sign-in page. |
    | [`RoleGuardLayout`](components-auth-role-guard-layout.md#component-role-guard-layout) | React component | [`RoleGuardLayout`](components-auth-role-guard-layout.md) | Renders child routes only for a user whose role is in `allow`. |

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/docs/tools/build-reference.mjs)
