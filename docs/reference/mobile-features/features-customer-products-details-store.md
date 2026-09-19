# useCustomerProductDetailsStore `store`

The one product-details store, shared by a stack of product screens.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/features/customer/products/details/store.ts` |
| Group | [Mobile app — features and state](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`useCustomerProductDetailsStore`](#hook-use-customer-product-details-store) | Hook | `const useCustomerProductDetailsStore: UseBoundStore<StoreApi<CustomerProductDetailsStore>>` | Holds the product currently being looked at, and the gallery, colour and size the customer has chosen on it. |

## Exports in detail

### `useCustomerProductDetailsStore` {#hook-use-customer-product-details-store}

*Hook*

Holds the product currently being looked at, and the gallery, colour and
size the customer has chosen on it.

```ts
const useCustomerProductDetailsStore: UseBoundStore<StoreApi<CustomerProductDetailsStore>>
```

Written by `loadProduct` when a details screen focuses, by the selection
setters as the customer taps, and by `toggleWishlist` — which writes to the
wishlist store rather than holding a copy of its own.

Nothing is persisted; it is public data and is fetched again on every
visit.

**The invariant is `productId`.** Product pages stack — tapping a related
product pushes another screen — and they all read this single store, so
every screen and the store itself check that what is loaded is still their
own product before using or writing it. A late answer for a page the
customer has already moved past is dropped rather than shown over the one
in front of them. A screen that focuses on a product already loaded should
not reload it.

`loading` starts `true`, so a screen shows a spinner before the first
fetch rather than an empty product.

`toggleWishlist` is given the auth state rather than reading it, so the
store stays out of React's hooks. Signed out it toasts and does nothing.
It never throws; failures are toasts.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/products/details/store.ts#L78)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/products/details/store.ts)
