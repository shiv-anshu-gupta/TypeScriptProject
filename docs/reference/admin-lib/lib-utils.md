# Utils `utils`

Two small helpers used throughout the app.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `client/src/lib/utils.ts` |
| Group | [Admin panel — library](index.md) |
| Exports | 2 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`cn`](#function-cn) | Function | `function cn(...inputs: ClassValue[]): string` | Joins class names and resolves conflicting Tailwind utilities. |
| [`formatPrice`](#function-format-price) | Function | `function formatPrice(val: number): string` | Formats a number as Indian rupees with no paise. |

## Exports in detail

### `cn` {#function-cn}

*Function*

Joins class names and resolves conflicting Tailwind utilities.

```ts
function cn(...inputs: ClassValue[]): string
```

| Parameter | Type | Meaning |
|---|---|---|
| `...inputs` | `ClassValue[]` | Class names, conditionals, arrays or objects. |

**Returns** `string` &mdash; One de-duplicated class string.

The standard shadcn helper. `clsx` flattens conditionals and arrays;
`twMerge` then makes the last conflicting utility win, so a caller's
`className` can override a component's default padding or colour rather than
fighting it on specificity.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/lib/utils.ts#L21)

### `formatPrice` {#function-format-price}

*Function*

Formats a number as Indian rupees with no paise.

```ts
function formatPrice(val: number): string
```

| Parameter | Type | Meaning |
|---|---|---|
| `val` | `number` | An amount in rupees. |

**Returns** `string` &mdash; The formatted string, including the ₹ symbol.

`en-IN` grouping, so 125000 renders as ₹1,25,000 — lakh-style, not
thousands-style. `maximumFractionDigits: 0` rounds for display only; it does
not change the stored value, and the shop prices in whole rupees anyway.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/lib/utils.ts#L36)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/lib/utils.ts)
