# ProductDetailsScreen

The product page.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `mobile/src/screens/ProductDetailsScreen.tsx` |
| Group | [Mobile app — screens](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`ProductDetailsScreen`](#component-product-details-screen) | React component | `function ProductDetailsScreen(): Element` | One product in full: its gallery, stock, description, related products, and a bar pinned at the bottom to save it or add it to the list. |

## Exports in detail

### `ProductDetailsScreen` {#component-product-details-screen}

*React component*

One product in full: its gallery, stock, description, related products, and
a bar pinned at the bottom to save it or add it to the list.

```ts
function ProductDetailsScreen(): Element
```

Takes no props.

**Returns** `Element`

Reads `useCustomerProductDetailsStore` for the product,
`useCustomerWishlistStore` for the heart, `useDraftListStore` to add the
item, and both Clerk and `useAuthStore` so the heart can tell "not signed
in" from "not loaded yet".

Product pages stack — a related product is pushed rather than replacing this
one — yet they all share a single store. So the load on focus happens only
when the store currently holds a different product, which is what lets a
page reclaim its own data after the customer comes back from a related one.

The quantity lives on this screen rather than in the store, and is re-seeded
from the product's own unit once it is known. Adding uses
`addProductWithQuantity`, which sets the quantity outright rather than
adding to whatever is already on the line.

It opens no sheet: the quantity picker is inline here, not the shared one a
product card opens. Colours and sizes are apparel leftovers and render only
when the product has them.

Fully usable signed out; the heart toasts instead of saving.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/screens/ProductDetailsScreen.tsx#L76)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/screens/ProductDetailsScreen.tsx)
