# razorpay

The shared Razorpay client and the unit conversion its API expects.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/utils/razorpay.ts` |
| Group | [Server — utilities and middleware](index.md) |
| Exports | 2 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`razorpay`](#constant-razorpay) | Constant | `const razorpay: Razorpay` | The process-wide Razorpay client, used to create and verify payment orders. |
| [`toSubUnits`](#function-to-sub-units) | Function | `function toSubUnits(amount: number): number` | Converts rupees to the paise that Razorpay's API takes. |

## Exports in detail

### `razorpay` {#constant-razorpay}

*Constant*

The process-wide Razorpay client, used to create and verify payment orders.

```ts
const razorpay: Razorpay
```

Built at import time from `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`; if
either is missing the import throws and the server does not start. The
secret stays on the server - only the key id is ever sent to a client.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/razorpay.ts#L33)

### `toSubUnits` {#function-to-sub-units}

*Function*

Converts rupees to the paise that Razorpay's API takes.

```ts
function toSubUnits(amount: number): number
```

| Parameter | Type | Meaning |
|---|---|---|
| `amount` | `number` | the total in rupees. |

**Returns** `number` &mdash; The same amount in paise, as a whole number.

Razorpay works entirely in the smallest currency unit, so every amount
stored here in rupees must be multiplied by 100 before it is sent. Rounded,
not truncated, so a total that ends up as a fraction of a paisa through
a percentage discount does not quietly lose money.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/razorpay.ts#L50)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/razorpay.ts)
