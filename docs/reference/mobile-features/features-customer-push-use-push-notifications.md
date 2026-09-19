# usePushNotifications `use-push-notifications`

Registering for order alerts, and reacting to one when it arrives.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/features/customer/push/use-push-notifications.ts` |
| Group | [Mobile app — features and state](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`usePushNotifications`](#hook-use-push-notifications) | Hook | `function usePushNotifications(): void` | Registers this device for push once the customer signs in, and refreshes their lists whenever a notification arrives. |

## Exports in detail

### `usePushNotifications` {#hook-use-push-notifications}

*Hook*

Registers this device for push once the customer signs in, and refreshes
their lists whenever a notification arrives.

```ts
function usePushNotifications(): void
```

Call it once, from the app root.

Registration runs only when signed in and only once per session — a token
already recorded in the registry skips it, so the operating system's
permission dialog is not asked for again.

A device that cannot register is not an error the customer can act on: an
emulator, a refused permission or Expo Go are all logged and ignored, with
no toast, because a message on every launch would be noise.

Both notification listeners do the same thing: a notification means the
shop changed something, so pull the fresh statuses. That covers the alert
arriving while the app is open and the customer tapping one from the tray.

Renders nothing and returns nothing.

**See also**

- `releasePushToken` for the other half — handing the token back at sign-out.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/push/use-push-notifications.ts#L40)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/push/use-push-notifications.ts)
