# useAuthStore `store`

What this server knows about the signed-in customer, and how far startup has got.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/features/auth/store.ts` |
| Group | [Mobile app — features and state](index.md) |
| Exports | 1 |

## Description

This store is about the *account*, not the session. Clerk owns the session
and answers "is anybody signed in"; screens ask Clerk's `useAuth()` for
that. This store holds the record the sKirana server returned for them.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`useAuthStore`](#hook-use-auth-store) | Hook | `const useAuthStore: UseBoundStore<StoreApi<AuthStore>>` | Holds the signed-in customer's server-side account. |

## Exports in detail

### `useAuthStore` {#hook-use-auth-store}

*Hook*

Holds the signed-in customer's server-side account.

```ts
const useAuthStore: UseBoundStore<StoreApi<AuthStore>>
```

Holds `status`, `isBootstrapped`, `user` and `error`. Written only by
`useBootstrapAuth`, which runs once at the root of the app; no screen sets
it. Screens read `user` and `isBootstrapped`.

Nothing is persisted. The session is what survives a restart, in
SecureStore, and everything here is fetched again from it on the next
launch — so a signed-out customer cannot be left with the previous
customer's name in memory.

The invariant that matters at startup: `isBootstrapped` becomes `true` on
every finished outcome, including a failed `/auth/sync`. A screen waiting
on it will therefore never wait for ever; a screen that wants to know
whether the fetch *succeeded* must check `error` as well.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/auth/store.ts#L56)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/auth/store.ts)
