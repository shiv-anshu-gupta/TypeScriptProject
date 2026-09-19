# PriceCalculator `price-calculator`

The per-row calculator popover on the grocery-lists card.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `client/src/components/admin/grocery-lists/price-calculator.tsx` |
| Group | [Admin panel — components](index.md) |
| Exports | 1 |

## Description

Shop arithmetic is done in the row it belongs to rather than on a phone
beside the till. The result is written straight into that line's price.

The expression is evaluated by a small hand-written parser in this file, not
by `eval` or `Function`. Keep it that way - the string is built from the
on-screen pad, but evaluating user-shaped text with `eval` in a page that
holds an admin session is not a risk worth taking for four operators.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`PriceCalculator`](#component-price-calculator) | React component | `function PriceCalculator(props: PriceCalculatorProps): Element` | A popover calculator that writes its result into one line's price. |

## Exports in detail

### `PriceCalculator` {#component-price-calculator}

*React component · default export*

A popover calculator that writes its result into one line's price.

```ts
function PriceCalculator(props: PriceCalculatorProps): Element
```

| Prop | Type | Meaning |
|---|---|---|
| `onResult` | `(value: string) => void` | — |
| `quantity?` | `string` | — |

**Returns** `Element`

One of these sits on every priceable row of a grocery-list card.

Opening it seeds the expression from the row's quantity: a quantity of "9"
opens as `9×`, so typing 30 gives 270 for nine items at thirty rupees. The
seed is applied on each open, so reopening discards whatever was left from
last time.

The pad refuses to build an invalid expression rather than reporting one
afterwards: no leading operator, a trailing operator is replaced instead of
stacked, and only one decimal point per number. The running result is shown
live and is `null` until the expression resolves.

Confirming calls `onResult` with the formatted number and closes the
popover. That writes to the row's price **draft**, not to the server - the
shopkeeper still has to save prices afterwards.

The expression is local state and is not kept anywhere.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/admin/grocery-lists/price-calculator.tsx#L188)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/admin/grocery-lists/price-calculator.tsx)
