# Admin panel — features and hooks

Per-feature API calls, stores, request/response types and the hooks the pages call instead of fetching directly.

|  |  |
|---|---|
| Kind | Reference group |
| Source folder | `client/src/features/` |
| Files | 27 |
| Exported symbols | 102 |
| Carrying a description | 94 of 102 symbols, 27 of 27 files |

## Files

| File | Title | Purpose | Exports |
|---|---|---|---|
| [`src/features/admin/dashboard/api.ts`](features-admin-dashboard-api.md) | Dashboard api | HTTP calls for the admin dashboard. | 2 |
| [`src/features/admin/dashboard/store.ts`](features-admin-dashboard-store.md) | useAdminDashboardLiteStore | Zustand store holding the six dashboard stat-card figures. | 1 |
| [`src/features/admin/dashboard/types.ts`](features-admin-dashboard-types.md) | Dashboard types | Response shapes for the two admin dashboard endpoints. | 3 |
| [`src/features/admin/grocery-lists/api.ts`](features-admin-grocery-lists-api.md) | Grocery lists api | Every server call the grocery-lists screen makes. | 10 |
| [`src/features/admin/grocery-lists/types.ts`](features-admin-grocery-lists-types.md) | Grocery lists types | The shapes behind the shop's daily screen: orders, their items, the chat, and the bodies of the endpoints that change them. | 13 |
| [`src/features/admin/grocery-lists/use-admin-grocery-lists.ts`](features-admin-grocery-lists-use-admin-grocery-lists.md) | useAdminGroceryLists | The state behind `/admin/grocery-lists`, the screen the shop uses all day. | 2 |
| [`src/features/admin/notifications/api.ts`](features-admin-notifications-api.md) | registerAdminPushToken | Registering this browser for admin push. | 1 |
| [`src/features/admin/notifications/use-admin-push.ts`](features-admin-notifications-use-admin-push.md) | useAdminPush | The browser-push opt-in and foreground-message handling. | 1 |
| [`src/features/admin/orders/api.ts`](features-admin-orders-api.md) | Orders api | Server calls for the legacy orders table, which is no longer routed. | 2 |
| [`src/features/admin/orders/store.ts`](features-admin-orders-store.md) | useAdminOrdersStore | State for the legacy orders table, which is no longer routed. | 1 |
| [`src/features/admin/orders/types.ts`](features-admin-orders-types.md) | Orders types | Types for the legacy orders table, which is no longer routed. | 5 |
| [`src/features/admin/products/api.ts`](features-admin-products-api.md) | Products api | Every HTTP call the admin products and categories screens make. | 9 |
| [`src/features/admin/products/constants.ts`](features-admin-products-constants.md) | Products constants | Fixed option lists used by the admin products screens. | 2 |
| [`src/features/admin/products/types.ts`](features-admin-products-types.md) | Products types | Types for the admin products and categories screens. | 11 |
| [`src/features/admin/products/use-admin-products.ts`](features-admin-products-use-admin-products.md) | useAdminProducts | State for the `/admin/products` page: the product list, the category list and the two dialogs. | 1 |
| [`src/features/admin/products/use-product-form.ts`](features-admin-products-use-product-form.md) | useProductForm | The product create/edit form: its state, its image rules, its validation and its save and delete calls. | 2 |
| [`src/features/admin/promo/api.ts`](features-admin-promo-api.md) | Promo api | Server calls for admin promo codes. | 4 |
| [`src/features/admin/promo/types.ts`](features-admin-promo-types.md) | Promo types | Types for admin promo codes. | 3 |
| [`src/features/admin/promo/use-admin-promo.ts`](features-admin-promo-use-admin-promo.md) | useAdminPromos | State and server calls for the `/admin/coupons` (Promos) page. | 1 |
| [`src/features/admin/settings/api.ts`](features-admin-settings-api.md) | Settings api | Server calls for the app's home banners. | 5 |
| [`src/features/admin/settings/banner-status.ts`](features-admin-settings-banner-status.md) | Banner status | Banner shape constants, upload limits, and the local rules that decide what the app will do with each banner. | 11 |
| [`src/features/admin/settings/types.ts`](features-admin-settings-types.md) | Settings types | Types for the app's home banners. | 5 |
| [`src/features/admin/settings/use-admin-banners.ts`](features-admin-settings-use-admin-banners.md) | useAdminBanners | State and server calls for the `/admin/settings` home-banners page. | 1 |
| [`src/features/auth/api.ts`](features-auth-api.md) | Auth api | The two auth endpoint calls. | 2 |
| [`src/features/auth/store.ts`](features-auth-store.md) | useAuthStore | The single source of truth for who is signed in and what they may do. | 1 |
| [`src/features/auth/types.ts`](features-auth-types.md) | Auth types | Response shapes for the two auth endpoints. | 2 |
| [`src/features/auth/useBootstrapAuth.ts`](features-auth-use-bootstrap-auth.md) | useBootstrapAuth | Turns a Clerk session into an application user, once per page load. | 1 |

## Exported symbols

???+ info "All 102 exported symbols"

    | Symbol | Kind | Defined in | Brief |
    |---|---|---|---|
    | [`addAdminGroceryListItem`](features-admin-grocery-lists-api.md#function-add-admin-grocery-list-item) | Function | [`api`](features-admin-grocery-lists-api.md) | Appends a line the customer asked for after sending the list. |
    | [`AddGroceryListItemBody`](features-admin-grocery-lists-types.md#type-add-grocery-list-item-body) | Type | [`types`](features-admin-grocery-lists-types.md) | Body of `POST /admin/grocery-lists/:id/items` and of the item edit. |
    | [`AdminBanner`](features-admin-settings-types.md#type-admin-banner) | Type | [`types`](features-admin-settings-types.md) | One banner as the server stores it. |
    | [`AdminBannersResponse`](features-admin-settings-types.md#type-admin-banners-response) | Type | [`types`](features-admin-settings-types.md) | Payload of every banner endpoint. |
    | [`AdminConversation`](features-admin-grocery-lists-types.md#type-admin-conversation) | Type | [`types`](features-admin-grocery-lists-types.md) | One customer conversation as shown on the Messages page. |
    | [`AdminConversationsResponse`](features-admin-grocery-lists-types.md#type-admin-conversations-response) | Type | [`types`](features-admin-grocery-lists-types.md) | Payload of `GET /admin/grocery-lists/conversations`. |
    | [`AdminDashboardDaily`](features-admin-dashboard-types.md#type-admin-dashboard-daily) | Type | [`types`](features-admin-dashboard-types.md) | The envelope payload of `GET /admin/dashboard/daily`. |
    | [`AdminDashboardLite`](features-admin-dashboard-types.md#type-admin-dashboard-lite) | Type | [`types`](features-admin-dashboard-types.md) | The six headline counters returned by `GET /admin/dashboard/lite`. |
    | [`AdminGroceryList`](features-admin-grocery-lists-types.md#type-admin-grocery-list) | Type | [`types`](features-admin-grocery-lists-types.md) | A complete order, as the grocery-lists page works with it. |
    | [`AdminGroceryListItem`](features-admin-grocery-lists-types.md#type-admin-grocery-list-item) | Type | [`types`](features-admin-grocery-lists-types.md) | One line of an order. |
    | [`AdminGroceryListsResponse`](features-admin-grocery-lists-types.md#type-admin-grocery-lists-response) | Type | [`types`](features-admin-grocery-lists-types.md) | Payload of `GET /admin/grocery-lists` — and of every mutation on this page. |
    | [`AdminOrder`](features-admin-orders-types.md#type-admin-order) | Type | [`types`](features-admin-orders-types.md) | — |
    | [`AdminOrdersResponse`](features-admin-orders-types.md#type-admin-orders-response) | Type | [`types`](features-admin-orders-types.md) | — |
    | [`AdminOrderStatus`](features-admin-orders-types.md#type-admin-order-status) | Type | [`types`](features-admin-orders-types.md) | — |
    | [`AdminPaymentStatus`](features-admin-orders-types.md#type-admin-payment-status) | Type | [`types`](features-admin-orders-types.md) | — |
    | [`AdminPromosResponse`](features-admin-promo-types.md#type-admin-promos-response) | Type | [`types`](features-admin-promo-types.md) | Payload of every promo endpoint. |
    | [`AdminUpdateOrderStatusResponse`](features-admin-orders-types.md#type-admin-update-order-status-response) | Type | [`types`](features-admin-orders-types.md) | — |
    | [`BANNER_HEIGHT`](features-admin-settings-banner-status.md#constant-banner-height) | Constant | [`banner-status`](features-admin-settings-banner-status.md) | Target banner height in pixels, paired with [`BANNER_WIDTH`](features-admin-settings-banner-status.md#constant-banner-width). |
    | [`BANNER_RATIO`](features-admin-settings-banner-status.md#constant-banner-ratio) | Constant | [`banner-status`](features-admin-settings-banner-status.md) | Banner height divided by width, 0.46. |
    | [`BANNER_TYPES`](features-admin-settings-banner-status.md#constant-banner-types) | Constant | [`banner-status`](features-admin-settings-banner-status.md) | Accepted MIME types. |
    | [`BANNER_WIDTH`](features-admin-settings-banner-status.md#constant-banner-width) | Constant | [`banner-status`](features-admin-settings-banner-status.md) | Target banner width in pixels. |
    | [`BannerLinkType`](features-admin-settings-types.md#type-banner-link-type) | Type | [`types`](features-admin-settings-types.md) | Where a tap on a banner leads in the mobile app. |
    | [`BannerStatus`](features-admin-settings-types.md#type-banner-status) | Type | [`types`](features-admin-settings-types.md) | A banner's computed state. |
    | [`bannerStatuses`](features-admin-settings-banner-status.md#function-banner-statuses) | Function | [`banner-status`](features-admin-settings-banner-status.md) | Works out the status of every banner, in list order. |
    | [`Category`](features-admin-products-types.md#type-category) | Type | [`types`](features-admin-products-types.md) | A product category as the server stores it. |
    | [`ChatMessage`](features-admin-grocery-lists-types.md#type-chat-message) | Type | [`types`](features-admin-grocery-lists-types.md) | One chat message between the shop and the customer about an order. |
    | [`ChatMessagesResponse`](features-admin-grocery-lists-types.md#type-chat-messages-response) | Type | [`types`](features-admin-grocery-lists-types.md) | Payload of `GET /admin/grocery-lists/:id/messages`. |
    | [`createAdminCategory`](features-admin-products-api.md#function-create-admin-category) | Function | [`api`](features-admin-products-api.md) | Creates a category. |
    | [`createAdminProduct`](features-admin-products-api.md#function-create-admin-product) | Function | [`api`](features-admin-products-api.md) | Creates a product. |
    | [`createAdminPromo`](features-admin-promo-api.md#function-create-admin-promo) | Function | [`api`](features-admin-promo-api.md) | Creates a promo code. |
    | [`CreateCategoryBody`](features-admin-products-types.md#type-create-category-body) | Type | [`types`](features-admin-products-types.md) | Body for `POST /admin/categories`. |
    | [`CreateProductBody`](features-admin-products-types.md#type-create-product-body) | Type | [`types`](features-admin-products-types.md) | Body for `POST /admin/products`. |
    | [`DashboardDailyPoint`](features-admin-dashboard-types.md#type-dashboard-daily-point) | Type | [`types`](features-admin-dashboard-types.md) | One day in the seven-day dashboard trend. |
    | [`deleteAdminBanner`](features-admin-settings-api.md#function-delete-admin-banner) | Function | [`api`](features-admin-settings-api.md) | Deletes one banner and its stored image. |
    | [`deleteAdminCategory`](features-admin-products-api.md#function-delete-admin-category) | Function | [`api`](features-admin-products-api.md) | Deletes a category. |
    | [`deleteAdminProduct`](features-admin-products-api.md#function-delete-admin-product) | Function | [`api`](features-admin-products-api.md) | Deletes a product. |
    | [`deleteAdminPromo`](features-admin-promo-api.md#function-delete-admin-promo) | Function | [`api`](features-admin-promo-api.md) | Deletes one promo code. |
    | [`extractAdminOrders`](features-admin-orders-api.md#function-extract-admin-orders) | Function | [`api`](features-admin-orders-api.md) | — |
    | [`fromLocalInput`](features-admin-settings-banner-status.md#function-from-local-input) | Function | [`banner-status`](features-admin-settings-banner-status.md) | Converts a `datetime-local` input value back to an ISO timestamp. |
    | [`getAdminBanners`](features-admin-settings-api.md#function-get-admin-banners) | Function | [`api`](features-admin-settings-api.md) | Fetches every banner, in order, plus the carousel limit. |
    | [`getAdminCategories`](features-admin-products-api.md#function-get-admin-categories) | Function | [`api`](features-admin-products-api.md) | Fetches every category. |
    | [`getAdminConversations`](features-admin-grocery-lists-api.md#function-get-admin-conversations) | Function | [`api`](features-admin-grocery-lists-api.md) | Fetches a summary of every customer conversation. |
    | [`getAdminDashboardDaily`](features-admin-dashboard-api.md#function-get-admin-dashboard-daily) | Function | [`api`](features-admin-dashboard-api.md) | Fetches the seven-day orders and sales series used by the charts. |
    | [`getAdminDashboardLite`](features-admin-dashboard-api.md#function-get-admin-dashboard-lite) | Function | [`api`](features-admin-dashboard-api.md) | Fetches the six headline counters shown on the dashboard stat cards. |
    | [`getAdminGroceryListMessages`](features-admin-grocery-lists-api.md#function-get-admin-grocery-list-messages) | Function | [`api`](features-admin-grocery-lists-api.md) | Fetches the full chat thread for one order. |
    | [`getAdminGroceryLists`](features-admin-grocery-lists-api.md#function-get-admin-grocery-lists) | Function | [`api`](features-admin-grocery-lists-api.md) | Fetches every grocery list the shop has. |
    | [`getAdminProductById`](features-admin-products-api.md#function-get-admin-product-by-id) | Function | [`api`](features-admin-products-api.md) | Fetches one product. |
    | [`getAdminProducts`](features-admin-products-api.md#function-get-admin-products) | Function | [`api`](features-admin-products-api.md) | Fetches products, optionally filtered by a search term. |
    | [`getAdminPromos`](features-admin-promo-api.md#function-get-admin-promos) | Function | [`api`](features-admin-promo-api.md) | Fetches every promo code. |
    | [`getCoverImage`](features-admin-products-use-product-form.md#function-get-cover-image) | Function | [`use-product-form`](features-admin-products-use-product-form.md) | Picks the picture to show as a product's cover. |
    | [`getMe`](features-auth-api.md#function-get-me) | Function | [`api`](features-auth-api.md) | Reads the signed-in user, including the role the guards check. |
    | [`GroceryListPaymentMethod`](features-admin-grocery-lists-types.md#type-grocery-list-payment-method) | Type | [`types`](features-admin-grocery-lists-types.md) | How the customer said they would pay. |
    | [`GroceryListPaymentStatus`](features-admin-grocery-lists-types.md#type-grocery-list-payment-status) | Type | [`types`](features-admin-grocery-lists-types.md) | Whether the money has arrived. |
    | [`GroceryListStatus`](features-admin-grocery-lists-types.md#type-grocery-list-status) | Type | [`types`](features-admin-grocery-lists-types.md) | Where an order has got to. |
    | [`LINK_LABELS`](features-admin-settings-banner-status.md#constant-link-labels) | Constant | [`banner-status`](features-admin-settings-banner-status.md) | Human labels for each link type, shown in the edit dialog's dropdown and reused by [`linkSummary`](features-admin-settings-banner-status.md#function-link-summary). |
    | [`linkSummary`](features-admin-settings-banner-status.md#function-link-summary) | Function | [`banner-status`](features-admin-settings-banner-status.md) | One line describing what a banner opens when tapped. |
    | [`markAdminGroceryListPaid`](features-admin-grocery-lists-api.md#function-mark-admin-grocery-list-paid) | Function | [`api`](features-admin-grocery-lists-api.md) | Records that the money for an order has arrived. |
    | [`MAX_BANNER_BYTES`](features-admin-settings-banner-status.md#constant-max-banner-bytes) | Constant | [`banner-status`](features-admin-settings-banner-status.md) | Per-file upload ceiling, 5 MB. |
    | [`MeResponse`](features-auth-types.md#type-me-response) | Type | [`types`](features-auth-types.md) | Payload of `GET /auth/me`. |
    | [`Product`](features-admin-products-types.md#type-product) | Type | [`types`](features-admin-products-types.md) | A product as returned by `GET /admin/products` and `GET /admin/products/:id`. |
    | [`ProductCategory`](features-admin-products-types.md#type-product-category) | Type | [`types`](features-admin-products-types.md) | The category as embedded inside a [`Product`](features-admin-products-types.md#type-product). |
    | [`ProductFormState`](features-admin-products-types.md#type-product-form-state) | Type | [`types`](features-admin-products-types.md) | The in-memory state of the product dialog's form. |
    | [`ProductImage`](features-admin-products-types.md#type-product-image) | Type | [`types`](features-admin-products-types.md) | One uploaded product picture. |
    | [`ProductStatus`](features-admin-products-types.md#type-product-status) | Type | [`types`](features-admin-products-types.md) | Whether a product is shown in the mobile app's Shop tab. |
    | [`ProductUnit`](features-admin-products-types.md#type-product-unit) | Type | [`types`](features-admin-products-types.md) | How a product is sold. |
    | [`Promo`](features-admin-promo-types.md#type-promo) | Type | [`types`](features-admin-promo-types.md) | One promo code as the server stores it. |
    | [`PromoFormValues`](features-admin-promo-types.md#type-promo-form-values) | Type | [`types`](features-admin-promo-types.md) | The promo dialog's form state, and the request body sent to the server. |
    | [`registerAdminPushToken`](features-admin-notifications-api.md#function-register-admin-push-token) | Function | [`api`](features-admin-notifications-api.md) | Tells the server which FCM token addresses this browser. |
    | [`reorderAdminBanners`](features-admin-settings-api.md#function-reorder-admin-banners) | Function | [`api`](features-admin-settings-api.md) | Stores a new banner order. |
    | [`scheduleSummary`](features-admin-settings-banner-status.md#function-schedule-summary) | Function | [`banner-status`](features-admin-settings-banner-status.md) | One line describing when a banner shows. |
    | [`sendAdminGroceryListMessage`](features-admin-grocery-lists-api.md#function-send-admin-grocery-list-message) | Function | [`api`](features-admin-grocery-lists-api.md) | Sends a message from the shop to the customer. |
    | [`setAdminGroceryListItemAvailability`](features-admin-grocery-lists-api.md#function-set-admin-grocery-list-item-availability) | Function | [`api`](features-admin-grocery-lists-api.md) | Marks one line out of stock, or puts it back. |
    | [`setAdminGroceryListPrices`](features-admin-grocery-lists-api.md#function-set-admin-grocery-list-prices) | Function | [`api`](features-admin-grocery-lists-api.md) | Saves the shopkeeper's prices and tells the customer. |
    | [`SetGroceryListPricesBody`](features-admin-grocery-lists-types.md#type-set-grocery-list-prices-body) | Type | [`types`](features-admin-grocery-lists-types.md) | Body of `PATCH /admin/grocery-lists/:id/prices`. |
    | [`SIZE_OPTIONS`](features-admin-products-constants.md#constant-size-options) | Constant | [`constants`](features-admin-products-constants.md) | Garment sizes. |
    | [`StatusTab`](features-admin-grocery-lists-use-admin-grocery-lists.md#type-status-tab) | Type | [`use-admin-grocery-lists`](features-admin-grocery-lists-use-admin-grocery-lists.md) | The three tabs at the top of the page. |
    | [`SyncResponse`](features-auth-types.md#type-sync-response) | Type | [`types`](features-auth-types.md) | Payload of `POST /auth/sync`. |
    | [`syncUser`](features-auth-api.md#function-sync-user) | Function | [`api`](features-auth-api.md) | Creates or refreshes this Clerk user's record on the server. |
    | [`toLocalInput`](features-admin-settings-banner-status.md#function-to-local-input) | Function | [`banner-status`](features-admin-settings-banner-status.md) | Converts a stored ISO timestamp into a value for `<input type="datetime-local">`. |
    | [`UNIT_OPTIONS`](features-admin-products-constants.md#constant-unit-options) | Constant | [`constants`](features-admin-products-constants.md) | The units a shopkeeper can pick in the product dialog. |
    | [`updateAdminBanner`](features-admin-settings-api.md#function-update-admin-banner) | Function | [`api`](features-admin-settings-api.md) | Updates one banner's title, link, schedule or visibility. |
    | [`updateAdminCategory`](features-admin-products-api.md#function-update-admin-category) | Function | [`api`](features-admin-products-api.md) | Renames a category and optionally replaces its image. |
    | [`updateAdminGroceryListItem`](features-admin-grocery-lists-api.md#function-update-admin-grocery-list-item) | Function | [`api`](features-admin-grocery-lists-api.md) | Corrects an existing line's name or quantity. |
    | [`updateAdminGroceryListStatus`](features-admin-grocery-lists-api.md#function-update-admin-grocery-list-status) | Function | [`api`](features-admin-grocery-lists-api.md) | Advances an order one step along the flow, or cancels it. |
    | [`updateAdminOrderStatus`](features-admin-orders-api.md#function-update-admin-order-status) | Function | [`api`](features-admin-orders-api.md) | — |
    | [`updateAdminProduct`](features-admin-products-api.md#function-update-admin-product) | Function | [`api`](features-admin-products-api.md) | Updates a product. |
    | [`updateAdminPromo`](features-admin-promo-api.md#function-update-admin-promo) | Function | [`api`](features-admin-promo-api.md) | Updates one promo code. |
    | [`UpdateBannerBody`](features-admin-settings-types.md#type-update-banner-body) | Type | [`types`](features-admin-settings-types.md) | Body of `PATCH /admin/settings/banners/:id`. |
    | [`UpdateCategoryBody`](features-admin-products-types.md#type-update-category-body) | Type | [`types`](features-admin-products-types.md) | Body for `PUT /admin/categories/:id`. |
    | [`UpdateGroceryListStatusBody`](features-admin-grocery-lists-types.md#type-update-grocery-list-status-body) | Type | [`types`](features-admin-grocery-lists-types.md) | Body of `PATCH /admin/grocery-lists/:id/status`. |
    | [`UpdateProductBody`](features-admin-products-types.md#type-update-product-body) | Type | [`types`](features-admin-products-types.md) | Body for `PUT /admin/products/:id`. |
    | [`uploadAdminBanners`](features-admin-settings-api.md#function-upload-admin-banners) | Function | [`api`](features-admin-settings-api.md) | Uploads one or more banner images. |
    | [`useAdminBanners`](features-admin-settings-use-admin-banners.md#hook-use-admin-banners) | Hook | [`use-admin-banners`](features-admin-settings-use-admin-banners.md) | Drives the home-banners page. |
    | [`useAdminDashboardLiteStore`](features-admin-dashboard-store.md#hook-use-admin-dashboard-lite-store) | Hook | [`store`](features-admin-dashboard-store.md) | Hook giving the dashboard page its stats, loading flag and fetch action. |
    | [`useAdminGroceryLists`](features-admin-grocery-lists-use-admin-grocery-lists.md#hook-use-admin-grocery-lists) | Hook | [`use-admin-grocery-lists`](features-admin-grocery-lists-use-admin-grocery-lists.md) | Loads, filters, prices and advances the shop's grocery lists. |
    | [`useAdminOrdersStore`](features-admin-orders-store.md#hook-use-admin-orders-store) | Hook | [`store`](features-admin-orders-store.md) | — |
    | [`useAdminProducts`](features-admin-products-use-admin-products.md#hook-use-admin-products) | Hook | [`use-admin-products`](features-admin-products-use-admin-products.md) | Loads products and categories for the products page and owns its dialog state. |
    | [`useAdminPromos`](features-admin-promo-use-admin-promo.md#hook-use-admin-promos) | Hook | [`use-admin-promo`](features-admin-promo-use-admin-promo.md) | Drives the Promos page. |
    | [`useAdminPush`](features-admin-notifications-use-admin-push.md#hook-use-admin-push) | Hook | [`use-admin-push`](features-admin-notifications-use-admin-push.md) | Manages the push permission and keeps this browser's FCM token registered. |
    | [`useAuthStore`](features-auth-store.md#hook-use-auth-store) | Hook | [`store`](features-auth-store.md) | Hook and store holding the signed-in user and the bootstrap's progress. |
    | [`useBootstrapAuth`](features-auth-use-bootstrap-auth.md#hook-use-bootstrap-auth) | Hook | [`useBootstrapAuth`](features-auth-use-bootstrap-auth.md) | Installs the API token getter and loads the signed-in user into the store. |
    | [`useProductForm`](features-admin-products-use-product-form.md#hook-use-product-form) | Hook | [`use-product-form`](features-admin-products-use-product-form.md) | Drives the product dialog: form state, image handling, validation, save and delete. |

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/docs/tools/build-reference.mjs)
