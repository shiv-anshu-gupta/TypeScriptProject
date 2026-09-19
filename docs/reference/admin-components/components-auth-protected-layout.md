# ProtectedLayout

Route guard: requires a signed-in Clerk session.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `client/src/components/auth/ProtectedLayout.tsx` |
| Group | [Admin panel — components](index.md) |
| Exports | 1 |

## Description

The outer of the two guards around `/admin/*`. It answers only "is there a
session?". Whether that session is allowed in is
`RoleGuardLayout`'s job.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`ProtectedLayout`](#component-protected-layout) | React component | `function ProtectedLayout(): Element` | Renders child routes only once Clerk reports a signed-in user. |

## Exports in detail

### `ProtectedLayout` {#component-protected-layout}

*React component*

Renders child routes only once Clerk reports a signed-in user.

```ts
function ProtectedLayout(): Element
```

Takes no props.

**Returns** `Element` &mdash; A loader, a redirect to `/sign-in`, or the matched child route.

There are two separate "still loading" conditions and both must be waited
for, otherwise the page flickers through a redirect:

- Clerk has not resolved the session yet (`!isLoaded`).
- Clerk says signed in, but `useBootstrapAuth` has not yet finished
  `POST /auth/sync` and `GET /auth/me`, so the store has no role to judge.

On no session it redirects to `/sign-in` and puts the attempted path and
query string in router state under `from`. Nothing currently reads that
value back — Clerk handles the post-sign-in landing — but it is preserved so
a deep link can be restored later.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/auth/ProtectedLayout.tsx#L34)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/auth/ProtectedLayout.tsx)
