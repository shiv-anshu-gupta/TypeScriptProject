# WishlistScreen

The saved products screen.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `mobile/src/screens/WishlistScreen.tsx` |
| Group | [Mobile app — screens](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`WishlistScreen`](#component-wishlist-screen) | React component | `function WishlistScreen(): Element` | The products the customer has hearted, as a list they can open or remove from. |

## Exports in detail

### `WishlistScreen` {#component-wishlist-screen}

*React component*

The products the customer has hearted, as a list they can open or remove
from.

```ts
function WishlistScreen(): Element
```

Takes no props.

**Returns** `Element`

Pushed from the Account tab's "Saved products" row. Reads
`useCustomerWishlistStore` and loads it on mount when signed in, not on
focus — this is a pushed screen, not a tab, so it is mounted fresh each
time.

Three states: a message when signed out, a message when empty, or the list.
Signed out it shows a message rather than the login, unlike the Lists and
Account tabs, because nothing here is worth signing in for on its own.

Removing is immediate, with no confirmation, since it is reversible from the
product page. It opens no sheets and reads nothing else.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/screens/WishlistScreen.tsx#L38)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/screens/WishlistScreen.tsx)
