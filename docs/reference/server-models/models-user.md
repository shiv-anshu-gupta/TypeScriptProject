# User

The app's own record of a person, alongside their Clerk account.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/models/User.ts` |
| Group | [Server — models](index.md) |
| Exports | 2 |

## Description

Clerk owns authentication and the identity fields; this record owns
everything the shop needs and Clerk does not hold - the phone number, the
role, points, addresses and push tokens. The two are joined by
`clerkUserId`, and services/user-sync.ts is what keeps them together.

Unusually for this folder the schema is untyped, so `User` documents come
back loosely typed; [`UserRole`](#type-user-role) is exported for callers that need to
name a role.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`User`](#constant-user) | Constant | `const User: Model<any, object, object, object, any, any, any>` | The User model. |
| [`UserRole`](#type-user-role) | Type | `type UserRole = "user" \| "admin";` | What a person may do. |

## Exports in detail

### `User` {#constant-user}

*Constant*

The User model.

```ts
const User: Model<any, object, object, object, any, any, any>
```

Resolved from `mongoose.models` first so a hot reload does not compile the
same model twice.

Two unique indexes, and both matter. `clerkUserId` is how every
authenticated request finds its record. `email` is what lets a returning
customer be re-linked to a new Clerk id - and also what makes creating a
second record for the same person fail, which is the situation
services/user-sync.ts exists to handle. Read the note on the `email` field
before making either sparse.

Records are never deleted here; a customer who stops using the app simply
stops appearing.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/User.ts#L149)

### `UserRole` {#type-user-role}

*Type*

What a person may do.

```ts
type UserRole = "user" | "admin";
```

`admin` unlocks the whole admin panel; there is no finer permission. The
role is granted from the `ADMIN_EMAILS` environment variable by
services/user-sync.ts, never through the app, and that code only ever
grants - removing an email does not demote an existing admin.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/User.ts#L27)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/models/User.ts)
