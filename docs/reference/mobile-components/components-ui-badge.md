# Badge

The small rounded label used for stock, status and category chips.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `mobile/src/components/ui/Badge.tsx` |
| Group | [Mobile app — components](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`Badge`](#component-badge) | React component | `function Badge(props: BadgeProps): Element` | A pill-shaped label that sits beside content it describes, such as "In stock" on a product or a status word on an order card. |

## Exports in detail

### `Badge` {#component-badge}

*React component*

A pill-shaped label that sits beside content it describes, such as "In stock"
on a product or a status word on an order card.

```ts
function Badge(props: BadgeProps): Element
```

| Prop | Type | Meaning |
|---|---|---|
| `children` | `ReactNode` | Rendered inside a `Text`, so pass a string or number, not a view. |
| `className?` | `string` | — |
| `textClassName?` | `string` | — |

**Returns** `Element`

A presentation-only primitive: no state, no press handling. It is
`self-start`, so it shrinks to its text rather than filling the row. The two
class props exist because the caller styles the pill and its text separately
— `className` lands on the outer view, `textClassName` on the text inside it.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/ui/Badge.tsx#L29)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/ui/Badge.tsx)
