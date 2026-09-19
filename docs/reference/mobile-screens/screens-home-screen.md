# HomeScreen

The Home tab.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `mobile/src/screens/HomeScreen.tsx` |
| Group | [Mobile app — screens](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`HomeScreen`](#component-home-screen) | React component | `function HomeScreen(): Element` | The landing page: where the customer is in their list journey, then the shop's banners, categories and newest products. |

## Exports in detail

### `HomeScreen` {#component-home-screen}

*React component*

The landing page: where the customer is in their list journey, then the
shop's banners, categories and newest products.

```ts
function HomeScreen(): Element
```

Takes no props.

**Returns** `Element`

Loads the home payload on mount and asks for a fresh one on every focus.
That refresh is rate-limited to once a minute in the store and never blanks
the screen, so returning to the tab is cheap and a failed first load gets
another try. Signed in, it also reloads the customer's orders on focus,
because the shop moves them on — priced, packed, ready — while the customer
is elsewhere.

Reads `useCustomerHomeStore` for the page itself,
`useCustomerGroceryListStore` for the journey card's data, and
`useCustomerDisplayName`, which prefers the saved profile over the Clerk
account.

Fully usable signed out; nothing here is gated.

It opens no sheets or modals directly. Everything leads somewhere: the
avatar to Account, a category or "View all" or the search box to Shop, a
product to its details page. The journey card may open the list sheet, but
that is the card's own doing.

The whole page above the grid is the `ListHeaderComponent` of one
`FlatList`, so the screen is a single virtualized list with no nested
scroll views.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/screens/HomeScreen.tsx#L63)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/screens/HomeScreen.tsx)
