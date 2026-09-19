# Utils `utils`

Small formatting and class-name helpers with no home of their own.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/lib/utils.ts` |
| Group | [Mobile app — library](index.md) |
| Exports | 3 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`cn`](#function-cn) | Function | `function cn(...inputs: ClassValue[]): string` | Joins NativeWind class names, with later Tailwind classes winning. |
| [`formatPack`](#function-format-pack) | Function | `function formatPack(unit?: string, unitValue?: number): string` | A product's pack label: a 10 kg bag shows "10 kg", a loose/single item just shows its unit ("kg", "piece"). |
| [`formatPrice`](#function-format-price) | Function | `function formatPrice(val: number): string` | Formats an amount as Indian rupees, whole rupees only. |

## Exports in detail

### `cn` {#function-cn}

*Function*

Joins NativeWind class names, with later Tailwind classes winning.

```ts
function cn(...inputs: ClassValue[]): string
```

| Parameter | Type | Meaning |
|---|---|---|
| `...inputs` | `ClassValue[]` | — |

**Returns** `string`

`clsx` handles the conditional forms (arrays, objects, falsy values);
`tailwind-merge` then drops earlier classes from the same group, so a
component's default `px-4` can be overridden by a caller's `px-2` instead
of both being emitted and the outcome depending on class order.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/utils.ts#L19)

### `formatPack` {#function-format-pack}

*Function*

A product's pack label: a 10 kg bag shows "10 kg", a loose/single item just
shows its unit ("kg", "piece"). Keeps the customer from seeing "1 kg" when
the pack is actually 10 kg.

```ts
function formatPack(unit?: string, unitValue?: number): string
```

| Parameter | Type | Meaning |
|---|---|---|
| `unit?` | `string` | — |
| `unitValue?` | `number` | — |

**Returns** `string` &mdash; The label, or `""` when there is no unit — callers render that as nothing rather than as an empty badge.

A `unitValue` of 1 means "sold loose or singly", not "a one-unit pack", so
it is deliberately treated the same as a missing value.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/utils.ts#L51)

### `formatPrice` {#function-format-price}

*Function*

Formats an amount as Indian rupees, whole rupees only.

```ts
function formatPrice(val: number): string
```

| Parameter | Type | Meaning |
|---|---|---|
| `val` | `number` | — |

**Returns** `string`

Indian digit grouping (1,00,000 rather than 100,000) and no paise — the
shop prices in whole rupees, and a trailing `.00` on every line makes a
priced list harder to scan.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/utils.ts#L31)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/lib/utils.ts)
