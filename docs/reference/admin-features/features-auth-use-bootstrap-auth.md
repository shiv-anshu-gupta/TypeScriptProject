# useBootstrapAuth

Turns a Clerk session into an application user, once per page load.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `client/src/features/auth/useBootstrapAuth.ts` |
| Group | [Admin panel — features and hooks](index.md) |
| Exports | 1 |

## Description

This is the bridge between Clerk (which knows the identity) and the server
(which knows the role). Nothing else in the app writes the auth store.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`useBootstrapAuth`](#hook-use-bootstrap-auth) | Hook | `function useBootstrapAuth(): void` | Installs the API token getter and loads the signed-in user into the store. |

## Exports in detail

### `useBootstrapAuth` {#hook-use-bootstrap-auth}

*Hook*

Installs the API token getter and loads the signed-in user into the store.

```ts
function useBootstrapAuth(): void
```

Called exactly once, from `App`, above the router. Calling it from a route
would re-run the bootstrap on every navigation.

It runs two effects:

1. Hands Clerk's `getToken` to `lib/api.ts`, so every axios request from
   anywhere in the app carries a fresh bearer token. This is why no feature
   module ever deals with tokens itself. It re-installs whenever `getToken`
   changes identity.
2. On any change to the Clerk session: signed out clears the store; signed in
   runs `POST /auth/sync` and then `GET /auth/me` in that order, and stores
   the result. Sync must come first so a first-time user has a record to
   read.

A failure of either call is caught and recorded as `status: "error"` rather
than thrown. `RoleGuardLayout` turns that into the "Couldn't reach the shop
server" screen. The usual cause is the server's `CORS_ORIGINS` not listing
this site, which the browser reports only as `"Network Error"`.

There is no retry and no polling. The recovery path is the Try again button,
which reloads the page.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/auth/useBootstrapAuth.ts#L42)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/auth/useBootstrapAuth.ts)
