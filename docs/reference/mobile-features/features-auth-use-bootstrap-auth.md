# useBootstrapAuth

The startup effect that connects Clerk to the rest of the app.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/features/auth/useBootstrapAuth.ts` |
| Group | [Mobile app — features and state](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`useBootstrapAuth`](#hook-use-bootstrap-auth) | Hook | `function useBootstrapAuth(): void` | Wires Clerk's token into the api client, then loads the customer's account. |

## Exports in detail

### `useBootstrapAuth` {#hook-use-bootstrap-auth}

*Hook*

Wires Clerk's token into the api client, then loads the customer's account.

```ts
function useBootstrapAuth(): void
```

Call it exactly once, from the app root. Two effects, in this order and for
a reason:

First it installs Clerk's `getToken` as the api client's token getter. That
happens regardless of whether anybody is signed in, and before any screen
has had a chance to fetch — until it runs, every request goes out
unauthenticated.

Then, once Clerk has loaded, it either fetches the account through
`/auth/sync` or clears the store. Before `isLoaded` it does nothing at all:
nothing is cleared and nothing is fetched, because Clerk reports a session
it has not finished restoring as signed out, and acting on that would sign
the customer out on every cold start.

A failed sync is recorded as an error and still marks the app
bootstrapped, so a server that is down leaves the app usable rather than
stuck on a spinner.

Renders nothing and returns nothing; it is mounted through a component
that returns `null`.

**See also**

- - [`setApiTokenGetter`](../mobile-lib/lib-api.md#function-set-api-token-getter)  - [`useAuthStore`](features-auth-store.md#hook-use-auth-store)

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/auth/useBootstrapAuth.ts#L41)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/auth/useBootstrapAuth.ts)
