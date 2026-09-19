# Types `types`

Types shared across features: the user and the server's response envelope.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `client/src/lib/types.ts` |
| Group | [Admin panel — library](index.md) |
| Exports | 4 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`ApiEnvelope`](#type-api-envelope) | Type | `type ApiEnvelope<T> = { … };` | The wrapper every server response arrives in. |
| [`ApiErrorItem`](#type-api-error-item) | Type | `type ApiErrorItem = { … };` | One failure reported by the server. |
| [`AppUser`](#type-app-user) | Type | `type AppUser = { … };` | The signed-in account as this app sees it. |
| [`UserRole`](#type-user-role) | Type | `type UserRole = "user" \| "admin";` | The two roles the server issues. |

## Exports in detail

### `ApiEnvelope` {#type-api-envelope}

*Type*

The wrapper every server response arrives in.

```ts
type ApiEnvelope<T> = {
  status: "success" | "error";
  data: T | null;
  meta?: Record<string, unknown>;
  errors?: ApiErrorItem[];
};
```

| Property | Type | Meaning |
|---|---|---|
| `data` | `T \| null` | — |
| `errors?` | `ApiErrorItem[]` | — |
| `meta?` | `Record<string, unknown>` | — |
| `status` | `"success" \| "error"` | — |

Callers do not normally see this. The helpers in `lib/api.ts` unwrap it and
return `data`, or throw `errors[0].message`.

Note that those helpers treat a null `data` as a failure even when `status`
is `"success"`, so an endpoint that legitimately returns nothing cannot be
called through them.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/lib/types.ts#L63)

### `ApiErrorItem` {#type-api-error-item}

*Type*

One failure reported by the server.

```ts
type ApiErrorItem = {
  message: string;
  code?: string;
};
```

| Property | Type | Meaning |
|---|---|---|
| `code?` | `string` | — |
| `message` | `string` | — |

Only `message` is read by this app, and only the first item of the array —
see `lib/api.ts`. The messages are written to be shown to the shopkeeper
as-is, which some dialogs rely on (the refusal to delete a category that
still has products, for example).

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/lib/types.ts#L45)

### `AppUser` {#type-app-user}

*Type*

The signed-in account as this app sees it.

```ts
type AppUser = {
  id: string;
  clerkUserId: string;
  email?: string;
  name?: string;
  role: UserRole;
};
```

| Property | Type | Meaning |
|---|---|---|
| `clerkUserId` | `string` | — |
| `email?` | `string` | — |
| `id` | `string` | — |
| `name?` | `string` | — |
| `role` | `UserRole` | — |

Returned by `POST /auth/sync` and `GET /auth/me`, and held in the auth store.
This is the server's own record, not Clerk's — `id` is the Mongo document id,
while `clerkUserId` is the identity it was created from.

`email` and `name` are optional because a Clerk identity need not carry
either. Any display of them must cope with an absent value.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/lib/types.ts#L28)

### `UserRole` {#type-user-role}

*Type*

The two roles the server issues.

```ts
type UserRole = "user" | "admin";
```

`user` is a mobile-app customer; `admin` is shop staff. The server assigns
the role by matching the account's email against its `ADMIN_EMAILS` list.
The client never decides this and must never try to.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/lib/types.ts#L15)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/lib/types.ts)
