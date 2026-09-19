# RoleGuardLayout

Route guard: requires the signed-in user to hold an allowed role.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `client/src/components/auth/RoleGuardLayout.tsx` |
| Group | [Admin panel — components](index.md) |
| Exports | 1 |

## Description

The inner of the two guards around `/admin/*`, and the one that produces the
app's two full-screen error states.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`RoleGuardLayout`](#component-role-guard-layout) | React component | `function RoleGuardLayout(props: RoleGuardLayoutProps): Element` | Renders child routes only for a user whose role is in `allow`. |

## Exports in detail

### `RoleGuardLayout` {#component-role-guard-layout}

*React component*

Renders child routes only for a user whose role is in `allow`.

```ts
function RoleGuardLayout(props: RoleGuardLayoutProps): Element
```

| Prop | Type | Meaning |
|---|---|---|
| `allow` | `UserRole[]` | Roles permitted through. The router passes `["admin"]` and nothing else. |

**Returns** `Element` &mdash; A loader, an error screen, a redirect, or the matched child route.

The role is read from the auth store, never from Clerk metadata. The store is
filled by `useBootstrapAuth` from `GET /auth/me`, and the server decides the
role by matching the account's email against its `ADMIN_EMAILS` list. So a
user cannot grant themselves admin from the browser, and equally the client
cannot know the role until the API has answered.

Four outcomes:

- Store not bootstrapped, or loading — a loader.
- `status === "error"` — the "Couldn't reach the shop server" screen, with
  Try again and Sign out. In practice this is most often a CORS problem: the
  axios wrapper reports a blocked origin as the opaque string
  `"Network Error"`, which is shown underneath when present. It is *not*
  normally a sign that the user is signed out.
- No user — redirect to `/sign-in`.
- Role not allowed — the "Admin access only" screen, with Sign out.

Both error screens deliberately avoid redirecting, and must not be
"simplified" into redirects. The inline comments record why: `/sign-in`
sees a live Clerk session and sends the user straight back, and `/` is
`<Navigate to="/admin">`, which re-enters this guard. Either change produces
an infinite loop.

This is user experience only. The real enforcement is the server's
`requireAdmin` middleware, which answers `403 "Admin access only"` on every
`/admin/*` request regardless of what the browser does.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/auth/RoleGuardLayout.tsx#L58)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/auth/RoleGuardLayout.tsx)
