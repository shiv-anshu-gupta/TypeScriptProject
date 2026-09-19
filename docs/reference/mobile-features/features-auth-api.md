# Auth api `api`

The two endpoints that turn a Clerk session into an account on this server.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/features/auth/api.ts` |
| Group | [Mobile app — features and state](index.md) |
| Exports | 2 |

## Description

Both need a bearer token; without one the server answers with an error and
the api client throws.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`getMe`](#function-get-me) | Function | `function getMe(): Promise<MeResponse>` | `GET /auth/me` — the signed-in account, read only. |
| [`syncUser`](#function-sync-user) | Function | `function syncUser(): Promise<SyncResponse>` | `POST /auth/sync` — creates this server's record for the signed-in Clerk user, or updates it. |

## Exports in detail

### `getMe` {#function-get-me}

*Function*

`GET /auth/me` — the signed-in account, read only.

```ts
function getMe(): Promise<MeResponse>
```

**Returns** `Promise<MeResponse>` &mdash; `{ user }`.

**Throws**

- Error When there is no usable token, or the account does not exist on this server yet.

Not used on the startup path, which prefers [`syncUser`](#function-sync-user) for the round
trip it saves. Kept for a caller that wants to re-read the account without
writing anything.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/auth/api.ts#L42)

### `syncUser` {#function-sync-user}

*Function*

`POST /auth/sync` — creates this server's record for the signed-in Clerk
user, or updates it.

```ts
function syncUser(): Promise<SyncResponse>
```

**Returns** `Promise<SyncResponse>` &mdash; `{ user }` — the account as this server knows it.

**Throws**

- Error When there is no usable token, or the server refuses.

Safe to call on every launch: the server upserts. It answers with the same
user record `/auth/me` would, so launch needs one round trip rather than
two.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/auth/api.ts#L26)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/auth/api.ts)
