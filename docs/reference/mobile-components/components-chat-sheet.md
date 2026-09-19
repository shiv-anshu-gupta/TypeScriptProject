# ChatSheet

The per-order conversation with the shop.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `mobile/src/components/ChatSheet.tsx` |
| Group | [Mobile app — components](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`ChatSheet`](#component-chat-sheet) | React component | `function ChatSheet(props: ChatSheetProps): Element` | A conversation with the shop about one order, opened from that order's card. |

## Exports in detail

### `ChatSheet` {#component-chat-sheet}

*React component*

A conversation with the shop about one order, opened from that order's card.

```ts
function ChatSheet(props: ChatSheetProps): Element
```

| Prop | Type | Meaning |
|---|---|---|
| `code` | `string` | The order's short code, shown in the header only. |
| `listId` | `string` | The order being discussed. Changing it re-binds the poll. |
| `onClose` | `() => void` | — |
| `open` | `boolean` | — |

**Returns** `Element`

A chat tied to one order, in a sheet over the Lists screen, so the customer
never leaves the page. Pull it down to close; the composer rides above the
keyboard.

It owns its messages rather than reading a store, and polls the server every
few seconds — but only while it is open. Closing stops the timer, and
reopening starts from an empty list and a fresh load, so nothing runs in the
background for an order nobody is looking at. A poll that fails is ignored
rather than shown, and an unchanged reply is discarded rather than replacing
the array, so the bubbles do not re-render on every tick.

Sending is optimistic: the bubble appears at once and is rolled back, with
the text put back in the box, if the server refuses it.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/ChatSheet.tsx#L98)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/components/ChatSheet.tsx)
