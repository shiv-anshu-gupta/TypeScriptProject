# useAuthStore `store`

The single source of truth for who is signed in and what they may do.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `client/src/features/auth/store.ts` |
| Group | [Admin panel — features and hooks](index.md) |
| Exports | 1 |

## Description

Written only by `useBootstrapAuth`; read by every route guard. Nothing
else should set it.

It is plain in-memory zustand with no persistence, so a page reload starts
from `idle` and the bootstrap runs again.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`useAuthStore`](#hook-use-auth-store) | Hook | `const useAuthStore: UseBoundStore<StoreApi<AuthStore>>` | Hook and store holding the signed-in user and the bootstrap's progress. |

## Exports in detail

### `useAuthStore` {#hook-use-auth-store}

*Hook*

Hook and store holding the signed-in user and the bootstrap's progress.

```ts
const useAuthStore: UseBoundStore<StoreApi<AuthStore>>
```

Guards must wait for `isBootstrapped` before acting on `user`. Reading
`user === null` too early looks identical to being signed out and will
redirect a signed-in admin to the sign-in page.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/auth/store.ts#L79)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/auth/store.ts)
