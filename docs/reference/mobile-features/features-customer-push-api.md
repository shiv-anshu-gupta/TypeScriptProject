# Push api `api`

Registering and un-registering this device for order alerts.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/features/customer/push/api.ts` |
| Group | [Mobile app — features and state](index.md) |
| Exports | 2 |

## Description

Both need a bearer token, and both pair the token with the *signed-in
customer* — which is why removal has to happen before the session ends, not
after.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`removePushToken`](#function-remove-push-token) | Function | `function removePushToken(token: string): Promise<{ registered: boolean }>` | `DELETE /customer/push-token` — stops this device getting the signed-in customer's alerts. |
| [`savePushToken`](#function-save-push-token) | Function | `function savePushToken(token: string): Promise<{ registered: boolean }>` | `POST /customer/push-token` — sends this device's Expo token to the server. |

## Exports in detail

### `removePushToken` {#function-remove-push-token}

*Function*

`DELETE /customer/push-token` — stops this device getting the signed-in
customer's alerts.

```ts
function removePushToken(token: string): Promise<{ registered: boolean }>
```

| Parameter | Type | Meaning |
|---|---|---|
| `token` | `string` | — |

**Returns** `Promise<{ … }>` &mdash; `{ registered }`.

**Throws**

- Error When the request fails; sign-out must proceed anyway.

The token goes in the request **body**, not the URL, which is why it is
passed through the axios config's `data`.

Must be called while the session is still alive. Afterwards there is no
token to authorise it with and the device keeps receiving the previous
customer's alerts.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/push/api.ts#L46)

### `savePushToken` {#function-save-push-token}

*Function*

`POST /customer/push-token` — sends this device's Expo token to the server.

```ts
function savePushToken(token: string): Promise<{ registered: boolean }>
```

| Parameter | Type | Meaning |
|---|---|---|
| `token` | `string` | — |

**Returns** `Promise<{ … }>` &mdash; `{ registered }`.

**Throws**

- Error When signed out, or the request fails. The caller logs it and carries on — a customer can do nothing about a failure here.

Safe to repeat: the server stores one token per device per customer.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/push/api.ts#L24)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/push/api.ts)
