# registerAdminPushToken `api`

Registering this browser for admin push.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `client/src/features/admin/notifications/api.ts` |
| Group | [Admin panel — features and hooks](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`registerAdminPushToken`](#function-register-admin-push-token) | Function | `function registerAdminPushToken(token: string): Promise<{ registered: boolean }>` | Tells the server which FCM token addresses this browser. |

## Exports in detail

### `registerAdminPushToken` {#function-register-admin-push-token}

*Function*

Tells the server which FCM token addresses this browser.

```ts
function registerAdminPushToken(token: string): Promise<{ registered: boolean }>
```

| Parameter | Type | Meaning |
|---|---|---|
| `token` | `string` | The FCM registration token. |

**Returns** `Promise<{ … }>` &mdash; `{ registered: true }` on success.

**Throws**

- The server's first error message.

`POST /admin/push-token`. Until this succeeds the server cannot notify this
device, even though the browser has already granted permission — so the bell
showing "on" is not proof that alerts will arrive.

Tokens are per browser and per device, and Firebase can rotate them, which is
why the push hook re-registers on every visit where permission is already
granted rather than storing the token anywhere.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/notifications/api.ts#L24)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/notifications/api.ts)
