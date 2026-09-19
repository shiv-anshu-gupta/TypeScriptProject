# Wishlist api `api`

The customer's saved products.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/features/customer/wishlist/api.ts` |
| Group | [Mobile app — features and state](index.md) |
| Exports | 3 |

## Description

All three need a bearer token. Each answers with the **whole** wishlist
after the change, so a caller replaces its copy rather than patching it and
the store can never drift from the server.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`addCustomerWishlist`](#function-add-customer-wishlist) | Function | `function addCustomerWishlist(body: AddCustomerWishlistItemBody): Promise<CustomerWishlistResponse>` | `POST /customer/wishlist/items` — saves a product. |
| [`getCustomerWishlist`](#function-get-customer-wishlist) | Function | `function getCustomerWishlist(): Promise<CustomerWishlistResponse>` | `GET /customer/wishlist` — every product the customer has saved. |
| [`removeCustomerWishlistItem`](#function-remove-customer-wishlist-item) | Function | `function removeCustomerWishlistItem(productId: string): Promise<CustomerWishlistResponse>` | `DELETE /customer/wishlist/items/:productId` — un-saves a product. |

## Exports in detail

### `addCustomerWishlist` {#function-add-customer-wishlist}

*Function*

`POST /customer/wishlist/items` — saves a product.

```ts
function addCustomerWishlist(body: AddCustomerWishlistItemBody): Promise<CustomerWishlistResponse>
```

| Parameter | Type | Meaning |
|---|---|---|
| `body` | `AddCustomerWishlistItemBody` | — |

Fields of `body` (`AddCustomerWishlistItemBody`):

| Field | Type | Meaning |
|---|---|---|
| `productId` | `string` | — |

**Returns** `Promise<CustomerWishlistResponse>` &mdash; The whole wishlist as it now stands.

**Throws**

- Error When signed out, or the product is unknown.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/wishlist/api.ts#L34)

### `getCustomerWishlist` {#function-get-customer-wishlist}

*Function*

`GET /customer/wishlist` — every product the customer has saved.

```ts
function getCustomerWishlist(): Promise<CustomerWishlistResponse>
```

**Returns** `Promise<CustomerWishlistResponse>` &mdash; `{ items }`, possibly empty.

**Throws**

- Error When signed out, or the request fails.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/wishlist/api.ts#L24)

### `removeCustomerWishlistItem` {#function-remove-customer-wishlist-item}

*Function*

`DELETE /customer/wishlist/items/:productId` — un-saves a product.

```ts
function removeCustomerWishlistItem(productId: string): Promise<CustomerWishlistResponse>
```

| Parameter | Type | Meaning |
|---|---|---|
| `productId` | `string` | — |

**Returns** `Promise<CustomerWishlistResponse>` &mdash; The whole wishlist as it now stands.

**Throws**

- Error When signed out, or the request fails.

Addressed by the **product** id, not by a wishlist entry id.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/wishlist/api.ts#L50)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/wishlist/api.ts)
