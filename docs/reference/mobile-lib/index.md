# Mobile app — library

Cross-cutting helpers: the HTTP client, translations, push registration, toasts, formatting and the shared types.

|  |  |
|---|---|
| Kind | Reference group |
| Source folder | `mobile/src/lib/` |
| Files | 16 |
| Exported symbols | 37 |
| Carrying a description | 36 of 37 symbols, 16 of 16 files |

## Files

| File | Title | Purpose | Exports |
|---|---|---|---|
| [`src/lib/api.ts`](lib-api.md) | Api | The app's one HTTP client: a single axios instance, a single `request()` helper, and four verb wrappers over it. | 5 |
| [`src/lib/clean-text.ts`](lib-clean-text.md) | stripSpecials | The app's one rule for which characters a customer may type into a field the shop will read. | 1 |
| [`src/lib/clerk-session.ts`](lib-clerk-session.md) | Clerk session | The end of every login, in one place: what to do about a Clerk session that exists but is not usable. | 2 |
| [`src/lib/env.ts`](lib-env.md) | env | The build-time configuration the app reads, with its defaults. | 1 |
| [`src/lib/i18n/en.ts`](lib-i18n-en.md) | en | The English half of the app's strings, and the key list every other language is checked against. | 2 |
| [`src/lib/i18n/hi.ts`](lib-i18n-hi.md) | hi | The Hindi half of the app's strings. | 1 |
| [`src/lib/i18n/index.ts`](lib-i18n-index.md) | I18n index | i18next, configured for this app, plus the two helpers that make the customer's choice of language survive a restart. | 5 |
| [`src/lib/phone.ts`](lib-phone.md) | Phone | What counts as a valid Indian mobile number, for the whole app. | 2 |
| [`src/lib/push.ts`](lib-push.md) | Push | Getting this device an Expo push token, and deciding how a notification behaves when it arrives. | 2 |
| [`src/lib/toast.ts`](lib-toast.md) | toast | The app's transient messages: a tiny store the `Toaster` renders, plus a `toast` object callable from anywhere. | 4 |
| [`src/lib/token-cache.ts`](lib-token-cache.md) | tokenCache | Where Clerk keeps its session token on this device. | 1 |
| [`src/lib/types.ts`](lib-types.md) | Types | The shapes shared by every feature: the signed-in user and the envelope every endpoint answers in. | 4 |
| [`src/lib/upi.ts`](lib-upi.md) | Upi | Paying the shop over UPI, with no gateway and no SDK: build a deep link and hand it to whichever UPI app the customer has. | 2 |
| [`src/lib/use-keyboard-height.ts`](lib-use-keyboard-height.md) | useKeyboardHeight | How much of the screen the on-screen keyboard is covering. | 1 |
| [`src/lib/use-warm-up-browser.ts`](lib-use-warm-up-browser.md) | useWarmUpBrowser | A head start for the in-app browser the OAuth login opens. | 1 |
| [`src/lib/utils.ts`](lib-utils.md) | Utils | Small formatting and class-name helpers with no home of their own. | 3 |

## Exported symbols

???+ info "All 37 exported symbols"

    | Symbol | Kind | Defined in | Brief |
    |---|---|---|---|
    | [`apiDelete`](lib-api.md#function-api-delete) | Function | [`api`](lib-api.md) | DELETE, unwrapped. |
    | [`ApiEnvelope`](lib-types.md#type-api-envelope) | Type | [`types`](lib-types.md) | The wrapper every endpoint answers in. |
    | [`ApiErrorItem`](lib-types.md#type-api-error-item) | Type | [`types`](lib-types.md) | One entry in an error envelope's `errors`. |
    | [`apiGet`](lib-api.md#function-api-get) | Function | [`api`](lib-api.md) | GET, unwrapped. |
    | [`apiPatch`](lib-api.md#function-api-patch) | Function | [`api`](lib-api.md) | PATCH, unwrapped. |
    | [`apiPost`](lib-api.md#function-api-post) | Function | [`api`](lib-api.md) | POST, unwrapped. |
    | [`AppLanguage`](lib-i18n-index.md#type-app-language) | Type | [`index`](lib-i18n-index.md) | The languages the app ships with. |
    | [`AppUser`](lib-types.md#type-app-user) | Type | [`types`](lib-types.md) | The account as the server knows it, returned by `/auth/sync` and `/auth/me`. |
    | [`buildUpiUrl`](lib-upi.md#function-build-upi-url) | Function | [`upi`](lib-upi.md) | Builds a standard UPI deep link. |
    | [`clerkErrorCode`](lib-clerk-session.md#function-clerk-error-code) | Function | [`clerk-session`](lib-clerk-session.md) | Digs Clerk's machine-readable failure code out of a thrown value. |
    | [`cn`](lib-utils.md#function-cn) | Function | [`utils`](lib-utils.md) | Joins NativeWind class names, with later Tailwind classes winning. |
    | [`en`](lib-i18n-en.md#constant-en) | Constant | [`en`](lib-i18n-en.md) | Every string the app can show, in English. |
    | [`env`](lib-env.md#constant-env) | Constant | [`env`](lib-env.md) | Backend base URL, Clerk key and the optional shop WhatsApp number. |
    | [`formatPack`](lib-utils.md#function-format-pack) | Function | [`utils`](lib-utils.md) | A product's pack label: a 10 kg bag shows "10 kg", a loose/single item just shows its unit ("kg", "piece"). |
    | [`formatPrice`](lib-utils.md#function-format-price) | Function | [`utils`](lib-utils.md) | Formats an amount as Indian rupees, whole rupees only. |
    | [`getStoredLanguage`](lib-i18n-index.md#function-get-stored-language) | Function | [`index`](lib-i18n-index.md) | Reads back the customer's saved choice. |
    | [`hi`](lib-i18n-hi.md#constant-hi) | Constant | [`hi`](lib-i18n-hi.md) | Every string the app can show, in Hindi. |
    | [`i18n`](lib-i18n-index.md#re-export-i18n) | Re-export | [`index`](lib-i18n-index.md) | — |
    | [`isValidMobile`](lib-phone.md#function-is-valid-mobile) | Function | [`phone`](lib-phone.md) | Whether a typed number is one the server will accept. |
    | [`LANGUAGE_KEY`](lib-i18n-index.md#constant-language-key) | Constant | [`index`](lib-i18n-index.md) | AsyncStorage key holding the customer's chosen language. |
    | [`normalizeMobile`](lib-phone.md#function-normalize-mobile) | Function | [`phone`](lib-phone.md) | Reduces a typed number to the bare 10 digits the shop stores. |
    | [`openUpiPayment`](lib-upi.md#function-open-upi-payment) | Function | [`upi`](lib-upi.md) | Hands the deep link to the operating system. |
    | [`PushRegistration`](lib-push.md#type-push-registration) | Type | [`push`](lib-push.md) | The outcome of asking this device for a push token. |
    | [`registerForPushNotificationsAsync`](lib-push.md#function-register-for-push-notifications-async) | Function | [`push`](lib-push.md) | Asks for permission and returns this device's Expo push token. |
    | [`setApiTokenGetter`](lib-api.md#function-set-api-token-getter) | Function | [`api`](lib-api.md) | Installs the function the request interceptor asks for a bearer token. |
    | [`setAppLanguage`](lib-i18n-index.md#function-set-app-language) | Function | [`index`](lib-i18n-index.md) | Switches the app's language and remembers the choice. |
    | [`stripSpecials`](lib-clean-text.md#function-strip-specials) | Function | [`clean-text`](lib-clean-text.md) | Removes the blocked characters from typed text. |
    | [`toast`](lib-toast.md#constant-toast) | Constant | [`toast`](lib-toast.md) | Shows a message from anywhere, React or not. |
    | [`ToastItem`](lib-toast.md#type-toast-item) | Type | [`toast`](lib-toast.md) | One message currently on screen. |
    | [`ToastVariant`](lib-toast.md#type-toast-variant) | Type | [`toast`](lib-toast.md) | Which of the three pill styles a message is drawn in. |
    | [`tokenCache`](lib-token-cache.md#constant-token-cache) | Constant | [`token-cache`](lib-token-cache.md) | Clerk token cache backed by Expo SecureStore so the session persists securely across app restarts. |
    | [`Translations`](lib-i18n-en.md#type-translations) | Type | [`en`](lib-i18n-en.md) | The shape every other language must have. |
    | [`useKeyboardHeight`](lib-use-keyboard-height.md#hook-use-keyboard-height) | Hook | [`use-keyboard-height`](lib-use-keyboard-height.md) | The on-screen keyboard's height, or 0 while it's closed. |
    | [`UserRole`](lib-types.md#type-user-role) | Type | [`types`](lib-types.md) | What the server allows this account to do. |
    | [`useSessionGuard`](lib-clerk-session.md#hook-use-session-guard) | Hook | [`clerk-session`](lib-clerk-session.md) | Guards the end of every login against a "pending" session. |
    | [`useToastStore`](lib-toast.md#hook-use-toast-store) | Hook | [`toast`](lib-toast.md) | Holds the messages currently on screen. |
    | [`useWarmUpBrowser`](lib-use-warm-up-browser.md#hook-use-warm-up-browser) | Hook | [`use-warm-up-browser`](lib-use-warm-up-browser.md) | Warming up the browser on Android makes the OAuth sheet open noticeably faster; it's a no-op on iOS. |

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/docs/tools/build-reference.mjs)
