# normalizeMobile `phone`

One way of writing a customer's mobile number.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/utils/phone.ts` |
| Group | [Server — utilities and middleware](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`normalizeMobile`](#function-normalize-mobile) | Function | `function normalizeMobile(raw: unknown): string` | Normalise an Indian mobile number to 10 digits (strips +91 / leading 0 / spaces). |

## Exports in detail

### `normalizeMobile` {#function-normalize-mobile}

*Function*

Normalise an Indian mobile number to 10 digits (strips +91 / leading 0 /
spaces). Returns "" if it isn't a valid mobile.

```ts
function normalizeMobile(raw: unknown): string
```

| Parameter | Type | Meaning |
|---|---|---|
| `raw` | `unknown` | — |

**Returns** `string` &mdash; The ten digits, or `""` when the input is not a valid mobile. The empty string is the only failure signal - nothing is thrown.

Every non-digit is dropped first, so the same number typed as
`+91 98765 43210`, `098765-43210` or `9876543210` all normalise to the same
ten digits - which is what lets the shop recognise a returning customer.

Valid means an Indian mobile: exactly ten digits starting 6, 7, 8 or 9.
Landlines and foreign numbers are rejected.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/phone.ts#L22)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/phone.ts)
