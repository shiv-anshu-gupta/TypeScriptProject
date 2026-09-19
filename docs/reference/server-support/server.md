# Server `server`

The server entry point: connects to MongoDB, builds the Express app, mounts every router and starts listening.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/server.ts` |
| Group | [Server — utilities and middleware](index.md) |
| Exports | 0 |

## Description

Three mount points, and nothing else. There is no `/api` prefix and no
version prefix:

- `/auth` — the account routes; signed-in callers.
- `/customer` — eleven routers, all sharing this one prefix. The home and
  catalogue routers are public; the rest apply `requireAuth` to themselves.
- `/admin` — seven routers, every one guarded by `requireAdmin`.

Because the customer and admin routers share a prefix, a path is matched
against them in mount order, and the first router with a matching path
wins. Adding a path that already exists in an earlier router on the same
prefix would make the later one unreachable.

Two routes are defined here rather than in a router, `/health` and
`/app-version`, and both are public.

Middleware order matters and is fixed: CORS, then the JSON body parser,
then request logging, then Clerk. `clerkMiddleware` only reads the
`Authorization` header and attaches the auth state — it never rejects a
request, so an unauthenticated call reaches the route and is refused there.
`notFound` and `errorHandler` close the chain after every router.

The process exits with code 1 if `connectDB` rejects, so the server never
accepts traffic without a database. `utils/razorpay` also throws at import
time when its keys are missing, which stops the whole server rather than
just the payment routes.

## Exports

This module exports nothing; it runs for its side effects.

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/server.ts)
