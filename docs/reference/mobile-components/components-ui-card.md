# Card

The bordered panel every grouped block of content sits in.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `mobile/src/components/ui/Card.tsx` |
| Group | [Mobile app — components](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`Card`](#component-card) | React component | `function Card(props: CardProps): Element` | A rounded, bordered surface that groups related content — an order, a settings block, a product tile. |

## Exports in detail

### `Card` {#component-card}

*React component*

A rounded, bordered surface that groups related content — an order, a
settings block, a product tile.

```ts
function Card(props: CardProps): Element
```

| Prop | Type | Meaning |
|---|---|---|
| `children` | `ReactNode` | — |
| `className?` | `string` | — |

**Returns** `Element`

`overflow-hidden` is part of the contract: a child image may run to the edge
and still be clipped to the rounded corner. It adds no padding, so the
caller decides the inner spacing.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/ui/Card.tsx#L25)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/ui/Card.tsx)
