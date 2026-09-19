# ShopScreen

The Shop tab: the catalogue.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `mobile/src/screens/ShopScreen.tsx` |
| Group | [Mobile app — screens](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`ShopScreen`](#component-shop-screen) | React component | `function ShopScreen(): Element` | The catalogue: a category rail down the left and a two-column product grid, with a search box and a bar offering to send the list once it has items. |

## Exports in detail

### `ShopScreen` {#component-shop-screen}

*React component*

The catalogue: a category rail down the left and a two-column product grid,
with a search box and a bar offering to send the list once it has items.

```ts
function ShopScreen(): Element
```

Takes no props.

**Returns** `Element`

Everything is loaded by `useCustomerProductList`, a hook rather than a
store: it fetches the categories once and re-fetches products whenever the
category, sort or search changes, with the search debounced. The only store
this screen reads is the draft list, for the count on the sticky bar.

Fully usable signed out, and it opens no sheets or modals. A product goes to
its details page; the sticky bar goes to the Lists tab, where Send is.

The tab stays mounted once visited, so the hook's initial category is read
only once. Three effects apply the later hand-offs from Home — a category, a
"browse everything", an "open the search" — each starting a fresh browse so
no filter or search survives from an earlier visit, then clearing its own
parameter so the same shortcut works twice.

The card data is memoised and the press handler is a `useCallback`, because
a new object or closure per render would defeat the memoised product card.

Sort currently offers one option. The hook can filter by brand, colour and
size, but nothing here shows those yet.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/screens/ShopScreen.tsx#L169)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/screens/ShopScreen.tsx)
