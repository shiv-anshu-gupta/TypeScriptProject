# GroceryList

The draft list as an inline block, for the Lists tab.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `mobile/src/components/GroceryList.tsx` |
| Group | [Mobile app — components](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`GroceryList`](#component-grocery-list) | React component | `function GroceryList(): Element` | The customer's unsent list shown inside a card, with the camera and Send beneath it and a note that the shop will send the price. |

## Exports in detail

### `GroceryList` {#component-grocery-list}

*React component*

The customer's unsent list shown inside a card, with the camera and Send
beneath it and a note that the shop will send the price.

```ts
function GroceryList(): Element
```

Takes no props.

**Returns** `Element`

The draft list as shown inline on the Lists tab: the written lines plus one
to continue on, with a full-width Send button under it. The list sheet uses
the same editor as a full page instead, with Send pinned in its header.

It holds no state of its own — it is three components arranged. The draft
comes from `useDraftListStore` through [`GroceryListEditor`](components-grocery-list-editor.md#component-grocery-list-editor), and the
whole send flow, including the phone prompt it may open, belongs to
[`SendListButton`](components-send-list-button.md#component-send-list-button).

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/GroceryList.tsx#L28)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/GroceryList.tsx)
