# useCustomerDisplayName `use-display-name`

What to call the customer.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/features/customer/account/use-display-name.ts` |
| Group | [Mobile app — features and state](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`useCustomerDisplayName`](#hook-use-customer-display-name) | Hook | `function useCustomerDisplayName(): string \| undefined` | The one rule for what to call the customer, shared by every screen that shows their name or initial so they can never disagree: the saved profile name (what the shop sees), then the sign-in name, then a generic label. |

## Exports in detail

### `useCustomerDisplayName` {#hook-use-customer-display-name}

*Hook*

The one rule for what to call the customer, shared by every screen that
shows their name or initial so they can never disagree: the saved profile
name (what the shop sees), then the sign-in name, then a generic label.
Undefined when signed out - there is nobody to name.

```ts
function useCustomerDisplayName(): string | undefined
```

**Returns** `string \| undefined` &mdash; The name, or `undefined` when signed out — which callers render as a sign-in prompt rather than as an empty name.

The order is deliberate. The saved profile name leads because that is what
the shopkeeper sees on the order, so the app should call the customer the
same thing.

The generic label is translated, so the result changes with the language
as well as with the profile. Callers take the first character for an
avatar initial; a name in Devanagari gives a Devanagari initial.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/account/use-display-name.ts#L30)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/account/use-display-name.ts)
