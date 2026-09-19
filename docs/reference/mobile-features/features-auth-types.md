# Auth types `types`

What the two auth endpoints answer with.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/features/auth/types.ts` |
| Group | [Mobile app — features and state](index.md) |
| Exports | 2 |

## Description

Both wrap the user in an object rather than returning it bare, so either
response can grow a second field without changing its callers.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`MeResponse`](#type-me-response) | Type | `type MeResponse = { … };` | The body of `GET /auth/me`, once the envelope is unwrapped. |
| [`SyncResponse`](#type-sync-response) | Type | `type SyncResponse = { … };` | The body of `POST /auth/sync`, once the envelope is unwrapped. |

## Exports in detail

### `MeResponse` {#type-me-response}

*Type*

The body of `GET /auth/me`, once the envelope is unwrapped.

```ts
type MeResponse = {
  user: AppUser;
};
```

| Property | Type | Meaning |
|---|---|---|
| `user` | `AppUser` | — |

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/auth/types.ts#L16)

### `SyncResponse` {#type-sync-response}

*Type*

The body of `POST /auth/sync`, once the envelope is unwrapped.

```ts
type SyncResponse = {
  user: AppUser;
};
```

| Property | Type | Meaning |
|---|---|---|
| `user` | `AppUser` | — |

Deliberately identical to [`MeResponse`](#type-me-response): sync answers with the record
it just wrote, so launch does not need a second read.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/auth/types.ts#L27)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/auth/types.ts)
