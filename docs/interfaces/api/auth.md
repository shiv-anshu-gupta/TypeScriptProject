# Auth {#auth-router}

`server/src/routes/auth/auth.routes.ts` · exported as `authRouter` ·
mounted at `/auth` in `mainEntryFunction` (`server/src/server.ts`).

## What this router owns

The `users` record that sits behind a Clerk session. Clerk owns
authentication and the identity fields; this record owns everything the shop
needs and Clerk does not hold — the phone number, the role, points, addresses
and push tokens. The two are joined by `clerkUserId`.

## Who may call it

Both routes need a signed-in caller of any role, through `requireAuth` applied
per route. Neither is public and neither is admin-only.

Admin rights are never granted here. `syncDbUser` in
`server/src/services/user-sync.ts` promotes a user whose verified Clerk email
is listed in `ADMIN_EMAILS`.

## The shared response shape

Both routes answer with the same payload, built by `toPayload`:

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "68e1f0c4a5b2d9e3f1a70c42",
      "clerkUserId": "user_2pQ9xZa1B2c3D4e5F6g7H8i9J0",
      "email": "asha@example.com",
      "name": "Asha Kumari",
      "role": "user"
    }
  }
}
```

The Mongo `_id` is renamed to `id`. `email` and `name` are left out of the JSON
when they are absent on the record, so a caller must treat both as optional.
Everything else on the document is deliberately omitted: `phone`, `points`,
`addresses`, `pushTokens`, `webPushTokens` and `__v`.

---

## `POST /auth/sync` {#post-auth-sync}

Reconciles the Clerk session with the `users` collection and returns the
resulting record.

**Auth:** signed-in customer, any role.

**Path parameters:** none. **Query parameters:** none. **Request body:** none
is read.

Unlike `/auth/me` this calls `syncDbUser` unconditionally, so it refreshes the
stored email and name and re-applies the `ADMIN_EMAILS` promotion even when a
record already exists. Both apps call it once, immediately after login.

`syncDbUser` takes one of three paths:

1. **The Clerk id is already known.** Refresh the email — but only if no other
   record holds it — fill in `name` when it is empty, and set `role` to
   `admin` when the email is in `ADMIN_EMAILS`. Saves only if something
   changed.
2. **No record for this id, but one exists with the same *verified* email.**
   The record is re-pointed at the new `clerkUserId`, keeping the customer's
   lists, phone number and role. The match is case-insensitive, through
   `collation({ locale: "en", strength: 2 })`. Only a verified email may claim
   a record, otherwise anyone could type someone else's address. The re-link is
   logged with both ids.
3. **Otherwise, create a new record.** On a duplicate-key error it re-runs the
   `clerkUserId` lookup, because a concurrent request from the same login may
   have won the race.

???+ info "Why the re-link path exists"
    Moving Clerk from test to live keys gave every returning customer a new
    `clerkUserId`, while `users.email` carries a unique index. Inserting a
    second record therefore failed and the customer ended up with no record at
    all — the "User is not found in the DB" symptom. See
    [users](../database/users.md) for the index detail.

**Errors**

| Status | Message |
|---|---|
| 401 | `User is not logged in. Means unauth user! !` |
| 409 | `This email is already used by another sKirana account. Please contact the shop.` — the email belongs to a record that could not be re-linked, because it is not verified on this account |
| 500 | anything Clerk's API throws, including an id unknown to this Clerk instance |

**Side effects:** reads the Clerk Backend API through
`clerkClient.users.getUser`, and may write to `users` — inserting a record,
re-linking one to a new `clerkUserId`, updating `email` or `name`, or setting
`role` to `admin`. No Cloudinary, no Gemini, no push, no Telegram.

**Called by:** `syncUser` in `mobile/src/features/auth/api.ts` and in
`client/src/features/auth/api.ts`, both through their `useBootstrapAuth` hook.

---

## `GET /auth/me` {#get-auth-me}

The caller's own user record.

**Auth:** signed-in customer, any role.

**Path parameters:** none. **Query parameters:** none. **Request body:** none.

Same response shape as `/auth/sync`. The difference is that this route resolves
the record through `getDbUserFromReq` rather than `syncDbUser`, so it does not
refresh an existing record — it only creates one on demand when none exists.

**Errors**

| Status | Message |
|---|---|
| 401 | `User is not logged in. Means unauth user! !` |
| 409 | `This email is already used by another sKirana account. Please contact the shop.` — from the create-on-demand path only |

**Side effects:** may insert or re-link a `users` document, and may call the
Clerk Backend API, on the create-on-demand path only. A read that can write.

**Called by:** `getMe` in `client/src/features/auth/api.ts`, through
`useBootstrapAuth` in `client/src/features/auth/useBootstrapAuth.ts`.

The mobile app also defines `getMe` in `mobile/src/features/auth/api.ts` but
nothing imports it — the app's `useBootstrapAuth` prefers `syncUser`. So this
endpoint is reached by the admin web only.
