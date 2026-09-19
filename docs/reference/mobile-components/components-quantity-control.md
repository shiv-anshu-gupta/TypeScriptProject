# QuantityControl

The unit-aware quantity stepper.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `mobile/src/components/QuantityControl.tsx` |
| Group | [Mobile app — components](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`QuantityControl`](#component-quantity-control) | React component | `function QuantityControl(props: QuantityControlProps): Element` | A minus/plus stepper with preset chips, showing the customer the exact quantity the shop will be sent. |

## Exports in detail

### `QuantityControl` {#component-quantity-control}

*React component*

A minus/plus stepper with preset chips, showing the customer the exact
quantity the shop will be sent.

```ts
function QuantityControl(props: QuantityControlProps): Element
```

| Prop | Type | Meaning |
|---|---|---|
| `onChange` | `(value: number) => void` | — |
| `unit?` | `string` | The product's selling unit. See the remarks — this is not decoration, it selects the whole interaction. |
| `unitValue?` | `number` | The pack size, for something sold in fixed packs. |
| `value` | `number` | The number in the product's own unit, not a count of packs. |

**Returns** `Element`

A unit-aware quantity picker shared by the card sheet and the details screen.

The unit decides everything about how it behaves. Something countable steps
whole units and shows a plain number; something loose steps in its own
increments, offers preset chips and lets the number be typed. Bounds come
from the same unit helpers, and the stepper button that would go past a
limit is disabled rather than hidden.

Controlled: it owns only the text being typed, and keeps that in step with
`value` so the box, the preview and what Add sends can never disagree.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/QuantityControl.tsx#L50)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/QuantityControl.tsx)
