# Firebase `firebase`

Firebase Cloud Messaging setup for browser push to the shopkeeper.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `client/src/lib/firebase.ts` |
| Group | [Admin panel — library](index.md) |
| Exports | 4 |

## Description

Covers the case the in-page alert cannot: the admin tab is closed or in the
background when a customer sends a list. Foreground messages become toasts;
background ones are handled by `public/firebase-messaging-sw.js` and become
OS notifications that focus or open `/admin/grocery-lists`.

Note the asymmetry with the mobile side: admin push is FCM, while push to
**customers** goes through Expo from the server. They share no code.

Everything here fails silently by design. If any of the six `VITE_FIREBASE_*`
variables is missing, [`isPushConfigured`](#function-is-push-configured) is false, the bell in the
admin header renders nothing at all, and there is no message anywhere saying
push is unconfigured. `client/.env` defines only the backend URL and the
Clerk key, so browser push does not work in local development unless you add
the Firebase names yourself.

Being `VITE_` values, they are baked into the bundle at build time — changing
them in Vercel requires a redeploy.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`isPushConfigured`](#function-is-push-configured) | Function | `function isPushConfigured(): boolean` | Whether all the Firebase values needed for push are present in this build. |
| [`onForegroundMessage`](#function-on-foreground-message) | Function | `function onForegroundMessage(cb: (payload: MessagePayload) => void): Promise<() => void>` | Subscribes to push messages that arrive while the tab is focused. |
| [`pushPermission`](#function-push-permission) | Function | `function pushPermission(): NotificationPermission \| "unsupported"` | Reports the browser's current notification permission. |
| [`requestAdminPushToken`](#function-request-admin-push-token) | Function | `function requestAdminPushToken(): Promise<string \| null>` | Registers the service worker, asks for permission, and returns an FCM token. |

## Exports in detail

### `isPushConfigured` {#function-is-push-configured}

*Function*

Whether all the Firebase values needed for push are present in this build.

```ts
function isPushConfigured(): boolean
```

**Returns** `boolean` &mdash; `true` when push can be attempted.

Checks five of the six: `authDomain` is not tested, so a build missing only
that value reports as configured and then fails later.

A false result is the reason the notification bell disappears from the admin
header. Nothing is logged and nothing is shown, so an absent bell in
production means a missing environment variable and a redeploy, not a bug in
the component.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/lib/firebase.ts#L62)

### `onForegroundMessage` {#function-on-foreground-message}

*Function*

Subscribes to push messages that arrive while the tab is focused.

```ts
function onForegroundMessage(cb: (payload: MessagePayload) => void): Promise<() => void>
```

| Parameter | Type | Meaning |
|---|---|---|
| `cb` | `(payload: MessagePayload) => void` | Called with each foreground message payload. |

**Returns** `Promise<() => void>` &mdash; A function that cancels the subscription.

The service worker handles messages only when the tab is backgrounded, so
without this a push that lands while the shopkeeper is looking at the panel
would be lost entirely. The caller turns these into toasts.

Because the setup is asynchronous, the unsubscribe function arrives in a
promise. An effect must await it and call it on cleanup, or the subscription
outlives the component.

When push is unconfigured or unsupported this resolves to a no-op function,
so the caller needs no special case.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/lib/firebase.ts#L190)

### `pushPermission` {#function-push-permission}

*Function*

Reports the browser's current notification permission.

```ts
function pushPermission(): NotificationPermission | "unsupported"
```

**Returns** `NotificationPermission \| "unsupported"` &mdash; `"default"`, `"granted"`, `"denied"`, or `"unsupported"`.

Adds an `"unsupported"` value for browsers with no Notification API at all,
so the bell can distinguish "cannot ask" from "asked and refused". A
`"denied"` result cannot be recovered from in code: the shopkeeper has to
change it in browser settings.

This is read synchronously, so it does not reflect a permission the user
changes while the page is open until something re-reads it.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/lib/firebase.ts#L86)

### `requestAdminPushToken` {#function-request-admin-push-token}

*Function*

Registers the service worker, asks for permission, and returns an FCM token.

```ts
function requestAdminPushToken(): Promise<string | null>
```

**Returns** `Promise<string \| null>` &mdash; The FCM registration token, or `null`.

The whole opt-in sequence in one call. The caller then `POST`s the token to
`/admin/push-token` so the server can address this browser.

The public Firebase config is passed to the worker in the registration query
string, so `public/firebase-messaging-sw.js` does not have to hard-code a
second copy of it. Changing a Firebase value therefore updates both halves
from one place.

Returns `null` — never throws — when push is unconfigured, the browser
cannot do FCM, there is no service worker support, the user declines the
permission prompt, or token retrieval fails. The caller cannot distinguish
these cases.

Note that this shows the browser's permission prompt, so it must be called
from a user gesture. Calling it on page load produces a prompt the
shopkeeper did not ask for, and a denial cannot be undone from code.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/lib/firebase.ts#L141)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/lib/firebase.ts)
