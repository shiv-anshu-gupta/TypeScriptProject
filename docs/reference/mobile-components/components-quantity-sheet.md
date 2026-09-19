# QuantitySheet

The quantity picker sheet, and the single instance of it mounted at the app root.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `mobile/src/components/QuantitySheet.tsx` |
| Group | [Mobile app — components](index.md) |
| Exports | 2 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`QuantitySheet`](#component-quantity-sheet) | React component | `function QuantitySheet(props: QuantitySheetProps): Element` | A short sheet asking how much of one product the customer wants, with the exact wording the shop will receive shown underneath. |
| [`QuantitySheetHost`](#component-quantity-sheet-host) | React component | `function QuantitySheetHost(): Element` | The quantity picker the whole app shares, mounted once at the root. |

## Exports in detail

### `QuantitySheet` {#component-quantity-sheet}

*React component*

A short sheet asking how much of one product the customer wants, with the
exact wording the shop will receive shown underneath.

```ts
function QuantitySheet(props: QuantitySheetProps): Element
```

| Prop | Type | Meaning |
|---|---|---|
| `onClose` | `() => void` | — |
| `onConfirm` | `(quantity: string) => void` | Given the finished quantity as the shop will read it, for example `2 kg`, not the raw number. |
| `open` | `boolean` | — |
| `title` | `string` | — |
| `unit?` | `string` | The product's selling unit, such as `kg` or `pack`. It decides the step size, the bounds, the preset chips and whether the number is typed or stepped. |
| `unitValue?` | `number` | The pack size, for something sold in fixed packs. |

**Returns** `Element`

Bottom-sheet quantity picker opened from a product card's "+".

A controlled component: it holds only the number being picked, and resets
that to the product's sensible default each time it opens. It does not touch
the draft list — `onConfirm` receives the finished quantity string and the
caller decides what to do with it.

Screens should not mount this directly. [`QuantitySheetHost`](#component-quantity-sheet-host) is the one
instance, and a product card opens it through the store.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/QuantitySheet.tsx#L56)

### `QuantitySheetHost` {#component-quantity-sheet-host}

*React component*

The quantity picker the whole app shares, mounted once at the root.

```ts
function QuantitySheetHost(): Element
```

Takes no props.

**Returns** `Element`

The app's single quantity picker, mounted once at the root. Every product
card opens THIS one through the store, so a grid of cards carries no sheets
of its own.

The reason is cost: a sheet is not free even while closed — it measures the
window, reads the safe area, creates shared values and a gesture. Twenty of
those on a cheap phone is paid for at exactly the wrong moment, while the
customer scrolls.

It reads `useQuantitySheetStore` for the product being asked about, writes
the answer into the draft list with `addProductWithQuantity` — which sets
the quantity outright rather than adding to it — and toasts the result.

**See also**

- [`QuantitySheet`](#component-quantity-sheet) for the sheet itself.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/QuantitySheet.tsx#L143)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/QuantitySheet.tsx)
