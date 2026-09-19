# tokenCache `token-cache`

Where Clerk keeps its session token on this device.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/lib/token-cache.ts` |
| Group | [Mobile app — library](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`tokenCache`](#constant-token-cache) | Constant | `const tokenCache: { getToken: (key: string) => Promise<string \| null>; saveToken: (key: string, value: string) => Promise<void> }` | Clerk token cache backed by Expo SecureStore so the session persists securely across app restarts. |

## Exports in detail

### `tokenCache` {#constant-token-cache}

*Constant*

Clerk token cache backed by Expo SecureStore so the session persists
securely across app restarts.

```ts
const tokenCache: { getToken: (key: string) => Promise<string | null>; saveToken: (key: string, value: string) => Promise<void> }
```

Passed to `ClerkProvider` at the root of the tree and used by nothing else.

Both accessors swallow their errors on purpose. SecureStore can fail on a
device with no screen lock or a damaged keystore, and a customer who cannot
cache a token should still be able to sign in for this session — so a read
failure reads as "no cached session" and a write failure is ignored. The
cost is that such a device signs in again after every restart.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/token-cache.ts#L22)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/token-cache.ts)
