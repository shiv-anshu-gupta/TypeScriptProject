# AdminGroceryLists `GroceryLists`

`/admin/grocery-lists` — the screen the shop works from all day.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `client/src/pages/admin/GroceryLists.tsx` |
| Group | [Admin panel — pages](index.md) |
| Exports | 1 |

## Description

This is the app's default landing page: `/admin` redirects straight here
rather than to the dashboard, because pricing and packing customer lists is
the shop's whole job. Everything else in the panel is occasional.

The page itself is thin. It renders three controls and a stack of cards, and
every piece of state belongs to `useAdminGroceryLists`.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`AdminGroceryLists`](#component-admin-grocery-lists) | React component | `function AdminGroceryLists(): Element` | Lists the shop's orders, with the three tools used to find one. |

## Exports in detail

### `AdminGroceryLists` {#component-admin-grocery-lists}

*React component · default export*

Lists the shop's orders, with the three tools used to find one.

```ts
function AdminGroceryLists(): Element
```

Takes no props.

**Returns** `Element` &mdash; The grocery-lists screen.

Layout is a header of controls above a stack of `GroceryListCard`s, one per
order. All state, polling and API work lives in `useAdminGroceryLists`; this
component only wires its values into the cards.

The three controls, in the order they are applied:

- **Status tabs** — Active, Completed, Cancelled, each with a count. Active
  is the five open statuses together, and it is the default, so completed and
  cancelled orders do not clutter the day's work. The counts are of all
  orders in that tab, not of what is currently on screen, so a tab can read
  6 while one card is shown.
- **The amount matcher** — the shopkeeper types the rupee figure they have
  just been sent on UPI, and the page narrows to unpaid orders totalling
  exactly that. This is how a payment is tied to an order before pressing
  Mark paid. The helper text underneath says how many matched; more than one
  means the transfer cannot be attributed from the amount alone.
- **Search** — by order code, customer name, phone or email.

They compose rather than replace one another, which is the usual cause of an
unexpectedly empty page: an amount left in the matcher keeps filtering while
the shopkeeper searches. The matcher offers a clear link; the tabs and search
do not.

New orders arrive on their own. The hook polls every 15 seconds and announces
anything new with a chime, a flashing tab title and a toast, so the page can
be left open on the counter.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/pages/admin/GroceryLists.tsx#L70)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/pages/admin/GroceryLists.tsx)
