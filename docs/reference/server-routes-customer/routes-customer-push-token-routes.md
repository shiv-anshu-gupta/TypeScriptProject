# customerPushTokenRouter `push-token.routes`

Device registration for Expo push notifications sent to customers.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/routes/customer/push-token.routes.ts` |
| Group | [Server — routes: customer](index.md) |
| Exports | 1 |

## Description

Mounted at `/customer` in `server/src/server.ts`, so the single path is
`/customer/push-token`, reached with `POST` and `DELETE`.

Every route here requires a signed-in customer (`requireAuth` is applied
router-wide). Tokens are stored on `users.pushTokens`, which is a different
array from the admin browsers' `users.webPushTokens`.

Only tokens beginning `ExponentPushToken[` or `ExpoPushToken[` are ever
sent to by `notifyUser`. Any other string is stored but silently never
used.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`customerPushTokenRouter`](#constant-customer-push-token-router) | Constant | `const customerPushTokenRouter: Router` | — |

## Exports in detail

### `customerPushTokenRouter` {#constant-customer-push-token-router}

*Constant*

```ts
const customerPushTokenRouter: Router
```

*No description in the source.*

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/routes/customer/push-token.routes.ts#L25)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/routes/customer/push-token.routes.ts)
