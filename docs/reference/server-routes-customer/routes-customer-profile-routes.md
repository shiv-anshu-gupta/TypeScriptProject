# customerProfileRouter `profile.routes`

The customer's own name, email and mobile number.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/routes/customer/profile.routes.ts` |
| Group | [Server — routes: customer](index.md) |
| Exports | 1 |

## Description

Mounted at `/customer` in `server/src/server.ts`, so the paths are
`GET /customer/profile` and `PATCH /customer/profile`.

Every route here requires a signed-in customer (`requireAuth` is applied
router-wide). A customer can only ever read and write their own record;
there is no path to another user's profile.

Email is read-only through this API — it comes from Clerk and is
synchronised by `syncDbUser`.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`customerProfileRouter`](#constant-customer-profile-router) | Constant | `const customerProfileRouter: Router` | — |

## Exports in detail

### `customerProfileRouter` {#constant-customer-profile-router}

*Constant*

```ts
const customerProfileRouter: Router
```

*No description in the source.*

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/routes/customer/profile.routes.ts#L56)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/routes/customer/profile.routes.ts)
