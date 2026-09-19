# notifyAdmins `webPush`

Web push to the admin's browser, through Firebase Cloud Messaging.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/utils/webPush.ts` |
| Group | [Server — utilities and middleware](index.md) |
| Exports | 1 |

## Description

This is how the shop learns of a new order while the admin panel is open in
a browser tab. The customer's phone is notified separately, through Expo -
see utils/push.ts.

Nothing here throws: a notification is a side-effect of the customer's
request and must never fail it.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`notifyAdmins`](#function-notify-admins) | Function | `function notifyAdmins(title: string, body: string, data?: Record<string, string>): Promise<void>` | Notify every admin's browser of something (e.g. a new order). |

## Exports in detail

### `notifyAdmins` {#function-notify-admins}

*Function*

Notify every admin's browser of something (e.g. a new order). Fire-and-forget,
never throws — a push failure must not break the customer's request.

```ts
function notifyAdmins(title: string, body: string, data?: Record<string, string>): Promise<void>
```

| Parameter | Type | Meaning |
|---|---|---|
| `title` | `string` | — |
| `body` | `string` | — |
| `data?` | `Record<string, string>` | string pairs passed through to the browser's service worker. |

**Returns** `Promise<void>`

Collects `webPushTokens` from every user with role `admin`, sends to all of
them, and then writes back: any token FCM called permanently dead is
`$pull`ed from every admin record, so the list cannot grow stale as the
shop's browsers come and go.

Silent when there are no admins, no tokens, or no Firebase configuration.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/webPush.ts#L129)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/webPush.ts)
