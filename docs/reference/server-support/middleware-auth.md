# Auth `auth`

Who is making this request, and are they allowed to.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/middleware/auth.ts` |
| Group | [Server — utilities and middleware](index.md) |
| Exports | 3 |

## Description

Identity comes from Clerk, which `clerkMiddleware()` has already put on the
request by the time anything here runs. The app's own user record is a
separate thing, keyed by the Clerk user id - see services/user-sync.ts for
why the two can drift apart and how they are re-joined.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`getDbUserFromReq`](#function-get-db-user-from-req) | Function | `function getDbUserFromReq(req: Request): Promise<any>` | The app's own user record for whoever is making this request. |
| [`requireAdmin`](#function-require-admin) | Function | `function requireAdmin(req: Request, res: Response, next: NextFunction): void` | Gate that lets a request through only if the caller is an admin. |
| [`requireAuth`](#function-require-auth) | Function | `function requireAuth(req: Request, _res: Response, next: NextFunction): void` | Gate that lets a request through only if somebody is signed in. |

## Exports in detail

### `getDbUserFromReq` {#function-get-db-user-from-req}

*Function*

The app's own user record for whoever is making this request.

```ts
function getDbUserFromReq(req: Request): Promise<any>
```

| Parameter | Type | Meaning |
|---|---|---|
| `req` | `Request` | — |

**Returns** `Promise<any>` &mdash; The Mongoose user document, hydrated and saveable.

**Throws**

- `AppError` 401 when nobody is signed in, and whatever `syncDbUser` throws - including [`AppError`](utils-app-error.md#class-app-error) 409 when the email belongs to another account that could not be re-linked.

The usual first line of a handler that needs to know who the customer is.
Reads the Clerk session, then looks the record up by `clerkUserId`.

May WRITE: when no record exists it falls through to `syncDbUser`, which
creates one - or re-links an older record that has the same verified email.
That call also reaches Clerk's API, so this is not always a single cheap
lookup.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/middleware/auth.ts#L60)

### `requireAdmin` {#function-require-admin}

*Function*

Gate that lets a request through only if the caller is an admin.

```ts
function requireAdmin(req: Request, res: Response, next: NextFunction): void
```

| Parameter | Type | Meaning |
|---|---|---|
| `req` | `Request` | — |
| `res` | `Response` | — |
| `next` | `NextFunction` | — |

Covers being signed in as well, so it does not need
[`requireAuth`](#function-require-auth) in front of it. Unlike that one, this reads (and may
write) the database through [`getDbUserFromReq`](#function-get-db-user-from-req), so mount it on admin
routes only.

Admin is a role on the user record. It is granted by
services/user-sync.ts from the `ADMIN_EMAILS` environment variable, not by
anything an admin does in the panel.

Answers 403 when the caller is signed in but not an admin, and 401 when
they are not signed in at all.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/middleware/auth.ts#L95)

### `requireAuth` {#function-require-auth}

*Function*

Gate that lets a request through only if somebody is signed in.

```ts
function requireAuth(req: Request, _res: Response, next: NextFunction): void
```

| Parameter | Type | Meaning |
|---|---|---|
| `req` | `Request` | — |
| `_res` | `Response` | — |
| `next` | `NextFunction` | — |

Checks the Clerk session alone - no database read - so it is cheap enough
to mount on whole routers. It proves only that the caller is signed in; it
says nothing about whether they have a user record, and loads nothing onto
the request. A handler that needs the record calls
[`getDbUserFromReq`](#function-get-db-user-from-req).

Passes an [`AppError`](utils-app-error.md#class-app-error) 401 to `next` when there is no session.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/middleware/auth.ts#L31)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/middleware/auth.ts)
