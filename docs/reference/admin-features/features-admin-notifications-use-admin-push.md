# useAdminPush `use-admin-push`

The browser-push opt-in and foreground-message handling.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `client/src/features/admin/notifications/use-admin-push.ts` |
| Group | [Admin panel — features and hooks](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`useAdminPush`](#hook-use-admin-push) | Hook | `function useAdminPush(): { … }` | Manages the push permission and keeps this browser's FCM token registered. |

## Exports in detail

### `useAdminPush` {#hook-use-admin-push}

*Hook*

Manages the push permission and keeps this browser's FCM token registered.

```ts
function useAdminPush(): {
  configured: boolean;
  permission: NotificationPermission | "unsupported";
  enable: () => Promise<boolean>;
}
```

**Returns** `{ configured: boolean; permission: NotificationPermission \| "unsupported"; enable: () => Promise<…> }` &mdash; `configured` (whether Firebase values are present in this build), `permission` (including `"unsupported"`), and `enable`, which resolves to whether a token was obtained.

Used only by `AdminPushBell`, which is mounted once in the admin header, so
this runs for the whole admin session regardless of which page is open.

Its behaviour:

- On mount, if permission was already granted on a previous visit, it
  silently refreshes the token and re-registers it with the server. No
  prompt appears, because the browser resolves `requestPermission`
  immediately when the answer is already known. This matters because FCM
  tokens can change and nothing else would notice.
- It subscribes to foreground messages and turns each into a toast. The
  service worker covers the backgrounded case, so without this a push
  arriving while the shopkeeper is looking at the panel would be lost.
- `enable` runs the full opt-in: prompt, token, register. Call it from a
  click — a permission prompt on page load is both rude and, once denied,
  irreversible from code.

Two silent failures to be aware of. A token that cannot be saved to the
server is swallowed: the bell will read "on" while the server still cannot
reach this device, and the next visit retries. And the `setup` ref guards
against the effect running twice under React Strict Mode, which would
otherwise register two message subscriptions and produce duplicate toasts.

`permission` is read at mount and after `enable`, so it does not track a
change made in browser settings while the page stays open.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/notifications/use-admin-push.ts#L54)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/notifications/use-admin-push.ts)
