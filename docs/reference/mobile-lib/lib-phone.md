# Phone `phone`

What counts as a valid Indian mobile number, for the whole app.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/lib/phone.ts` |
| Group | [Mobile app — library](index.md) |
| Exports | 2 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`isValidMobile`](#function-is-valid-mobile) | Function | `function isValidMobile(raw: string): boolean` | Whether a typed number is one the server will accept. |
| [`normalizeMobile`](#function-normalize-mobile) | Function | `function normalizeMobile(raw: string): string` | Reduces a typed number to the bare 10 digits the shop stores. |

## Exports in detail

### `isValidMobile` {#function-is-valid-mobile}

*Function*

Whether a typed number is one the server will accept.

```ts
function isValidMobile(raw: string): boolean
```

| Parameter | Type | Meaning |
|---|---|---|
| `raw` | `string` | — |

**Returns** `boolean`

True only for 10 digits beginning 6, 7, 8 or 9, after normalising. Used to
gate the phone prompt shown on a first send, and to validate the optional
phone field on the profile sheet — where an empty value is allowed but a
typed one must pass.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/phone.ts#L42)

### `normalizeMobile` {#function-normalize-mobile}

*Function*

Reduces a typed number to the bare 10 digits the shop stores.

```ts
function normalizeMobile(raw: string): string
```

| Parameter | Type | Meaning |
|---|---|---|
| `raw` | `string` | — |

**Returns** `string` &mdash; The digits alone — not necessarily a valid number. Pair it with [`isValidMobile`](#function-is-valid-mobile) before sending anything.

Indian mobile numbers, the one place the app agrees on what a valid one is.
10 digits starting 6-9, after stripping +91 or a leading 0. Mirrors the
server's normalizeMobile so the app never offers to send what it will
reject.

Everything that is not a digit is dropped first, so spaces, hyphens and
brackets are all accepted as the customer types them. A `+91` prefix is
removed only when the result is exactly 12 digits, and a leading `0` only
at 11, so a number that is simply mistyped is left alone rather than
quietly truncated into a different one.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/phone.ts#L25)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/phone.ts)
