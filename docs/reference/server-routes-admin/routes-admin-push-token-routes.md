# adminPushTokenRouter `push-token.routes`

Browser registration for the Firebase web-push alerts the admin panel receives when an order arrives.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/routes/admin/push-token.routes.ts` |
| Group | [Server — routes: admin](index.md) |
| Exports | 1 |

## Description

Mounted at `/admin` in `server/src/server.ts`, so the single path is
`/admin/push-token`, reached with `POST` and `DELETE`.

Every route here requires an admin (`requireAdmin` is applied router-wide).
Tokens are stored on `users.webPushTokens` — a separate array from the
customers' Expo `users.pushTokens` — and are read by `notifyAdmins`.

Tokens that Firebase reports as dead are pruned by `notifyAdmins` itself,
so a browser that clears its site data does not need to call the `DELETE`.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`adminPushTokenRouter`](#constant-admin-push-token-router) | Constant | `const adminPushTokenRouter: Router` | — |

## Exports in detail

### `adminPushTokenRouter` {#constant-admin-push-token-router}

*Constant*

```ts
const adminPushTokenRouter: Router
```

*No description in the source.*

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/routes/admin/push-token.routes.ts#L25)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/routes/admin/push-token.routes.ts)
