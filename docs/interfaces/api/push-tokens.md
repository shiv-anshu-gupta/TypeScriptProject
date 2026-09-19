# Push tokens {#push-tokens}

Two routers, one path each, both reached with `POST` and `DELETE`.

| Router | File | Symbol | Mounted at | Stores on |
|---|---|---|---|---|
| Customer devices | `server/src/routes/customer/push-token.routes.ts` | `customerPushTokenRouter` | `/customer` | `users.pushTokens` |
| Admin browsers | `server/src/routes/admin/push-token.routes.ts` | `adminPushTokenRouter` | `/admin` | `users.webPushTokens` |

Both are mounted in `mainEntryFunction` (`server/src/server.ts`).

## What these routers own

Where a notification is delivered. Nothing about what it says — that is on the
[Outbound messages](../messages.md) page.

There is no `pushtokens` collection. Tokens are two string arrays on the
`users` document, and the two arrays are kept apart because they hold different
kinds of token for different recipients. See
[users](../database/users.md#push-tokens).

## Who may call them

The customer pair needs a signed-in caller of any role
(`customerPushTokenRouter.use(requireAuth)`). The admin pair needs an admin
(`adminPushTokenRouter.use(requireAdmin)`).

Each token is stored against the **calling** user's own record; no route
accepts a user id.

???+ warning "These DELETE routes carry a JSON body"
    Both `DELETE` handlers read `req.body.token`. axios sends a `DELETE` body,
    which is why the shipped clients work, but many HTTP clients, proxies and
    `fetch` implementations drop one. Such a caller sees
    **400 `Push token is required`**, because the body arrives empty.

---

## `POST /customer/push-token` {#post-customer}

Records an Expo push token for the calling customer's device.

**Auth:** signed-in customer. **Path and query parameters:** none.

### Request body

| Field | Type | Validation |
|---|---|---|
| `token` | string | Coerced with `String(req.body.token \|\| "")` then trimmed; must be non-empty. The value is **not** checked against the Expo token format here |

Stored with `$addToSet`, so the same device registering twice leaves one entry.

```json
{
  "status": "success",
  "data": { "registered": true }
}
```

Always `registered: true`, whether the token was new or already present.

???+ info "An unusable token is accepted and stored"
    Only tokens beginning `ExponentPushToken[` or `ExpoPushToken[` are ever
    sent to. `isExpoPushToken` in `server/src/utils/push.ts` filters the rest
    out at send time, because Expo rejects a whole batch if any address is
    malformed. So any other string is stored here and then silently never
    used.

**Errors**

| Status | Message |
|---|---|
| 400 | `Push token is required` |
| 401 | the standard unauthenticated message |

**Side effects:** one `$addToSet` write to `users.pushTokens`. No Cloudinary,
no Gemini, no push, no Telegram.

**Called by:** `savePushToken` in `mobile/src/features/customer/push/api.ts`,
through `usePushNotifications` in
`mobile/src/features/customer/push/use-push-notifications.ts`.

---

## `DELETE /customer/push-token` {#delete-customer}

Removes one Expo push token from the calling customer's device list. Called on
sign-out, so a shared phone stops receiving that customer's alerts.

**Auth:** signed-in customer. **Path and query parameters:** none.

**Request body:** `{ token }`, with the same rules as the `POST`.

```json
{
  "status": "success",
  "data": { "registered": false }
}
```

Removing a token that was never registered succeeds and answers the same way.

**Errors**

| Status | Message |
|---|---|
| 400 | `Push token is required` — including when the body was stripped in transit |
| 401 | the standard unauthenticated message |

**Side effects:** one `$pull` write to `users.pushTokens`.

**Called by:** `removePushToken` in
`mobile/src/features/customer/push/api.ts`, through
`mobile/src/features/customer/push/registry.ts`.

---

## `POST /admin/push-token` {#post-admin}

Records a Firebase Cloud Messaging web-push registration token for the calling
admin's browser.

**Auth:** admin. **Path and query parameters:** none.

**Request body:** `{ token }` — trimmed, non-empty. The string is not validated
as an FCM token here.

```json
{
  "status": "success",
  "data": { "registered": true }
}
```

Each admin's browsers are stored against that admin's own user record, and
`notifyAdmins` in `server/src/utils/webPush.ts` collects `webPushTokens` from
every user whose `role` is `admin` — so an alert reaches every admin who has
registered, not only the one who caused it.

**Errors**

| Status | Message |
|---|---|
| 400 | `Push token is required` |
| 401 or 403 | the standard unauthenticated and non-admin messages |

**Side effects:** one `$addToSet` write to `users.webPushTokens`.

**Called by:** `registerAdminPushToken` in
`client/src/features/admin/notifications/api.ts`.

---

## `DELETE /admin/push-token` {#delete-admin}

Removes one FCM web-push token from the calling admin's browser list.

**Auth:** admin. **Path and query parameters:** none.

**Request body:** `{ token }`, with the same rules as the `POST`.

```json
{
  "status": "success",
  "data": { "registered": false }
}
```

**Errors**

| Status | Message |
|---|---|
| 400 | `Push token is required` — including when the body was stripped in transit |
| 401 or 403 | the standard unauthenticated and non-admin messages |

**Side effects:** one `$pull` write to `users.webPushTokens`.

**Called by: nobody.** `client/src/features/admin/notifications/api.ts` imports
only `apiPost` and defines no delete function, and nothing in `mobile/src`
calls an admin route at all. This route is live but has no caller.

It is also not needed for correctness: `notifyAdmins` in
`server/src/utils/webPush.ts` prunes itself. Any token Firebase reports as
permanently dead — `registration-token-not-registered`, `invalid-argument` or
`invalid-registration-token` — is `$pull`ed from **every** admin record after
the send. A token that merely failed once is not reported, so a transient
outage never costs an admin their notifications.
