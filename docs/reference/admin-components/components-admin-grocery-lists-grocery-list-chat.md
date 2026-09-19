# GroceryListChat `grocery-list-chat`

The chat thread between the shop and one customer about one order.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `client/src/components/admin/grocery-lists/grocery-list-chat.tsx` |
| Group | [Admin panel — components](index.md) |
| Exports | 1 |

## Description

Mounted twice over: collapsed at the bottom of every grocery-list card, and
expanded inside each row of the Messages page. Both use this same component,
so a change here affects both screens.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`GroceryListChat`](#component-grocery-list-chat) | React component | `function GroceryListChat(props: GroceryListChatProps): Element` | Shows and sends messages for one order. |

## Exports in detail

### `GroceryListChat` {#component-grocery-list-chat}

*React component · default export*

Shows and sends messages for one order.

```ts
function GroceryListChat(props: GroceryListChatProps): Element
```

| Prop | Type | Meaning |
|---|---|---|
| `customerName` | `string` | Shown in the empty state only. Falls back to "this customer" when blank. |
| `listId` | `string` | The order's `_id`; the thread is keyed to the order, not the customer. |
| `startOpen?` | `boolean` | Start expanded, and therefore start polling straight away. |

**Returns** `Element` &mdash; The chat toggle, and the thread when open.

Collapsed by default. Opening it loads the thread and starts a
`POLL_MS` poll; closing it clears the interval. Nothing polls while the
panel is shut, which is what keeps a page of a dozen cards cheap.

The poll refetches the entire thread each time — there is no incremental
fetch — so a long conversation is re-read every five seconds.

**Sending is the one optimistic action on this screen.** The input is cleared
before the request resolves, so the box feels immediate; if the send fails the
text is put back and a toast explains why. Nothing is queued and nothing is
retried, so a failed message is simply not sent. Enter sends, Shift+Enter
does not.

Scrolling is deliberately confined to the message box: the effect sets
`scrollTop` on the container rather than calling `scrollIntoView`. The
earlier version scrolled the whole admin page on every five-second poll,
which yanked the shopkeeper's position around while they were pricing. Do not
reintroduce `scrollIntoView` here.

A failed poll is caught and ignored, so an open conversation is never blanked
by a momentary network problem — and equally, an outage shows no error.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/admin/grocery-lists/grocery-list-chat.tsx#L101)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/admin/grocery-lists/grocery-list-chat.tsx)
