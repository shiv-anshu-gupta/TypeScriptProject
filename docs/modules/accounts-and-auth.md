# Accounts and auth

Who is using the app, and what they are allowed to do. Clerk holds the identity
and issues the session token; sKirana holds its own `users` record, keyed by the
Clerk user id, which carries the customer's name, mobile number, push tokens and
role. This module covers signing in on the phone and in the shop's browser,
creating and re-linking the database record, and the one bit that decides
whether somebody sees the admin panel at all.

## Capabilities

- Signs a customer in with Google SSO (`GoogleAuthButton.tsx`, Clerk `useSSO`
  through `expo-web-browser`, warmed up on Android) or with an email code —
  one field, no password, no separate "sign up" button.
- Decides sign-in versus sign-up **on the server, never by asking the
  customer**: `AuthPanel.tsx` calls `signIn.create({ identifier })` and only
  falls through to `signUp.create({ emailAddress })` when Clerk answers
  `form_identifier_not_found`.
- Takes a `CODE_LENGTH` = 6 digit code that submits itself once six digits are
  entered, unless a new customer still owes a name. Resend has a
  `RESEND_SECONDS` = 30 countdown that does not start if the resend itself
  failed.
- Caches Clerk's token in `expo-secure-store` (`lib/token-cache.ts`), so the
  session survives a restart. Both accessors swallow their errors.
- Attaches `Authorization: Bearer <clerk jwt>` to every request through a
  module-level token getter installed once by `useBootstrapAuth`, on both the
  phone (`mobile/src/lib/api.ts`) and the panel (`client/src/lib/api.ts`).
- Gives Clerk `TOKEN_TIMEOUT_MS` = 8 s to produce a token and then sends the
  request **without** one, so public screens still load when Clerk is slow. A
  protected route then answers 401 and the app reads that as "signed out".
- Verifies the token server-side with `clerkMiddleware`, which never rejects
  by itself — an unauthenticated request simply carries no `userId`.
- Gates routes with two guards (`middleware/auth.ts`): `requireAuth` checks the
  Clerk session only, with no database read; `requireAdmin` resolves the
  database user and answers 403 `"Admin access only"` when `role !== "admin"`.
  Both are mounted router-wide, never per route.
- Creates the database record on demand. `getDbUserFromReq` looks up
  `clerkUserId` and falls through to `syncDbUser`, so a signed-in customer
  always has a record even if their `/auth/sync` call never arrived.
- Re-links an old record to a new Clerk id when the **verified** email matches,
  matched case-insensitively with `collation({ locale: "en", strength: 2 })`.
  Only a verified email may claim a record; the re-link is logged with both ids.
- Survives a race: two requests from one login can both try to create the
  record, and the loser catches MongoDB's duplicate-key error (11000) and
  returns the winner's record. If the email belongs to a record that could not
  be re-linked, it throws 409 `"This email is already used by another sKirana
  account. Please contact the shop."`
- Grants admin from the `ADMIN_EMAILS` environment variable, read fresh on
  every sync, lower-cased and comma-separated. It **grants but never revokes**:
  removing an address does not demote an existing record.
- Handles Clerk's *pending* sessions in one place (`lib/clerk-session.ts`).
  `clearPending` signs out a session Clerk is holding back, `complete` wraps
  `setActive` plus that check and returns `done` / `onHold` / `incomplete`, and
  `recoverExisting` deals with a `session_exists` failure — adopting an active
  session, clearing a pending one, or signing the device out completely so the
  next attempt starts clean. The email path and the Google path use all three
  identically.
- Clears a pending session as soon as the login panel appears, so one left
  behind by an earlier attempt cannot block the new one.
- Guards the panel client-side in layers (`client/src/router.tsx`):
  `PublicOnlyLayout` for `/sign-in` and `/sign-up`, `ProtectedLayout` for
  Clerk's session, then `RoleGuardLayout allow={["admin"]}` reading the auth
  store's `role` — never Clerk metadata.
- Signs out cleanly on the phone: the device's Expo push token is handed back
  to the server **before** the session ends, and the lists, wishlist and
  profile stores are cleared.

## Boundary

- Does not own the customer's *profile* content. The editable name and mobile
  number, and the way they are pushed onto open orders, belong to
  [grocery lists](grocery-lists.md) and the account screen in
  [mobile shell](mobile-shell.md); this module only creates and finds the
  record they live on.
- Does not own push tokens. They sit on the same `users` document, but
  registering, storing and pruning them belongs to
  [notifications](notifications.md). Sign-out calls into that module.
- Does not decide what an admin *sees*. The panel's pages, sidebar and shell
  belong to [admin panel](admin-panel.md); this module only answers "is this
  person an admin".
- Does not scope data by owner. Each customer route re-queries with
  `user: dbUser._id` itself; see [grocery lists](grocery-lists.md).
- Does not style the login. The Clerk appearance in the panel and the sheet the
  mobile login sits in belong to [admin panel](admin-panel.md) and
  [mobile shell](mobile-shell.md).
- Does not issue or verify payment signatures, and has nothing to do with
  Razorpay.

## What it needs

| File | What it is |
|---|---|
| [`server/src/middleware/auth.ts`](../reference/server-support/middleware-auth.md) | `requireAuth`, `requireAdmin`, `getDbUserFromReq` |
| [`server/src/services/user-sync.ts`](../reference/server-services/services-user-sync.md) | Create, refresh, re-link, and grant admin from `ADMIN_EMAILS` |
| [`server/src/routes/auth/auth.routes.ts`](../reference/server-routes-customer/routes-auth-auth-routes.md) | `POST /auth/sync` and `GET /auth/me` |
| [`server/src/models/User.ts`](../reference/server-models/models-user.md) | The record: `clerkUserId`, `email` (unique), `role`, phone, tokens |
| [`mobile/src/components/auth/AuthPanel.tsx`](../reference/mobile-components/components-auth-auth-panel.md) | The login itself: one email field, the six-digit code, resend |
| [`mobile/src/components/auth/AuthView.tsx`](../reference/mobile-components/components-auth-auth-view.md) | The scrolling page around the panel, keyboard-aware |
| [`mobile/src/components/GoogleAuthButton.tsx`](../reference/mobile-components/components-google-auth-button.md) | Clerk SSO through the system browser |
| [`mobile/src/lib/clerk-session.ts`](../reference/mobile-lib/lib-clerk-session.md) | Pending sessions, `session_exists`, and the shared outcome messages |
| [`mobile/src/lib/token-cache.ts`](../reference/mobile-lib/lib-token-cache.md) | SecureStore-backed Clerk token cache |
| [`mobile/src/features/auth/useBootstrapAuth.ts`](../reference/mobile-features/features-auth-use-bootstrap-auth.md) | Wires the token getter, then syncs on Clerk state change |
| [`mobile/src/features/auth/store.ts`](../reference/mobile-features/features-auth-store.md) | `status`, `isBootstrapped`, `user`, `error` |
| [`client/src/features/auth/useBootstrapAuth.ts`](../reference/admin-features/features-auth-use-bootstrap-auth.md) | The panel's twin: token getter, then `sync` and `me` |
| [`client/src/components/auth/RoleGuardLayout.tsx`](../reference/admin-components/components-auth-role-guard-layout.md) | The admin gate, and the two redirects it deliberately avoids |
| [`client/src/components/auth/ProtectedLayout.tsx`](../reference/admin-components/components-auth-protected-layout.md) | Clerk session gate, carries `from` in router state |
| [`client/src/components/auth/PublicOnlyLayout.tsx`](../reference/admin-components/components-auth-public-only-layout.md) | Keeps a signed-in user off the sign-in page |

Collections read or written: `users` (read, create, and update of `email`,
`name`, `clerkUserId` and `role`).

External services called: Clerk — token verification through
`@clerk/express`, and the Backend API (`clerkClient.users.getUser`) on every
sync. Configured by `CLERK_SECRET_KEY` and `CLERK_PUBLISHABLE_KEY` on the
server, `VITE_CLERK_PUBLISHABLE_KEY` in the panel and
`EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` in the app.

## How it behaves

```mermaid
sequenceDiagram
    actor U as Person
    participant App as App or panel
    participant Clerk
    participant API as Express
    participant Sync as syncDbUser
    participant DB as users

    U->>App: Google, or email plus a 6-digit code
    App->>Clerk: signIn.create, else signUp.create
    Clerk-->>App: sessionId
    App->>App: complete(sessionId, setActive)
    alt Clerk holds the session pending
        App->>Clerk: signOut
        App-->>U: account on hold, ask the shop
    end
    App->>API: POST /auth/sync with the bearer token
    API->>Sync: syncDbUser(clerkUserId)
    Sync->>Clerk: users.getUser
    alt this clerkUserId is known
        Sync->>DB: refresh email, fill a missing name, grant admin
    else a record has the same VERIFIED email
        Sync->>DB: move that record onto the new clerkUserId
    else new person
        Sync->>DB: create, role from ADMIN_EMAILS
    end
    Sync-->>API: user document
    API-->>App: id, email, name, role
    App->>App: store role; the panel's RoleGuard reads only this
```

Rules that are not obvious from the code:

- **A pending Clerk session reads as signed out.** Clerk can create a session
  and hold it back until the user finishes a task in Clerk's own screens —
  organisation membership, MFA, a password reset. This app has no such screens,
  so the session is cleared and reported rather than left behind; otherwise the
  customer sits on the login while the device holds a session and every retry
  fails with `session_exists`.
- **One login, three mounts.** `AuthPanel` is mounted on the Account tab, the
  Lists tab and inside the SignIn screen, and Clerk keeps only one sign-in
  attempt per device. Every effect is gated on `useIsFocused`, and a hidden
  copy left on the code step resets itself to the email step — otherwise it
  would send its code to whichever attempt another screen started last.
- **The client guard is UX only.** Every `/admin/*` request is independently
  gated by `requireAdmin` on the server.
- **`role` is derived, not edited.** Nothing in either API sets it; it comes
  from `ADMIN_EMAILS` at sync time.
- **`email` is unique and not sparse.** At most one document may lack an email,
  so a phone-only sign-up would fail on the second such user.
- **`/auth/sync` and `/auth/me` return the same shape,** so launch needs one
  round trip on the phone. The panel calls both.
- **Any authenticated endpoint can return 401, 409 or 500 from this path**,
  because every one of them resolves the database user first.

## Failure modes

**"User is not found in the DB."** The Clerk user id has no matching record and
the re-link failed — usually a unique-index conflict on `email`. Look for
`E11000` in the Vercel function logs. This is the exact failure `syncDbUser`
was written for: a Clerk instance move gave every returning customer a new id
while `users.email` was already unique.

**A customer sees 409 "This email is already used by another sKirana
account."** The email exists on another record, and that record could not be
claimed because the email is not verified on the new Clerk account. It has to
be resolved in the database or in Clerk; there is no self-service path.

**The login screen returns immediately after signing in.** A pending session.
`clearPending` logs the blocking task key as
`[auth] cleared a pending Clerk session (task:...)`; the real fix is in the
Clerk dashboard, because the app collects nothing that would satisfy the task.

**Every attempt fails with `session_exists`.** The device already holds a
session Clerk will not activate. `recoverExisting` handles it, but if it keeps
recurring, the device has a session for an instance the app is no longer
pointing at — check that the publishable key in the build matches the server's
Clerk instance.

**The whole panel shows "Couldn't reach the shop server".** Bootstrap failed,
so the auth store is in `status: "error"`. In practice this is nearly always
CORS: `CORS_ORIGINS` does not list the exact origin (scheme, host and port,
including the `www.` form), the `cors` package omits the header, and the
browser reports a bare "Network Error". The guard deliberately does **not**
redirect to `/sign-in` here, because that page sees a signed-in Clerk session
and would send the user straight back.

**A signed-in person sees "Admin access only".** Their email is not in
`ADMIN_EMAILS`, or it was added after their record already existed and they
have not signed in since — the grant happens at sync time. Removing an email
never demotes, so the opposite complaint ("they still have access") needs a
database edit.

**Login works on the phone but every protected call 401s.** Clerk took longer
than eight seconds to mint a token and the request went out unauthenticated.
The app treats that as signed out rather than as an error, so it looks like a
sudden sign-out with no message. `[api]` warnings in the console are the tell.

**A rotated Clerk key breaks the panel but not the app.** `VITE_` values are
baked into the admin bundle at build time, so changing the key in Vercel does
nothing until the admin project is redeployed. Switch app, admin and server
keys together.

**A test key reaches customers.** Expo reads `.env.local` before `.env` even
for a production bundle. This has happened once; `mobile/scripts/preflight-ota.cjs`
now refuses to publish unless `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` resolves to a
`pk_live_` value. Publish only through `npm run ota`.
