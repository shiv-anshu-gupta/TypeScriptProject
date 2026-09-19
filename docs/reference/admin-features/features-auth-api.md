# Auth api `api`

The two auth endpoint calls.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `client/src/features/auth/api.ts` |
| Group | [Admin panel — features and hooks](index.md) |
| Exports | 2 |

## Description

Only `useBootstrapAuth` calls these, and it calls them in the order
sync then me.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`getMe`](#function-get-me) | Function | `function getMe(): Promise<MeResponse>` | Reads the signed-in user, including the role the guards check. |
| [`syncUser`](#function-sync-user) | Function | `function syncUser(): Promise<SyncResponse>` | Creates or refreshes this Clerk user's record on the server. |

## Exports in detail

### `getMe` {#function-get-me}

*Function*

Reads the signed-in user, including the role the guards check.

```ts
function getMe(): Promise<MeResponse>
```

**Returns** `Promise<MeResponse>` &mdash; The current user.

**Throws**

- The server's first error message, as thrown by `lib/api.ts`.

`GET /auth/me`. The Clerk JWT is attached by the axios interceptor in
`lib/api.ts`, so no argument is needed.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/auth/api.ts#L41)

### `syncUser` {#function-sync-user}

*Function*

Creates or refreshes this Clerk user's record on the server.

```ts
function syncUser(): Promise<SyncResponse>
```

**Returns** `Promise<SyncResponse>` &mdash; The synced user.

**Throws**

- The server's first error message, as thrown by `lib/api.ts`.

`POST /auth/sync`. This is where admin rights are decided: the server matches
the account's email against its `ADMIN_EMAILS` list and writes the role. It
promotes but never demotes.

It must run before [`getMe`](#function-get-me), otherwise a first-time sign-in has no user
record to read.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/auth/api.ts#L27)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/auth/api.ts)
