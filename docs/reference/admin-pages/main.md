# Main `main`

Browser entry point for the sKirana admin single-page app.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `client/src/main.tsx` |
| Group | [Admin panel — pages](index.md) |
| Exports | 0 |

## Description

This module is the script referenced by `client/app.html`, which is the SPA
shell. The other HTML entry, `client/index.html`, is a hand-written
zero-JavaScript marketing homepage and never loads this file.

It mounts three things around the app, in this order:

- `ClerkProvider` — authentication, deliberately outside the router so a
  Clerk session survives every navigation.
- `App` — which boots the auth store and renders the router.
- `Toaster` — the sonner toast host. Every `toast(...)` call anywhere in the
  app depends on this being mounted.

`VITE_CLERK_PUBLISHABLE_KEY` is read here. Vite substitutes
`import.meta.env.VITE_*` textually at build time, so the key becomes a
string literal in the bundle. Changing it in Vercel has no effect until the
client project is redeployed.

## Exports

This module exports nothing; it runs for its side effects.

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/main.tsx)
