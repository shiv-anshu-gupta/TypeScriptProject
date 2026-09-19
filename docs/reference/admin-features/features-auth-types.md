# Auth types `types`

Response shapes for the two auth endpoints.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `client/src/features/auth/types.ts` |
| Group | [Admin panel — features and hooks](index.md) |
| Exports | 2 |

## Description

These describe the payload *inside* the server's `{ status, data, errors }`
envelope. `lib/api.ts` unwraps the envelope, so callers receive these types
directly.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`MeResponse`](#type-me-response) | Type | `type MeResponse = { … };` | Payload of `GET /auth/me`. |
| [`SyncResponse`](#type-sync-response) | Type | `type SyncResponse = { … };` | Payload of `POST /auth/sync`. |

## Exports in detail

### `MeResponse` {#type-me-response}

*Type*

Payload of `GET /auth/me`.

```ts
type MeResponse = {
  user: AppUser;
};
```

| Property | Type | Meaning |
|---|---|---|
| `user` | `AppUser` | — |

The `role` on the returned user is what every route guard decides on.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/auth/types.ts#L19)

### `SyncResponse` {#type-sync-response}

*Type*

Payload of `POST /auth/sync`.

```ts
type SyncResponse = {
  user: AppUser;
};
```

| Property | Type | Meaning |
|---|---|---|
| `user` | `AppUser` | — |

Structurally identical to [`MeResponse`](#type-me-response), but produced by a different
server path: sync creates or updates the Mongo user record from the Clerk
identity and applies the `ADMIN_EMAILS` rule.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/auth/types.ts#L31)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/auth/types.ts)
