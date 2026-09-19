# Types `types`

The shapes shared by every feature: the signed-in user and the envelope every endpoint answers in.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/lib/types.ts` |
| Group | [Mobile app — library](index.md) |
| Exports | 4 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`ApiEnvelope`](#type-api-envelope) | Type | `type ApiEnvelope<T> = { … };` | The wrapper every endpoint answers in. |
| [`ApiErrorItem`](#type-api-error-item) | Type | `type ApiErrorItem = { … };` | One entry in an error envelope's `errors`. |
| [`AppUser`](#type-app-user) | Type | `type AppUser = { … };` | The account as the server knows it, returned by `/auth/sync` and `/auth/me`. |
| [`UserRole`](#type-user-role) | Type | `type UserRole = "user" \| "admin";` | What the server allows this account to do. |

## Exports in detail

### `ApiEnvelope` {#type-api-envelope}

*Type*

The wrapper every endpoint answers in.

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

Callers do not see this. The api client unwraps it and hands back `data`
alone, or throws. Note the client treats a falsy `data` as a failure, so an
endpoint that legitimately answers with `null` cannot be called through it
as it stands.

`meta` is accepted and currently ignored by the mobile app.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/types.ts#L61)

### `ApiErrorItem` {#type-api-error-item}

*Type*

One entry in an error envelope's `errors`.

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

Only the first entry's `message` is ever surfaced; it becomes the message
of the `Error` the api client throws.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/types.ts#L45)

### `AppUser` {#type-app-user}

*Type*

The account as the server knows it, returned by `/auth/sync` and
`/auth/me`.

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

`id` is this server's own identifier; `clerkUserId` is Clerk's. They are
different values and are not interchangeable.

`name` and `email` are what Clerk knew at sign-up. They are not what the
shop sees on an order — that is the separate customer profile, which the
customer edits on the Account screen.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/types.ts#L30)

### `UserRole` {#type-user-role}

*Type*

What the server allows this account to do.

```ts
type UserRole = "user" | "admin";
```

The customer app shows the same screens to both; `admin` matters in the web
admin panel. It is carried here only because `/auth/sync` returns the whole
user record.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/types.ts#L16)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/types.ts)
