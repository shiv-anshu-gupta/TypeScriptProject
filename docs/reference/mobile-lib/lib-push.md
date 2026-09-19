# Push `push`

Getting this device an Expo push token, and deciding how a notification behaves when it arrives.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/lib/push.ts` |
| Group | [Mobile app — library](index.md) |
| Exports | 2 |

## Description

Importing this module has a side effect: it installs the notification
handler below. That is why it is imported for its token function and the
handler is never registered anywhere else.

Nothing here talks to the sKirana server. Handing the token over, and
handing it back at sign-out, belong to the push feature.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`PushRegistration`](#type-push-registration) | Type | `type PushRegistration = { … };` | The outcome of asking this device for a push token. |
| [`registerForPushNotificationsAsync`](#function-register-for-push-notifications-async) | Function | `function registerForPushNotificationsAsync(): Promise<PushRegistration>` | Asks for permission and returns this device's Expo push token. |

## Exports in detail

### `PushRegistration` {#type-push-registration}

*Type*

The outcome of asking this device for a push token.

```ts
type PushRegistration = {
  token: string | null;
  reason: string;
};
```

| Property | Type | Meaning |
|---|---|---|
| `reason` | `string` | — |
| `token` | `string \| null` | — |

A `null` token is an ordinary outcome, not an error — an emulator, a
refused permission or Expo Go all land here. `reason` then says which, for
the log; it is developer English and is never shown to a customer.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/push.ts#L51)

### `registerForPushNotificationsAsync` {#function-register-for-push-notifications-async}

*Function*

Asks for permission and returns this device's Expo push token.

Never throws: when push isn't possible (emulator, permission denied, no
EAS project id, Expo Go) it reports why instead, so the app keeps working.

```ts
function registerForPushNotificationsAsync(): Promise<PushRegistration>
```

**Returns** `Promise<PushRegistration>` &mdash; A token with an empty `reason`, or a `null` token and the reason it could not be had.

It may show the operating system's permission dialog, so call it only once
the customer is signed in and there is something to notify them about.

On Android it also creates the "default" notification channel, which has to
exist before the first notification arrives or that one is delivered
silently. The channel is created even on a device that then turns out to be
an emulator, because creating it is cheap and getting the order wrong is
not recoverable later.

The token identifies the *device*, not the account. The caller is
responsible for handing it to the server and for handing it back at
sign-out.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/push.ts#L80)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/push.ts)
