# Admin panel — library

Cross-cutting helpers: the HTTP client, Firebase messaging, image compression, translation and the shared types.

|  |  |
|---|---|
| Kind | Reference group |
| Source folder | `client/src/lib/` |
| Files | 11 |
| Exported symbols | 31 |
| Carrying a description | 29 of 31 symbols, 10 of 11 files |

## Files

| File | Title | Purpose | Exports |
|---|---|---|---|
| [`src/lib/api.ts`](lib-api.md) | Api | The app's only HTTP client: one axios instance, Clerk bearer tokens, and envelope unwrapping. | 6 |
| [`src/lib/clerk-appearance.ts`](lib-clerk-appearance.md) | clerkAppearance | The sKirana theme applied to every Clerk screen. | 1 |
| [`src/lib/env.ts`](lib-env.md) | env | Build-time configuration read from Vite environment variables. | 1 |
| [`src/lib/firebase.ts`](lib-firebase.md) | Firebase | Firebase Cloud Messaging setup for browser push to the shopkeeper. | 4 |
| [`src/lib/image.ts`](lib-image.md) | Image | Shrinks pictures in the browser before they are uploaded. | 4 |
| [`src/lib/order-alert.ts`](lib-order-alert.md) | notifyNewOrders | The in-page "a new list has arrived" alert: a chime, a flashing tab title and a toast. | 1 |
| [`src/lib/share-list.ts`](lib-share-list.md) | shareList | Turns a priced grocery list into a message the shop can send the customer. | 2 |
| [`src/lib/translate.ts`](lib-translate.md) | Translate | Translates customer item names between Hindi and English, best-effort. | 3 |
| [`src/lib/types.ts`](lib-types.md) | Types | Types shared across features: the user and the server's response envelope. | 4 |
| [`src/lib/utils.ts`](lib-utils.md) | Utils | Two small helpers used throughout the app. | 2 |
| [`src/types/razorpay.d.ts`](types-razorpay.md) | Razorpay | — | 3 |

## Exported symbols

???+ info "All 31 exported symbols"

    | Symbol | Kind | Defined in | Brief |
    |---|---|---|---|
    | [`apiDelete`](lib-api.md#function-api-delete) | Function | [`api`](lib-api.md) | DELETE a URL and return the unwrapped payload. |
    | [`ApiEnvelope`](lib-types.md#type-api-envelope) | Type | [`types`](lib-types.md) | The wrapper every server response arrives in. |
    | [`ApiErrorItem`](lib-types.md#type-api-error-item) | Type | [`types`](lib-types.md) | One failure reported by the server. |
    | [`apiGet`](lib-api.md#function-api-get) | Function | [`api`](lib-api.md) | GET a URL and return the unwrapped payload. |
    | [`apiPatch`](lib-api.md#function-api-patch) | Function | [`api`](lib-api.md) | PATCH a body and return the unwrapped payload. |
    | [`apiPost`](lib-api.md#function-api-post) | Function | [`api`](lib-api.md) | POST a body and return the unwrapped payload. |
    | [`apiPut`](lib-api.md#function-api-put) | Function | [`api`](lib-api.md) | PUT a body and return the unwrapped payload. |
    | [`AppUser`](lib-types.md#type-app-user) | Type | [`types`](lib-types.md) | The signed-in account as this app sees it. |
    | [`buildListShareText`](lib-share-list.md#function-build-list-share-text) | Function | [`share-list`](lib-share-list.md) | Formats an order as plain text: header, customer line, numbered items, total. |
    | [`clerkAppearance`](lib-clerk-appearance.md#constant-clerk-appearance) | Constant | [`clerk-appearance`](lib-clerk-appearance.md) | Appearance object passed to `ClerkProvider` in `main.tsx`. |
    | [`cn`](lib-utils.md#function-cn) | Function | [`utils`](lib-utils.md) | Joins class names and resolves conflicting Tailwind utilities. |
    | [`compressImage`](lib-image.md#function-compress-image) | Function | [`image`](lib-image.md) | Scales an image down to fit a maximum dimension and re-encodes it as JPEG. |
    | [`compressImages`](lib-image.md#function-compress-images) | Function | [`image`](lib-image.md) | Compresses several files at once. |
    | [`env`](lib-env.md#constant-env) | Constant | [`env`](lib-env.md) | Where the API lives. |
    | [`formatBytes`](lib-image.md#function-format-bytes) | Function | [`image`](lib-image.md) | Renders a byte count for an error message. |
    | [`formatPrice`](lib-utils.md#function-format-price) | Function | [`utils`](lib-utils.md) | Formats a number as Indian rupees with no paise. |
    | [`isPushConfigured`](lib-firebase.md#function-is-push-configured) | Function | [`firebase`](lib-firebase.md) | Whether all the Firebase values needed for push are present in this build. |
    | [`MAX_IMAGE_BYTES`](lib-image.md#constant-max-image-bytes) | Constant | [`image`](lib-image.md) | The hard per-file ceiling, 1 MB, applied after compression. |
    | [`notifyNewOrders`](lib-order-alert.md#function-notify-new-orders) | Function | [`order-alert`](lib-order-alert.md) | Announces newly arrived grocery lists to the shopkeeper. |
    | [`onForegroundMessage`](lib-firebase.md#function-on-foreground-message) | Function | [`firebase`](lib-firebase.md) | Subscribes to push messages that arrive while the tab is focused. |
    | [`pushPermission`](lib-firebase.md#function-push-permission) | Function | [`firebase`](lib-firebase.md) | Reports the browser's current notification permission. |
    | [`RazorpayOptions`](types-razorpay.md#interface-razorpay-options) | Interface | [`razorpay`](types-razorpay.md) | — |
    | [`RazorpaySuccessResponse`](types-razorpay.md#interface-razorpay-success-response) | Interface | [`razorpay`](types-razorpay.md) | — |
    | [`requestAdminPushToken`](lib-firebase.md#function-request-admin-push-token) | Function | [`firebase`](lib-firebase.md) | Registers the service worker, asks for permission, and returns an FCM token. |
    | [`setApiTokenGetter`](lib-api.md#function-set-api-token-getter) | Function | [`api`](lib-api.md) | Registers the function that supplies a bearer token for each request. |
    | [`shareList`](lib-share-list.md#function-share-list) | Function | [`share-list`](lib-share-list.md) | Opens the device share sheet for an order, falling back to WhatsApp. |
    | [`translateItems`](lib-translate.md#function-translate-items) | Function | [`translate`](lib-translate.md) | Translates a whole list of item names at once. |
    | [`TranslateTarget`](lib-translate.md#type-translate-target) | Type | [`translate`](lib-translate.md) | The language to translate into. |
    | [`translateText`](lib-translate.md#function-translate-text) | Function | [`translate`](lib-translate.md) | Translates one piece of text, returning the original if anything goes wrong. |
    | [`UserRole`](lib-types.md#type-user-role) | Type | [`types`](lib-types.md) | The two roles the server issues. |
    | [`Window`](types-razorpay.md#interface-window) | Interface | [`razorpay`](types-razorpay.md) | The **`Window`** interface represents a window containing a DOM document; the `document` property points to the DOM document loaded in that window. |

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/docs/tools/build-reference.mjs)
