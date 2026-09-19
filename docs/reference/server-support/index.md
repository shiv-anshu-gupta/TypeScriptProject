# Server — utilities and middleware

The pieces every route leans on: the error type, the response envelope, the middleware chain, the database connection and the small helpers.

|  |  |
|---|---|
| Kind | Reference group |
| Source folder | `server/src/` |
| Files | 18 |
| Exported symbols | 36 |
| Carrying a description | 36 of 36 symbols, 18 of 18 files |

## Files

| File | Title | Purpose | Exports |
|---|---|---|---|
| [`src/db.ts`](db.md) | connectDB | The process's single MongoDB connection. | 1 |
| [`src/middleware/auth.ts`](middleware-auth.md) | Auth | Who is making this request, and are they allowed to. | 3 |
| [`src/middleware/errorhandler.ts`](middleware-errorhandler.md) | errorHandler | The one place a failed request becomes a response. | 1 |
| [`src/middleware/notFound.ts`](middleware-not-found.md) | notFound | The catch-all for a path no router claimed. | 1 |
| [`src/server.ts`](server.md) | Server | The server entry point: connects to MongoDB, builds the Express app, mounts every router and starts listening. | 0 |
| [`src/utils/AppError.ts`](utils-app-error.md) | AppError | The error type used whenever a failure has a status the caller should see. | 1 |
| [`src/utils/asyncHandler.ts`](utils-async-handler.md) | asyncHandler | Adapter that lets async route handlers throw. | 1 |
| [`src/utils/cloudinary.ts`](utils-cloudinary.md) | Cloudinary | Every picture in the shop: getting it into Cloudinary, asking for it back at the size it will be drawn, and deleting it when the admin removes it. | 5 |
| [`src/utils/envelope.ts`](utils-envelope.md) | Envelope | The single JSON shape every endpoint answers with. | 3 |
| [`src/utils/helpers.ts`](utils-helpers.md) | Helpers | Small guards that turn a missing or unusable value into an [`AppError`](utils-app-error.md#class-app-error), so a route can validate in one line and let the error middleware answer. | 3 |
| [`src/utils/phone.ts`](utils-phone.md) | normalizeMobile | One way of writing a customer's mobile number. | 1 |
| [`src/utils/productImages.ts`](utils-product-images.md) | sizedProduct | Shaping a product for the wire, so its pictures arrive at the size they are drawn at. | 1 |
| [`src/utils/push.ts`](utils-push.md) | Push | Push notifications to the customer's phone, through Expo. | 2 |
| [`src/utils/razorpay.ts`](utils-razorpay.md) | razorpay | The shared Razorpay client and the unit conversion its API expects. | 2 |
| [`src/utils/regex.ts`](utils-regex.md) | escapeRegex | Escaping for text that will be used as a pattern. | 1 |
| [`src/utils/sanitizeItem.ts`](utils-sanitize-item.md) | Sanitize Item | The last line of defence for anything typed into a grocery list. | 8 |
| [`src/utils/telegram.ts`](utils-telegram.md) | sendTelegram | The shopkeeper's out-of-band order alert. | 1 |
| [`src/utils/webPush.ts`](utils-web-push.md) | notifyAdmins | Web push to the admin's browser, through Firebase Cloud Messaging. | 1 |

## Exported symbols

???+ info "All 36 exported symbols"

    | Symbol | Kind | Defined in | Brief |
    |---|---|---|---|
    | [`ApiEnvelope`](utils-envelope.md#type-api-envelope) | Type | [`envelope`](utils-envelope.md) | The response body shared by every endpoint, whether it succeeded or not. |
    | [`AppError`](utils-app-error.md#class-app-error) | Class | [`AppError`](utils-app-error.md) | An error that carries the HTTP status to answer with. |
    | [`asyncHandler`](utils-async-handler.md#function-async-handler) | Function | [`asyncHandler`](utils-async-handler.md) | Wraps an async route handler so that a rejected promise reaches `next()`. |
    | [`cdnImage`](utils-cloudinary.md#function-cdn-image) | Function | [`cloudinary`](utils-cloudinary.md) | Rewrites a stored Cloudinary URL to ask for the picture at the size it will be drawn. |
    | [`cleanField`](utils-sanitize-item.md#function-clean-field) | Function | [`sanitizeItem`](utils-sanitize-item.md) | Coerce ANY value to a safe, bounded plain string. |
    | [`cleanItems`](utils-sanitize-item.md#function-clean-items) | Function | [`sanitizeItem`](utils-sanitize-item.md) | Clean + bound a whole incoming items array. |
    | [`connectDB`](db.md#function-connect-db) | Function | [`db`](db.md) | Opens the shared Mongoose connection and waits for it. |
    | [`deleteFromCloudinary`](utils-cloudinary.md#function-delete-from-cloudinary) | Function | [`cloudinary`](utils-cloudinary.md) | Best-effort removal of images the admin deleted. |
    | [`errorHandler`](middleware-errorhandler.md#function-error-handler) | Function | [`errorhandler`](middleware-errorhandler.md) | Express error middleware: turns anything thrown into an error envelope. |
    | [`escapeRegex`](utils-regex.md#function-escape-regex) | Function | [`regex`](utils-regex.md) | Make user-typed text safe to use inside a MongoDB `$regex`. |
    | [`fail`](utils-envelope.md#function-fail) | Function | [`envelope`](utils-envelope.md) | Builds a failure envelope. |
    | [`getDbUserFromReq`](middleware-auth.md#function-get-db-user-from-req) | Function | [`auth`](middleware-auth.md) | The app's own user record for whoever is making this request. |
    | [`ImageVariant`](utils-cloudinary.md#type-image-variant) | Type | [`cloudinary`](utils-cloudinary.md) | The name of a delivery size: `thumb`, `card`, `detail` or `banner`. |
    | [`MAX_ITEMS_PER_LIST`](utils-sanitize-item.md#constant-max-items-per-list) | Constant | [`sanitizeItem`](utils-sanitize-item.md) | Most items a single list may hold in total. |
    | [`MAX_ITEMS_PER_SUBMIT`](utils-sanitize-item.md#constant-max-items-per-submit) | Constant | [`sanitizeItem`](utils-sanitize-item.md) | Most items accepted in one send. |
    | [`MAX_NAME_LEN`](utils-sanitize-item.md#constant-max-name-len) | Constant | [`sanitizeItem`](utils-sanitize-item.md) | Longest an item name may be, in characters. |
    | [`MAX_NOTE_LEN`](utils-sanitize-item.md#constant-max-note-len) | Constant | [`sanitizeItem`](utils-sanitize-item.md) | Longest the free-text note on a list may be, in characters. |
    | [`MAX_QTY_LEN`](utils-sanitize-item.md#constant-max-qty-len) | Constant | [`sanitizeItem`](utils-sanitize-item.md) | Longest a quantity may be, in characters. |
    | [`MIN_NAME_LEN`](utils-sanitize-item.md#constant-min-name-len) | Constant | [`sanitizeItem`](utils-sanitize-item.md) | Shortest an item name may be. |
    | [`normalizeMobile`](utils-phone.md#function-normalize-mobile) | Function | [`phone`](utils-phone.md) | Normalise an Indian mobile number to 10 digits (strips +91 / leading 0 / spaces). |
    | [`notFound`](middleware-not-found.md#function-not-found) | Function | [`notFound`](middleware-not-found.md) | Answers 404 in the standard error envelope. |
    | [`notifyAdmins`](utils-web-push.md#function-notify-admins) | Function | [`webPush`](utils-web-push.md) | Notify every admin's browser of something (e.g. a new order). |
    | [`notifyUser`](utils-push.md#function-notify-user) | Function | [`push`](utils-push.md) | Look up a user's devices and push to all of them. |
    | [`ok`](utils-envelope.md#function-ok) | Function | [`envelope`](utils-envelope.md) | Builds a success envelope. |
    | [`razorpay`](utils-razorpay.md#constant-razorpay) | Constant | [`razorpay`](utils-razorpay.md) | The process-wide Razorpay client, used to create and verify payment orders. |
    | [`requireAdmin`](middleware-auth.md#function-require-admin) | Function | [`auth`](middleware-auth.md) | Gate that lets a request through only if the caller is an admin. |
    | [`requireAuth`](middleware-auth.md#function-require-auth) | Function | [`auth`](middleware-auth.md) | Gate that lets a request through only if somebody is signed in. |
    | [`requireFound`](utils-helpers.md#function-require-found) | Function | [`helpers`](utils-helpers.md) | Turns a lookup that may have found nothing into a value or a 404. |
    | [`requireNumber`](utils-helpers.md#function-require-number) | Function | [`helpers`](utils-helpers.md) | Rejects a value that is already the `NaN` number. |
    | [`requireText`](utils-helpers.md#function-require-text) | Function | [`helpers`](utils-helpers.md) | Rejects a value that is empty once coerced to a trimmed string. |
    | [`sendPushNotifications`](utils-push.md#function-send-push-notifications) | Function | [`push`](utils-push.md) | Sends an Expo push notification to a set of device tokens. |
    | [`sendTelegram`](utils-telegram.md#function-send-telegram) | Function | [`telegram`](utils-telegram.md) | Telegram push for the shopkeeper — a free, reliable "new order" alert that reaches their phone even when the admin laptop is closed. |
    | [`sizedProduct`](utils-product-images.md#function-sized-product) | Function | [`productImages`](utils-product-images.md) | A product on its way out of the server, with its pictures asked for at the size they will actually be drawn - small in a grid, larger on the product's own page. |
    | [`toSubUnits`](utils-razorpay.md#function-to-sub-units) | Function | [`razorpay`](utils-razorpay.md) | Converts rupees to the paise that Razorpay's API takes. |
    | [`uploadManyBuffersToCloudinary`](utils-cloudinary.md#function-upload-many-buffers-to-cloudinary) | Function | [`cloudinary`](utils-cloudinary.md) | Uploads several image buffers at once, keeping their order. |
    | [`uploadSingleBufferToCloudinary`](utils-cloudinary.md#function-upload-single-buffer-to-cloudinary) | Function | [`cloudinary`](utils-cloudinary.md) | Uploads one image buffer to Cloudinary and returns where it landed. |

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/docs/tools/build-reference.mjs)
