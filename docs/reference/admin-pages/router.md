# router

The route table — and the authority on which code in this app is alive.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `client/src/router.tsx` |
| Group | [Admin panel — pages](index.md) |
| Exports | 1 |

## Description

This app grew out of a generic MERN e-commerce template and a large amount of
that template is still on disk. Nothing under `pages/customer/**`,
`components/customer/**` or `features/customer/**` is referenced here, so
none of it can ever render. `pages/admin/Orders.tsx` is in the same position:
it is complete and it typechecks, but no route imports it and the sidebar has
no entry for it. Customers use the sKirana mobile app instead.

When you need to know whether a file matters, start here rather than with the
folder layout.

Three layers of guard wrap the admin section:

1. `ProtectedLayout` — requires a Clerk session, otherwise redirects to
   `/sign-in` carrying the attempted path in router state.
2. `RoleGuardLayout allow={["admin"]}` — requires `role === "admin"` in the
   auth store. It renders error screens rather than redirecting, on purpose:
   every available redirect target leads back into this guard.
3. `AdminLayout` — the sidebar and header shell that all admin pages sit in.

The client guards are user experience only. Every `/admin/*` request is
independently gated on the server by `requireAdmin`.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`router`](#constant-router) | Constant | `const router: Router$1` | Every route the app can reach. |

## Exports in detail

### `router` {#constant-router}

*Constant*

Every route the app can reach.

```ts
const router: Router$1
```

Public and unguarded: `/privacy`, `/terms` and `/delete-account`. The first
is the URL the Google Play Console requires, and `/terms` deliberately
renders the same `PrivacyPage` component. These must stay outside the guards.

`/` and `*` both redirect to `/admin`, which redirects again to
`/admin/grocery-lists`. In production Vercel rewrites every unmatched path to
`app.html`, but it checks the filesystem first, so `/` still serves the
static marketing homepage and never reaches this table.

Because `/` points at `/admin`, no guard may redirect to `/` to get rid of a
user — that bounces straight back. See the comments inside
`RoleGuardLayout`.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/router.tsx#L68)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/router.tsx)
