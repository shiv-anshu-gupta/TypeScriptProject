# Registry `registry`

Remembering which push token this device handed over, outside React.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/features/customer/push/registry.ts` |
| Group | [Mobile app — features and state](index.md) |
| Exports | 3 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`registeredPushToken`](#function-registered-push-token) | Function | `function registeredPushToken(): string \| null` | The token this device is registered under, or `null`. |
| [`releasePushToken`](#function-release-push-token) | Function | `function releasePushToken(): Promise<void>` | Hands the device's token back to the server and forgets it. |
| [`rememberPushToken`](#function-remember-push-token) | Function | `function rememberPushToken(token: string \| null): void` | Records that this device is registered under `token`. |

## Exports in detail

### `registeredPushToken` {#function-registered-push-token}

*Function*

The token this device is registered under, or `null`.

```ts
function registeredPushToken(): string | null
```

**Returns** `string \| null`

Used as the "already done" check by the registration effect, so a
re-render does not ask the operating system for a token again.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/push/registry.ts#L42)

### `releasePushToken` {#function-release-push-token}

*Function*

Hands the device's token back to the server and forgets it.

```ts
function releasePushToken(): Promise<void>
```

**Returns** `Promise<void>`

Best effort: called just before signing out. A failure here must never stop
the customer from signing out.

It must be awaited before `signOut()`, because the server needs the
customer's own token to authorise the removal.

The local record is cleared first, so the next customer on this phone
registers their own token even if the network call fails.

Never throws, and does nothing when there is no token.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/push/registry.ts#L61)

### `rememberPushToken` {#function-remember-push-token}

*Function*

Records that this device is registered under `token`.

```ts
function rememberPushToken(token: string | null): void
```

| Parameter | Type | Meaning |
|---|---|---|
| `token` | `string \| null` | — |

Call it only **after** the server has accepted the token. Recording one
that never arrived would make the registration effect skip itself for the
rest of the session.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/push/registry.ts#L31)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/push/registry.ts)
