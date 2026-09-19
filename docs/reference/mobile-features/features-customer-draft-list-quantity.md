# Quantity `quantity`

Turning a product's unit and a chosen amount into the quantity string the shopkeeper reads.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/features/customer/draft-list/quantity.ts` |
| Group | [Mobile app — features and state](index.md) |
| Exports | 8 |

## Description

Pure functions, no React and no store, so the quantity picker and the
product details screen can share every rule. What they produce is free
text: the shop reads it, nothing parses it back.

`unitValue` means the pack size. A value of 1, or none at all, means the
product is sold loose or singly — it is not "a pack of one".

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`buildQuantityString`](#function-build-quantity-string) | Function | `function buildQuantityString( … ): string` | The final string stored on the draft row / sent to the shop. |
| [`defaultQuantityValue`](#function-default-quantity-value) | Function | `function defaultQuantityValue(unit?: string, unitValue?: number): number` | What the picker starts at when it opens. |
| [`isCountableUnit`](#function-is-countable-unit) | Function | `function isCountableUnit(unit?: string, unitValue?: number): boolean` | Whether this product is ordered in whole units rather than by amount. |
| [`maxFor`](#function-max-for) | Function | `function maxFor(unit?: string, unitValue?: number): number` | The most one line may ask for, in the product's OWN unit. |
| [`minFor`](#function-min-for) | Function | `function minFor(unit?: string, unitValue?: number): number` | The smallest amount a line may ask for, in the product's own unit. |
| [`quickChips`](#function-quick-chips) | Function | `function quickChips(unit?: string): number[]` | Quick-tap presets, expressed in the product's own unit so the resulting quantity string stays unambiguous. |
| [`roundValue`](#function-round-value) | Function | `function roundValue(n: number): number` | Rounds to two decimal places. |
| [`stepFor`](#function-step-for) | Function | `function stepFor(unit?: string): number` | How much one tap of + or − moves the amount. |

## Exports in detail

### `buildQuantityString` {#function-build-quantity-string}

*Function*

The final string stored on the draft row / sent to the shop.

```ts
function buildQuantityString(
  unit: string | undefined,
  unitValue: number | undefined,
  value: number,
): string
```

| Parameter | Type | Meaning |
|---|---|---|
| `unit` | `string \| undefined` | — |
| `unitValue` | `number \| undefined` | — |
| `value` | `number` | — |

**Returns** `string` &mdash; Free text. Nothing parses it back — the one thing that reads a quantity again is `addProduct`'s "+1" bump, and that deliberately only touches a leading integer.

The one place a quantity becomes words, so the shop always reads the same
shapes: `"2 × 10 kg"` for packs, `"3 pieces"` / `"1 dozen"` / `"2 packs"`
for counts, and `"2.5 kg"` for loose amounts. English plurals are written
out rather than translated, because this string is for the shopkeeper's
order list, not for the customer's screen.

A countable product's value is rounded and floored at 1, so no line can ask
for half a piece or none at all.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/draft-list/quantity.ts#L159)

### `defaultQuantityValue` {#function-default-quantity-value}

*Function*

What the picker starts at when it opens.

```ts
function defaultQuantityValue(unit?: string, unitValue?: number): number
```

| Parameter | Type | Meaning |
|---|---|---|
| `unit?` | `string` | — |
| `unitValue?` | `number` | — |

**Returns** `number`

250 for grams and millilitres, because 1 g is never what anybody wants;
1 for everything else.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/draft-list/quantity.ts#L48)

### `isCountableUnit` {#function-is-countable-unit}

*Function*

Whether this product is ordered in whole units rather than by amount.

```ts
function isCountableUnit(unit?: string, unitValue?: number): boolean
```

| Parameter | Type | Meaning |
|---|---|---|
| `unit?` | `string` | — |
| `unitValue?` | `number` | — |

**Returns** `boolean`

The question behind every other function here: countable products get a
whole-number count ("3 pieces"), loose ones get an amount ("2.5 kg").

A product with no unit at all counts as countable, so an item the shop
never gave a unit still gets a sensible "1 piece" rather than a bare
number.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/draft-list/quantity.ts#L34)

### `maxFor` {#function-max-for}

*Function*

The most one line may ask for, in the product's OWN unit. One ceiling of
100 used to apply to everything, which made grams unusable: a customer
could never order more than 100 g, and the 250 g / 500 g presets silently
became 100 g.

```ts
function maxFor(unit?: string, unitValue?: number): number
```

| Parameter | Type | Meaning |
|---|---|---|
| `unit?` | `string` | — |
| `unitValue?` | `number` | — |

**Returns** `number`

The ceiling is a guard against a slip of the finger, not a stock rule — the
shop decides what it can actually supply when it prices the list.

It applies only to the picker. A customer typing a line by hand can write
whatever they like, because the paper takes free text.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/draft-list/quantity.ts#L120)

### `minFor` {#function-min-for}

*Function*

The smallest amount a line may ask for, in the product's own unit.

```ts
function minFor(unit?: string, unitValue?: number): number
```

| Parameter | Type | Meaning |
|---|---|---|
| `unit?` | `string` | — |
| `unitValue?` | `number` | — |

**Returns** `number`

One step, so the minimum is always reachable by stepping down and the
picker never stops at a value it cannot show.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/draft-list/quantity.ts#L76)

### `quickChips` {#function-quick-chips}

*Function*

Quick-tap presets, expressed in the product's own unit so the resulting
quantity string stays unambiguous.

```ts
function quickChips(unit?: string): number[]
```

| Parameter | Type | Meaning |
|---|---|---|
| `unit?` | `string` | — |

**Returns** `number[]`

Every preset is within [`maxFor`](#function-max-for) for its unit, so tapping one can
never be silently clamped.

Countable units fall through to the kg presets, which the picker does not
show — it offers whole counts instead.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/draft-list/quantity.ts#L93)

### `roundValue` {#function-round-value}

*Function*

Rounds to two decimal places.

```ts
function roundValue(n: number): number
```

| Parameter | Type | Meaning |
|---|---|---|
| `n` | `number` | — |

**Returns** `number`

Stepping by 0.5 accumulates binary floating-point error, and "2.4000000001
kg" on a shop's order list reads as a bug. Two places is enough for every
unit in use.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/draft-list/quantity.ts#L134)

### `stepFor` {#function-step-for}

*Function*

How much one tap of + or − moves the amount.

```ts
function stepFor(unit?: string): number
```

| Parameter | Type | Meaning |
|---|---|---|
| `unit?` | `string` | — |

**Returns** `number`

Only meaningful for loose units — countable products step by a whole 1,
which the picker applies itself.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/draft-list/quantity.ts#L64)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/draft-list/quantity.ts)
