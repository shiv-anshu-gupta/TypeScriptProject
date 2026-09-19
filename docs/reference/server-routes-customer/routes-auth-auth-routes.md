# authRouter `auth.routes`

Account routes: the MongoDB `users` record that sits behind a Clerk session.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/routes/auth/auth.routes.ts` |
| Group | [Server — routes: customer](index.md) |
| Exports | 1 |

## Description

Mounted at `/auth` in `server/src/server.ts`, so the paths below are
`/auth/sync` and `/auth/me`.

Every route here needs a signed-in caller (any role). Neither route is
public and neither is admin-only. Admin rights are never granted through
this API: `syncDbUser` promotes a user whose Clerk email appears in the
`ADMIN_EMAILS` environment variable.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`authRouter`](#constant-auth-router) | Constant | `const authRouter: Router` | — |

## Exports in detail

### `authRouter` {#constant-auth-router}

*Constant*

```ts
const authRouter: Router
```

*No description in the source.*

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/routes/auth/auth.routes.ts#L23)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/routes/auth/auth.routes.ts)
