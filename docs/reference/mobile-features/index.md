# Mobile app — features and state

Per-feature API calls, Zustand stores and hooks — where the app's client-side state actually lives.

|  |  |
|---|---|
| Kind | Reference group |
| Source folder | `mobile/src/features/` |
| Files | 31 |
| Exported symbols | 97 |
| Carrying a description | 96 of 97 symbols, 31 of 31 files |

## Files

| File | Title | Purpose | Exports |
|---|---|---|---|
| [`src/features/auth/api.ts`](features-auth-api.md) | Auth api | The two endpoints that turn a Clerk session into an account on this server. | 2 |
| [`src/features/auth/store.ts`](features-auth-store.md) | useAuthStore | What this server knows about the signed-in customer, and how far startup has got. | 1 |
| [`src/features/auth/types.ts`](features-auth-types.md) | Auth types | What the two auth endpoints answer with. | 2 |
| [`src/features/auth/useBootstrapAuth.ts`](features-auth-use-bootstrap-auth.md) | useBootstrapAuth | The startup effect that connects Clerk to the rest of the app. | 1 |
| [`src/features/customer/account/api.ts`](features-customer-account-api.md) | Account api | The customer's own details, as the shop sees them. | 4 |
| [`src/features/customer/account/store.ts`](features-customer-account-store.md) | useCustomerAccountStore | The customer's saved profile, shared by every screen that shows their name. | 1 |
| [`src/features/customer/account/use-display-name.ts`](features-customer-account-use-display-name.md) | useCustomerDisplayName | What to call the customer. | 1 |
| [`src/features/customer/draft-list/quantity.ts`](features-customer-draft-list-quantity.md) | Quantity | Turning a product's unit and a chosen amount into the quantity string the shopkeeper reads. | 8 |
| [`src/features/customer/draft-list/store.ts`](features-customer-draft-list-store.md) | Draft list store | The unsent grocery list — the piece of paper the whole app writes on. | 6 |
| [`src/features/customer/draft-list/use-send-draft.ts`](features-customer-draft-list-use-send-draft.md) | useSendDraft | Sending the draft list to the shop. | 1 |
| [`src/features/customer/grocery-list/api.ts`](features-customer-grocery-list-api.md) | Grocery list api | Everything the customer does with a list once it has left the phone: sending it, reading it back, chatting about it, paying for it. | 8 |
| [`src/features/customer/grocery-list/journey-stage.ts`](features-customer-grocery-list-journey-stage.md) | JourneyStage | Where the customer is in their journey, as a single decision. | 2 |
| [`src/features/customer/grocery-list/store.ts`](features-customer-grocery-list-store.md) | useCustomerGroceryListStore | The customer's sent orders, and everything they can do to one. | 1 |
| [`src/features/customer/grocery-list/types.ts`](features-customer-grocery-list-types.md) | Grocery list types | The shapes of a sent list, its chat, and what comes back from reading a photo. | 13 |
| [`src/features/customer/grocery-list/use-list-journey.ts`](features-customer-grocery-list-use-list-journey.md) | useListJourney | The journey decision, wired to live state. | 2 |
| [`src/features/customer/grocery-sheet/store.ts`](features-customer-grocery-sheet-store.md) | useGrocerySheetStore | Whether the grocery-list sheet is showing. | 1 |
| [`src/features/customer/home/api.ts`](features-customer-home-api.md) | getCustomerHomeDateOverview | The one request the Home screen makes. | 1 |
| [`src/features/customer/home/store.ts`](features-customer-home-store.md) | useCustomerHomeStore | The Home payload, fetched once and refreshed on return. | 1 |
| [`src/features/customer/home/types.ts`](features-customer-home-types.md) | Home types | What the Home payload contains. | 6 |
| [`src/features/customer/products/api.ts`](features-customer-products-api.md) | Products api | The catalogue: categories, the product list and one product's details. | 3 |
| [`src/features/customer/products/details/store.ts`](features-customer-products-details-store.md) | useCustomerProductDetailsStore | The one product-details store, shared by a stack of product screens. | 1 |
| [`src/features/customer/products/product-list.shared.ts`](features-customer-products-product-list-shared.md) | Product list shared | Helpers and fixed option lists shared by the catalogue screens. | 7 |
| [`src/features/customer/products/types.ts`](features-customer-products-types.md) | Products types | The catalogue's shapes. | 8 |
| [`src/features/customer/products/use-customer-collections.ts`](features-customer-products-use-customer-collections.md) | useCustomerProductList | The Shop screen's data, as a hook rather than a store. | 1 |
| [`src/features/customer/push/api.ts`](features-customer-push-api.md) | Push api | Registering and un-registering this device for order alerts. | 2 |
| [`src/features/customer/push/registry.ts`](features-customer-push-registry.md) | Registry | Remembering which push token this device handed over, outside React. | 3 |
| [`src/features/customer/push/use-push-notifications.ts`](features-customer-push-use-push-notifications.md) | usePushNotifications | Registering for order alerts, and reacting to one when it arrives. | 1 |
| [`src/features/customer/quantity-sheet/store.ts`](features-customer-quantity-sheet-store.md) | Quantity sheet store | Which product the app's single quantity picker is asking about. | 2 |
| [`src/features/customer/wishlist/api.ts`](features-customer-wishlist-api.md) | Wishlist api | The customer's saved products. | 3 |
| [`src/features/customer/wishlist/store.ts`](features-customer-wishlist-store.md) | useCustomerWishlistStore | The customer's saved products. | 1 |
| [`src/features/customer/wishlist/types.ts`](features-customer-wishlist-types.md) | Wishlist types | What a saved product looks like. | 3 |

## Exported symbols

???+ info "All 97 exported symbols"

    | Symbol | Kind | Defined in | Brief |
    |---|---|---|---|
    | [`ACTIVE_STATUSES`](features-customer-grocery-list-types.md#constant-active-statuses) | Constant | [`types`](features-customer-grocery-list-types.md) | The statuses an order passes through while it is still in progress, in order. |
    | [`ActiveFilterBadge`](features-customer-products-product-list-shared.md#type-active-filter-badge) | Type | [`product-list.shared`](features-customer-products-product-list-shared.md) | One "you are filtering by this" chip. |
    | [`addCustomerWishlist`](features-customer-wishlist-api.md#function-add-customer-wishlist) | Function | [`api`](features-customer-wishlist-api.md) | `POST /customer/wishlist/items` — saves a product. |
    | [`AddCustomerWishlistItemBody`](features-customer-wishlist-types.md#type-add-customer-wishlist-item-body) | Type | [`types`](features-customer-wishlist-types.md) | What is sent to save a product. |
    | [`BannerLink`](features-customer-home-types.md#type-banner-link) | Type | [`types`](features-customer-home-types.md) | What a banner opens when tapped - chosen in the admin panel. |
    | [`BRAND_OPTIONS`](features-customer-products-product-list-shared.md#constant-brand-options) | Constant | [`product-list.shared`](features-customer-products-product-list-shared.md) | Brands the filter UI would offer. |
    | [`buildQuantityString`](features-customer-draft-list-quantity.md#function-build-quantity-string) | Function | [`quantity`](features-customer-draft-list-quantity.md) | The final string stored on the draft row / sent to the shop. |
    | [`ChatMessage`](features-customer-grocery-list-types.md#type-chat-message) | Type | [`types`](features-customer-grocery-list-types.md) | Chat: one message on an order's conversation. |
    | [`ChatMessagesResponse`](features-customer-grocery-list-types.md#type-chat-messages-response) | Type | [`types`](features-customer-grocery-list-types.md) | The body of the messages endpoint. |
    | [`countSendableRows`](features-customer-draft-list-store.md#function-count-sendable-rows) | Function | [`store`](features-customer-draft-list-store.md) | How many items the customer has written, by the one definition above. |
    | [`CustomerGroceryList`](features-customer-grocery-list-types.md#type-customer-grocery-list) | Type | [`types`](features-customer-grocery-list-types.md) | One order, as the customer sees it. |
    | [`CustomerGroceryListsResponse`](features-customer-grocery-list-types.md#type-customer-grocery-lists-response) | Type | [`types`](features-customer-grocery-list-types.md) | The body of `GET /customer/grocery-lists`. |
    | [`CustomerHomeBanner`](features-customer-home-types.md#type-customer-home-banner) | Type | [`types`](features-customer-home-types.md) | One promotional image on Home. |
    | [`CustomerHomeCategory`](features-customer-home-types.md#type-customer-home-category) | Type | [`types`](features-customer-home-types.md) | One category tile. |
    | [`CustomerHomeCoupon`](features-customer-home-types.md#type-customer-home-coupon) | Type | [`types`](features-customer-home-types.md) | A discount code the shop is advertising. |
    | [`CustomerHomeProduct`](features-customer-home-types.md#type-customer-home-product) | Type | [`types`](features-customer-home-types.md) | A product as Home shows it. |
    | [`CustomerHomeResponse`](features-customer-home-types.md#type-customer-home-response) | Type | [`types`](features-customer-home-types.md) | The body of `GET /customer/home`. |
    | [`CustomerProduct`](features-customer-products-types.md#type-customer-product) | Type | [`types`](features-customer-products-types.md) | A product, in full. |
    | [`CustomerProductDetailsResponse`](features-customer-products-types.md#type-customer-product-details-response) | Type | [`types`](features-customer-products-types.md) | The body of the product details endpoint. |
    | [`CustomerProductFilters`](features-customer-products-product-list-shared.md#type-customer-product-filters) | Type | [`product-list.shared`](features-customer-products-product-list-shared.md) | The catalogue filters as the screen holds them. |
    | [`CustomerProfile`](features-customer-account-api.md#type-customer-profile) | Type | [`api`](features-customer-account-api.md) | The customer's own details as the SHOP sees them on their orders. |
    | [`CustomerWishlistItem`](features-customer-wishlist-types.md#type-customer-wishlist-item) | Type | [`types`](features-customer-wishlist-types.md) | One saved product. |
    | [`CustomerWishlistResponse`](features-customer-wishlist-types.md#type-customer-wishlist-response) | Type | [`types`](features-customer-wishlist-types.md) | The body every wishlist endpoint answers with. |
    | [`defaultQuantityValue`](features-customer-draft-list-quantity.md#function-default-quantity-value) | Function | [`quantity`](features-customer-draft-list-quantity.md) | What the picker starts at when it opens. |
    | [`DraftRow`](features-customer-draft-list-store.md#type-draft-row) | Type | [`store`](features-customer-draft-list-store.md) | One line on the paper. |
    | [`FacetKey`](features-customer-products-product-list-shared.md#type-facet-key) | Type | [`product-list.shared`](features-customer-products-product-list-shared.md) | Which filter a value belongs to. |
    | [`getCoverImage`](features-customer-products-product-list-shared.md#function-get-cover-image) | Function | [`product-list.shared`](features-customer-products-product-list-shared.md) | The picture to show for a product. |
    | [`getCustomerCategories`](features-customer-products-api.md#function-get-customer-categories) | Function | [`api`](features-customer-products-api.md) | `GET /customer/categories` — every category the shop is showing. |
    | [`getCustomerGroceryLists`](features-customer-grocery-list-api.md#function-get-customer-grocery-lists) | Function | [`api`](features-customer-grocery-list-api.md) | `GET /customer/grocery-lists` — every list this customer has sent. |
    | [`getCustomerHomeDateOverview`](features-customer-home-api.md#function-get-customer-home-date-overview) | Function | [`api`](features-customer-home-api.md) | `GET /customer/home` — banners, categories, newest products and coupons in one payload. |
    | [`getCustomerProductDetails`](features-customer-products-api.md#function-get-customer-product-details) | Function | [`api`](features-customer-products-api.md) | `GET /customer/products/:id` — one product, with the related ones. |
    | [`getCustomerProducts`](features-customer-products-api.md#function-get-customer-products) | Function | [`api`](features-customer-products-api.md) | `GET /customer/products` — the catalogue, filtered. |
    | [`GetCustomerProductsParams`](features-customer-products-types.md#type-get-customer-products-params) | Type | [`types`](features-customer-products-types.md) | The catalogue filters. |
    | [`getCustomerProfile`](features-customer-account-api.md#function-get-customer-profile) | Function | [`api`](features-customer-account-api.md) | `GET /customer/profile` — the signed-in customer's saved details. |
    | [`getCustomerWishlist`](features-customer-wishlist-api.md#function-get-customer-wishlist) | Function | [`api`](features-customer-wishlist-api.md) | `GET /customer/wishlist` — every product the customer has saved. |
    | [`getGroceryListMessages`](features-customer-grocery-list-api.md#function-get-grocery-list-messages) | Function | [`api`](features-customer-grocery-list-api.md) | `GET /customer/grocery-lists/:id/messages` — the conversation about one order. |
    | [`getMe`](features-auth-api.md#function-get-me) | Function | [`api`](features-auth-api.md) | `GET /auth/me` — the signed-in account, read only. |
    | [`getSwatchColor`](features-customer-products-product-list-shared.md#function-get-swatch-color) | Function | [`product-list.shared`](features-customer-products-product-list-shared.md) | Turns a colour name into something that can be painted. |
    | [`GroceryListItem`](features-customer-grocery-list-types.md#type-grocery-list-item) | Type | [`types`](features-customer-grocery-list-types.md) | One line of a sent list. |
    | [`GroceryListPaymentMethod`](features-customer-grocery-list-types.md#type-grocery-list-payment-method) | Type | [`types`](features-customer-grocery-list-types.md) | How the customer said they would pay. |
    | [`GroceryListPaymentStatus`](features-customer-grocery-list-types.md#type-grocery-list-payment-status) | Type | [`types`](features-customer-grocery-list-types.md) | Whether the shop has the money. |
    | [`GroceryListStatus`](features-customer-grocery-list-types.md#type-grocery-list-status) | Type | [`types`](features-customer-grocery-list-types.md) | Every status an order can hold. |
    | [`isCountableUnit`](features-customer-draft-list-quantity.md#function-is-countable-unit) | Function | [`quantity`](features-customer-draft-list-quantity.md) | Whether this product is ordered in whole units rather than by amount. |
    | [`isSendableRow`](features-customer-draft-list-store.md#function-is-sendable-row) | Function | [`store`](features-customer-draft-list-store.md) | A line that will actually be SENT: the shop needs a name. |
    | [`JourneyStage`](features-customer-grocery-list-journey-stage.md#type-journey-stage) | Type | [`journey-stage`](features-customer-grocery-list-journey-stage.md) | Where the customer is in the write -> send -> get price -> collect journey, so the Home card can show their real progress and point at the next step. |
    | [`JourneyStage`](features-customer-grocery-list-use-list-journey.md#re-export-journey-stage) | Re-export | [`use-list-journey`](features-customer-grocery-list-use-list-journey.md) | — |
    | [`journeyStage`](features-customer-grocery-list-journey-stage.md#function-journey-stage) | Function | [`journey-stage`](features-customer-grocery-list-journey-stage.md) | Decides which single stage the Home card should show. |
    | [`markGroceryListSeen`](features-customer-grocery-list-api.md#function-mark-grocery-list-seen) | Function | [`api`](features-customer-grocery-list-api.md) | `PATCH /customer/grocery-lists/:id/seen` — clears the "new update" badge. |
    | [`MAX_PHOTOS_PER_SCAN`](features-customer-draft-list-store.md#constant-max-photos-per-scan) | Constant | [`store`](features-customer-draft-list-store.md) | How many photos may be read in one go (kept in step with the server). |
    | [`maxFor`](features-customer-draft-list-quantity.md#function-max-for) | Function | [`quantity`](features-customer-draft-list-quantity.md) | The most one line may ask for, in the product's OWN unit. |
    | [`MeResponse`](features-auth-types.md#type-me-response) | Type | [`types`](features-auth-types.md) | The body of `GET /auth/me`, once the envelope is unwrapped. |
    | [`minFor`](features-customer-draft-list-quantity.md#function-min-for) | Function | [`quantity`](features-customer-draft-list-quantity.md) | The smallest amount a line may ask for, in the product's own unit. |
    | [`payGroceryListAtShop`](features-customer-grocery-list-api.md#function-pay-grocery-list-at-shop) | Function | [`api`](features-customer-grocery-list-api.md) | `PATCH /customer/grocery-lists/:id/pay-at-shop` — says the customer will pay at the counter. |
    | [`ProductCategory`](features-customer-products-types.md#type-product-category) | Type | [`types`](features-customer-products-types.md) | One category. |
    | [`ProductImage`](features-customer-products-types.md#type-product-image) | Type | [`types`](features-customer-products-types.md) | One picture of a product. |
    | [`ProductSize`](features-customer-products-types.md#type-product-size) | Type | [`types`](features-customer-products-types.md) | Clothing sizes. |
    | [`ProductSort`](features-customer-products-types.md#type-product-sort) | Type | [`types`](features-customer-products-types.md) | The orders the catalogue can be sorted in. |
    | [`ProductUnit`](features-customer-products-types.md#type-product-unit) | Type | [`types`](features-customer-products-types.md) | How a product is sold. |
    | [`QuantityTarget`](features-customer-quantity-sheet-store.md#type-quantity-target) | Type | [`store`](features-customer-quantity-sheet-store.md) | The product the picker is open for. |
    | [`quickChips`](features-customer-draft-list-quantity.md#function-quick-chips) | Function | [`quantity`](features-customer-draft-list-quantity.md) | Quick-tap presets, expressed in the product's own unit so the resulting quantity string stays unambiguous. |
    | [`readListPhotos`](features-customer-grocery-list-api.md#function-read-list-photos) | Function | [`api`](features-customer-grocery-list-api.md) | `POST /customer/grocery-lists/read-photo` — multipart, 60 s. |
    | [`ReadPhotoResponse`](features-customer-grocery-list-types.md#type-read-photo-response) | Type | [`types`](features-customer-grocery-list-types.md) | The body of the read-photo endpoint. |
    | [`registeredPushToken`](features-customer-push-registry.md#function-registered-push-token) | Function | [`registry`](features-customer-push-registry.md) | The token this device is registered under, or `null`. |
    | [`releasePushToken`](features-customer-push-registry.md#function-release-push-token) | Function | [`registry`](features-customer-push-registry.md) | Hands the device's token back to the server and forgets it. |
    | [`rememberPushToken`](features-customer-push-registry.md#function-remember-push-token) | Function | [`registry`](features-customer-push-registry.md) | Records that this device is registered under `token`. |
    | [`removeCustomerWishlistItem`](features-customer-wishlist-api.md#function-remove-customer-wishlist-item) | Function | [`api`](features-customer-wishlist-api.md) | `DELETE /customer/wishlist/items/:productId` — un-saves a product. |
    | [`removeGroceryListItem`](features-customer-grocery-list-api.md#function-remove-grocery-list-item) | Function | [`api`](features-customer-grocery-list-api.md) | `PATCH /customer/grocery-lists/:id/remove-item` — drops one line from a list already sent. |
    | [`removePushToken`](features-customer-push-api.md#function-remove-push-token) | Function | [`api`](features-customer-push-api.md) | `DELETE /customer/push-token` — stops this device getting the signed-in customer's alerts. |
    | [`roundValue`](features-customer-draft-list-quantity.md#function-round-value) | Function | [`quantity`](features-customer-draft-list-quantity.md) | Rounds to two decimal places. |
    | [`savePushToken`](features-customer-push-api.md#function-save-push-token) | Function | [`api`](features-customer-push-api.md) | `POST /customer/push-token` — sends this device's Expo token to the server. |
    | [`ScannedItem`](features-customer-grocery-list-types.md#type-scanned-item) | Type | [`types`](features-customer-grocery-list-types.md) | One item read off a photo of a handwritten list. |
    | [`ScannedLine`](features-customer-draft-list-store.md#type-scanned-line) | Type | [`store`](features-customer-draft-list-store.md) | One line read off a photo of the customer's handwritten list. |
    | [`sendGroceryListMessage`](features-customer-grocery-list-api.md#function-send-grocery-list-message) | Function | [`api`](features-customer-grocery-list-api.md) | `POST /customer/grocery-lists/:id/messages` — says something to the shop about one order. |
    | [`ShopUpi`](features-customer-grocery-list-types.md#type-shop-upi) | Type | [`types`](features-customer-grocery-list-types.md) | Where a UPI payment goes. |
    | [`SIZE_OPTIONS`](features-customer-products-product-list-shared.md#constant-size-options) | Constant | [`product-list.shared`](features-customer-products-product-list-shared.md) | Sizes the filter UI would offer. |
    | [`stepFor`](features-customer-draft-list-quantity.md#function-step-for) | Function | [`quantity`](features-customer-draft-list-quantity.md) | How much one tap of + or − moves the amount. |
    | [`submitGroceryList`](features-customer-grocery-list-api.md#function-submit-grocery-list) | Function | [`api`](features-customer-grocery-list-api.md) | `POST /customer/grocery-lists` — sends the list to the shop. |
    | [`SubmitGroceryListBody`](features-customer-grocery-list-types.md#type-submit-grocery-list-body) | Type | [`types`](features-customer-grocery-list-types.md) | What is sent to the shop. |
    | [`SyncResponse`](features-auth-types.md#type-sync-response) | Type | [`types`](features-auth-types.md) | The body of `POST /auth/sync`, once the envelope is unwrapped. |
    | [`syncUser`](features-auth-api.md#function-sync-user) | Function | [`api`](features-auth-api.md) | `POST /auth/sync` — creates this server's record for the signed-in Clerk user, or updates it. |
    | [`updateCustomerProfile`](features-customer-account-api.md#function-update-customer-profile) | Function | [`api`](features-customer-account-api.md) | `PATCH /customer/profile` — saves an edit. |
    | [`UpdateCustomerProfileBody`](features-customer-account-api.md#type-update-customer-profile-body) | Type | [`api`](features-customer-account-api.md) | A partial profile edit. |
    | [`useAuthStore`](features-auth-store.md#hook-use-auth-store) | Hook | [`store`](features-auth-store.md) | Holds the signed-in customer's server-side account. |
    | [`useBootstrapAuth`](features-auth-use-bootstrap-auth.md#hook-use-bootstrap-auth) | Hook | [`useBootstrapAuth`](features-auth-use-bootstrap-auth.md) | Wires Clerk's token into the api client, then loads the customer's account. |
    | [`useCustomerAccountStore`](features-customer-account-store.md#hook-use-customer-account-store) | Hook | [`store`](features-customer-account-store.md) | Holds the customer's saved profile, or `null` when it has not been loaded. |
    | [`useCustomerDisplayName`](features-customer-account-use-display-name.md#hook-use-customer-display-name) | Hook | [`use-display-name`](features-customer-account-use-display-name.md) | The one rule for what to call the customer, shared by every screen that shows their name or initial so they can never disagree: the saved profile name (what the shop sees), then the sign-in name, then a generic label. |
    | [`useCustomerGroceryListStore`](features-customer-grocery-list-store.md#hook-use-customer-grocery-list-store) | Hook | [`store`](features-customer-grocery-list-store.md) | Holds every list the customer has sent, plus what is needed to act on one. |
    | [`useCustomerHomeStore`](features-customer-home-store.md#hook-use-customer-home-store) | Hook | [`store`](features-customer-home-store.md) | Holds the Home payload and whether a first load is still running. |
    | [`useCustomerProductDetailsStore`](features-customer-products-details-store.md#hook-use-customer-product-details-store) | Hook | [`store`](features-customer-products-details-store.md) | Holds the product currently being looked at, and the gallery, colour and size the customer has chosen on it. |
    | [`useCustomerProductList`](features-customer-products-use-customer-collections.md#hook-use-customer-product-list) | Hook | [`use-customer-collections`](features-customer-products-use-customer-collections.md) | Loads the categories once, and the products whenever the filters, sort or search change. |
    | [`useCustomerWishlistStore`](features-customer-wishlist-store.md#hook-use-customer-wishlist-store) | Hook | [`store`](features-customer-wishlist-store.md) | Holds the saved products, and whether the wishlist sheet is showing. |
    | [`useDraftListStore`](features-customer-draft-list-store.md#hook-use-draft-list-store) | Hook | [`store`](features-customer-draft-list-store.md) | Holds the unsent list: the rows, whether they have been read back from disk, and the counter that hands out row ids. |
    | [`useGrocerySheetStore`](features-customer-grocery-sheet-store.md#hook-use-grocery-sheet-store) | Hook | [`store`](features-customer-grocery-sheet-store.md) | Holds one boolean: is the list sheet open. |
    | [`useListJourney`](features-customer-grocery-list-use-list-journey.md#hook-use-list-journey) | Hook | [`use-list-journey`](features-customer-grocery-list-use-list-journey.md) | The customer's current journey stage, live from the draft and their orders. |
    | [`usePushNotifications`](features-customer-push-use-push-notifications.md#hook-use-push-notifications) | Hook | [`use-push-notifications`](features-customer-push-use-push-notifications.md) | Registers this device for push once the customer signs in, and refreshes their lists whenever a notification arrives. |
    | [`useQuantitySheetStore`](features-customer-quantity-sheet-store.md#hook-use-quantity-sheet-store) | Hook | [`store`](features-customer-quantity-sheet-store.md) | Holds the product the root quantity picker is asking about, or `null` when it is closed. |
    | [`useSendDraft`](features-customer-draft-list-use-send-draft.md#hook-use-send-draft) | Hook | [`use-send-draft`](features-customer-draft-list-use-send-draft.md) | The one send flow, and the state the Send button needs to draw itself. |

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/docs/tools/build-reference.mjs)
