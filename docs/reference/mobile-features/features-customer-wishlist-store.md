# useCustomerWishlistStore `store`

The customer's saved products.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/features/customer/wishlist/store.ts` |
| Group | [Mobile app — features and state](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`useCustomerWishlistStore`](#hook-use-customer-wishlist-store) | Hook | `const useCustomerWishlistStore: UseBoundStore<StoreApi<CustomerWishlistStore>>` | Holds the saved products, and whether the wishlist sheet is showing. |

## Exports in detail

### `useCustomerWishlistStore` {#hook-use-customer-wishlist-store}

*Hook*

Holds the saved products, and whether the wishlist sheet is showing.

```ts
const useCustomerWishlistStore: UseBoundStore<StoreApi<CustomerWishlistStore>>
```

Written by `loadWishlist` at startup, by `toggleItem` and `removeItem`, and
by the product-details store through `setItems` — which is why `setItems`
is public: the details screen's own save button already has the server's
answer and should not cause a second fetch.

Nothing is persisted. It is loaded at startup when signed in and cleared on
sign-out, so the hearts on a shared phone are never the previous
customer's.

A failed load keeps the items already on screen — same ticket rule as the
grocery-list store, so a late answer never overwrites newer state and a
failure never empties the hearts.

The two mutations differ on purpose. `removeItem` owns its toasts and never
throws, for the Wishlist screen. `toggleItem` **throws** and toasts nothing,
because the heart on a product card flips optimistically and has to be able
to flip back — it returns what it did so the caller can pick the right
message.

`isSaved` reads the current items, so calling it inside a component does
not subscribe that component to anything. A card that wants to re-render
when its own state changes should select just its own answer.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/wishlist/store.ts#L63)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/wishlist/store.ts)
