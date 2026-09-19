# GroceryListCard `grocery-list-card`

One customer order, and everything the shop does to it.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `client/src/components/admin/grocery-lists/grocery-list-card.tsx` |
| Group | [Admin panel — components](index.md) |
| Exports | 1 |

## Description

The busiest component in the app. A card carries the whole life of an order:
pricing it, marking items out of stock, correcting or adding items, ticking
items off while packing, moving it along the status flow, recording payment,
chatting to the customer, and sharing the priced list over WhatsApp.

Four things are worth reading before changing anything here.

**Prices are drafts.** The price and rate boxes are fed from the parent hook
and nothing reaches the server until "Send prices to customer" is pressed.
Availability, item edits and status steps are the opposite - they apply
immediately.

**The status flow is one-way.** Only the immediate next step is clickable;
earlier steps show as ticks and later ones are disabled. This replaced
buttons that looked like toggles and were misread. See `STATUS_FLOW`.

**The packing checklist never leaves this browser.** It lives in
`localStorage`, so it is invisible on any other device and to the customer.
See [`GroceryListCard`](#component-grocery-list-card) for the consequences.

**The Hindi and English toggle is best-effort.** It calls a third-party
translation endpoint per item name and falls back silently to the original
text, so it can simply show nothing extra.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`GroceryListCard`](#component-grocery-list-card) | React component | `function GroceryListCard(props: GroceryListCardProps): Element` | Renders one order with every action the shop can take on it. |

## Exports in detail

### `GroceryListCard` {#component-grocery-list-card}

*React component · default export*

Renders one order with every action the shop can take on it.

```ts
function GroceryListCard(props: GroceryListCardProps): Element
```

| Prop | Type | Meaning |
|---|---|---|
| `available` | `boolean) => void` | — |
| `draft` | `string[]` | — |
| `draftTotal` | `number` | — |
| `list` | `AdminGroceryList` | — |
| `name` | `string` | — |
| `onAddItem` | `(name: string` | — |
| `onChangeStatus` | `(status: UpdateGroceryListStatusBody["status"]) => void` | — |
| `onEditItem` | `(index: number` | — |
| `onMarkPaid` | `() => void` | — |
| `onPriceChange` | `(index: number, value: string) => void` | — |
| `onRateChange` | `(index: number` | — |
| `onSavePrices` | `() => void` | — |
| `onToggleAvailable` | `(index: number` | — |
| `quantity` | `string) => void` | — |
| `quantity` | `string) => void` | — |
| `rate` | `string[]` | — |
| `saving` | `boolean` | — |
| `value` | `string) => void` | — |

**Returns** `Element` &mdash; The card for one order.

**Header.** Order code and customer name, the phone as a `tel:` link so it
can be dialled with one tap, the item count, and the `updatedAt ?? createdAt`
timestamp - with a separate "first sent" line when the order was edited on a
later day. On the right: the status badge, a payment badge once the list is
priced, and Share.

**Pricing.** Each row has a rate box and a total box. Typing a rate fills the
total in as `round(rate x leading number of the quantity)`, treating a
quantity with no leading number as 1; the total can also be typed directly.
Each row also has a calculator popover, seeded from the quantity. Everything
typed is a draft held by the parent hook, which is why the 15-second poll
does not disturb half-entered prices - and why a reload loses them. The total
shown at the foot of the card is the sum of the drafts, not the server's
figure, so the two differ until prices are saved.

**Availability.** "Out of stock" and "Restore" apply immediately, with no
save step. An unavailable row hides its price boxes; the server forces that
line to zero and pushes the customer - but only when marking unavailable, not
when restoring.

**Adding and editing items.** The shop can append an item the customer asked
for later, and correct an existing name or quantity inline. Both are stripped
by `stripSpecials` and need at least `MIN_NAME_LEN` characters.
Adding an item discards this list's price drafts, because the row count
changes; editing one does not.

**Packing checklist.** Each row has a tick box, ticked items are struck
through, and a counter shows progress. This is stored under
`grocery-packed:<listId>` in `localStorage` and is **never sent to the
server**. So it shows as nothing packed on a second device or browser, two
staff packing the same order see different checklists, a storage failure is
swallowed and the tick just stops persisting, and the keys are never cleaned
up. Moving it to the server would need a new field on the item type.

**Hindi and English toggle.** Fetches both forms of every item name and shows
them after the original, which always stays visible. Translation is
best-effort through a third-party endpoint, cached in memory only, and falls
back to the original text on any failure - so the toggle can appear to do
nothing. When it is on, Share sends the translated names too.

**Status flow.** The primary button reads "Send prices to customer" before
pricing and "Update prices" after, judged by `totalAmount > 0`. Beware that
pressing "Update prices" on a list already at `packed` or `ready` drags it
back to `priced` and re-notifies the customer, because the server hard-sets
the status. "Mark as paid" appears only while priced and unpaid. "Cancel
order" is available at any open stage, including an unpriced one. Once
completed or cancelled the card is closed: pricing, item changes and the flow
are all disabled.

**Chat.** A collapsed `GroceryListChat` sits at the foot of every card. It
polls only while open.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/admin/grocery-lists/grocery-list-card.tsx#L259)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/admin/grocery-lists/grocery-list-card.tsx)
