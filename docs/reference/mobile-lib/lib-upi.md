# Upi `upi`

Paying the shop over UPI, with no gateway and no SDK: build a deep link and hand it to whichever UPI app the customer has.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/lib/upi.ts` |
| Group | [Mobile app — library](index.md) |
| Exports | 2 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`buildUpiUrl`](#function-build-upi-url) | Function | `function buildUpiUrl( … ): string` | Builds a standard UPI deep link. |
| [`openUpiPayment`](#function-open-upi-payment) | Function | `function openUpiPayment(url: string): Promise<boolean>` | Hands the deep link to the operating system. |

## Exports in detail

### `buildUpiUrl` {#function-build-upi-url}

*Function*

Builds a standard UPI deep link. Opening it lets the customer pick any
installed UPI app (GPay / PhonePe / Paytm / bank app) with the amount and
note pre-filled. No SDK, no gateway — the money goes straight to the shop.

```ts
function buildUpiUrl(
  params: { upiId: string; payeeName: string; amount: number; note: string },
): string
```

| Parameter | Type | Meaning |
|---|---|---|
| `params` | `{ upiId: string; payeeName: string; amount: number; note: string }` | `upiId` is the shop's VPA and `payeeName` the name shown in the UPI app; `note` becomes the transaction note, and carries the order code so the shopkeeper can match the payment. |

Fields of `params`:

| Field | Type | Meaning |
|---|---|---|
| `amount` | `number` | — |
| `note` | `string` | — |
| `payeeName` | `string` | — |
| `upiId` | `string` | — |

**Returns** `string` &mdash; A `upi://pay?...` URL for [`openUpiPayment`](#function-open-upi-payment).

Because there is no gateway there is also no callback: nothing tells the
app whether the money moved. The shopkeeper marks the order paid once it
lands in their own UPI app.

A negative or unparseable amount becomes `0.00` rather than throwing, so a
malformed total cannot crash the pay button — the customer's UPI app
refuses it instead.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/upi.ts#L29)

### `openUpiPayment` {#function-open-upi-payment}

*Function*

Hands the deep link to the operating system.

```ts
function openUpiPayment(url: string): Promise<boolean>
```

| Parameter | Type | Meaning |
|---|---|---|
| `url` | `string` | — |

**Returns** `Promise<boolean>`

Returns false only when the launch actually fails (no UPI app installed).

NOTE: we intentionally do NOT gate on Linking.canOpenURL(). On Android 11+
canOpenURL returns false for the "upi" scheme unless it's declared in the
manifest's `<queries>` — a false negative even when GPay/PhonePe ARE
installed. openURL launches the intent regardless and throws only if
nothing handles it.

True means an app opened, not that anything was paid. Never throws.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/upi.ts#L64)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/upi.ts)
