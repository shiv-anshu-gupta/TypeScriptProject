# Push `push`

Push notifications to the customer's phone, through Expo.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/utils/push.ts` |
| Group | [Server — utilities and middleware](index.md) |
| Exports | 2 |

## Description

Every function here is best-effort and silent on failure: a notification is
a side-effect of somebody else's action (usually the shopkeeper moving an
order along), so it must never turn their request into an error.

Admin browsers are notified separately, through Firebase - see
utils/webPush.ts.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`notifyUser`](#function-notify-user) | Function | `function notifyUser( … ): Promise<void>` | Look up a user's devices and push to all of them. |
| [`sendPushNotifications`](#function-send-push-notifications) | Function | `function sendPushNotifications( … ): Promise<void>` | Sends an Expo push notification to a set of device tokens. |

## Exports in detail

### `notifyUser` {#function-notify-user}

*Function*

Look up a user's devices and push to all of them.

```ts
function notifyUser(
  userId: string | ObjectId,
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void>
```

| Parameter | Type | Meaning |
|---|---|---|
| `userId` | `string \| ObjectId` | — |
| `title` | `string` | — |
| `body` | `string` | — |
| `data?` | `Record<string, unknown>` | — |

**Returns** `Promise<void>`

Reads `pushTokens` off the user record - one entry per device that user has
signed in on - and hands them to [`sendPushNotifications`](#function-send-push-notifications). A user who
has never allowed notifications simply has none, and nothing is sent.

Never throws: both the database read and the send are caught and logged, so
a caller can fire this without awaiting anything but the promise.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/push.ts#L104)

### `sendPushNotifications` {#function-send-push-notifications}

*Function*

Sends an Expo push notification to a set of device tokens.

Deliberately never throws: a notification is a side-effect of the
shopkeeper's action, so a push failure must not fail their request.

```ts
function sendPushNotifications(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>,
): Promise<void>
```

| Parameter | Type | Meaning |
|---|---|---|
| `tokens` | `string[]` | — |
| `title` | `string` | — |
| `body` | `string` | — |
| `data?` | `Record<string, unknown>` | travels with the notification and reaches the app when the customer taps it, so it is what routes the tap to the right screen. |

**Returns** `Promise<void>`

Posts one batch to Expo's public push API at
`https://exp.host/--/api/v2/push/send`. Tokens that do not look like Expo
tokens are dropped and duplicates are collapsed, so passing the same device
twice sends one notification; if nothing valid is left the call returns
without any network traffic.

Expo's own per-ticket results are not inspected, so a token the service has
since retired is not pruned here. Only a thrown network error is logged.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/push.ts#L61)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/push.ts)
