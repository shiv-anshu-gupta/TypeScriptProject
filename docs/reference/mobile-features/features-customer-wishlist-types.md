# Wishlist types `types`

What a saved product looks like.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/features/customer/wishlist/types.ts` |
| Group | [Mobile app — features and state](index.md) |
| Exports | 3 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`AddCustomerWishlistItemBody`](#type-add-customer-wishlist-item-body) | Type | `type AddCustomerWishlistItemBody = { … };` | What is sent to save a product. |
| [`CustomerWishlistItem`](#type-customer-wishlist-item) | Type | `type CustomerWishlistItem = { … };` | One saved product. |
| [`CustomerWishlistResponse`](#type-customer-wishlist-response) | Type | `type CustomerWishlistResponse = { … };` | The body every wishlist endpoint answers with. |

## Exports in detail

### `AddCustomerWishlistItemBody` {#type-add-customer-wishlist-item-body}

*Type*

What is sent to save a product.

```ts
type AddCustomerWishlistItemBody = {
  productId: string;
};
```

| Property | Type | Meaning |
|---|---|---|
| `productId` | `string` | — |

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/wishlist/types.ts#L37)

### `CustomerWishlistItem` {#type-customer-wishlist-item}

*Type*

One saved product.

```ts
type CustomerWishlistItem = {
  productId: string;
  title: string;
  brand: string;
  image: string;
};
```

| Property | Type | Meaning |
|---|---|---|
| `brand` | `string` | — |
| `image` | `string` | — |
| `productId` | `string` | — |
| `title` | `string` | — |

A snapshot taken when it was saved, not a live product: enough to draw a
card and open the details screen, and nothing more. The key is `productId`
— there is no separate entry id — which is what `isSaved` and the heart on
a card compare against.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/wishlist/types.ts#L16)

### `CustomerWishlistResponse` {#type-customer-wishlist-response}

*Type*

The body every wishlist endpoint answers with.

```ts
type CustomerWishlistResponse = {
  items: CustomerWishlistItem[];
};
```

| Property | Type | Meaning |
|---|---|---|
| `items` | `CustomerWishlistItem[]` | — |

The same shape for reading, adding and removing: always the whole list
after the change.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/wishlist/types.ts#L30)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/wishlist/types.ts)
