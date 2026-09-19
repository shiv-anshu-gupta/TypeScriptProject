# PublicOnlyLayout

Route guard for the sign-in and sign-up pages: keeps signed-in users out.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `client/src/components/auth/PublicOnlyLayout.tsx` |
| Group | [Admin panel — components](index.md) |
| Exports | 1 |

## Description

Wraps `/sign-in/*` and `/sign-up/*` only.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`PublicOnlyLayout`](#component-public-only-layout) | React component | `function PublicOnlyLayout(): Element` | Sends an already signed-in user away from the sign-in page. |

## Exports in detail

### `PublicOnlyLayout` {#component-public-only-layout}

*React component*

Sends an already signed-in user away from the sign-in page.

```ts
function PublicOnlyLayout(): Element
```

Takes no props.

**Returns** `Element` &mdash; A loader, a redirect to `/`, or the matched child route.

Two defects are worth knowing about before anyone reads this guard as
written. Neither is currently harmful, because `ProtectedLayout` catches the
cases that matter, but both mean the guard does less than it appears to:

- The `!isLoaded` branch is a bare expression statement. Nothing is
  returned, so it has no effect and the function falls through.
- The pathname comparison for sign-up is missing its leading slash, so it
  never matches. A signed-in user landing on `/sign-up` is not redirected
  away.

The redirect target is `/`, which the router turns into `/admin`.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/auth/PublicOnlyLayout.tsx#L32)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/auth/PublicOnlyLayout.tsx)
