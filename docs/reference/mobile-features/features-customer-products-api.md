# Products api `api`

The catalogue: categories, the product list and one product's details.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/features/customer/products/api.ts` |
| Group | [Mobile app — features and state](index.md) |
| Exports | 3 |

## Description

All three are public. They work signed out and are what lets Home and Shop
be usable before anybody logs in.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`getCustomerCategories`](#function-get-customer-categories) | Function | `function getCustomerCategories(): Promise<ProductCategory[]>` | `GET /customer/categories` — every category the shop is showing. |
| [`getCustomerProductDetails`](#function-get-customer-product-details) | Function | `function getCustomerProductDetails(productId: string): Promise<CustomerProductDetailsResponse>` | `GET /customer/products/:id` — one product, with the related ones. |
| [`getCustomerProducts`](#function-get-customer-products) | Function | `function getCustomerProducts(params?: GetCustomerProductsParams): Promise<CustomerProduct[]>` | `GET /customer/products` — the catalogue, filtered. |

## Exports in detail

### `getCustomerCategories` {#function-get-customer-categories}

*Function*

`GET /customer/categories` — every category the shop is showing.

```ts
function getCustomerCategories(): Promise<ProductCategory[]>
```

**Returns** `Promise<ProductCategory[]>` &mdash; The categories, in the shop's own order.

**Throws**

- Error On a network or server failure. Callers fall back to an empty rail rather than an error screen.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/products/api.ts#L26)

### `getCustomerProductDetails` {#function-get-customer-product-details}

*Function*

`GET /customer/products/:id` — one product, with the related ones.

```ts
function getCustomerProductDetails(productId: string): Promise<CustomerProductDetailsResponse>
```

| Parameter | Type | Meaning |
|---|---|---|
| `productId` | `string` | — |

**Returns** `Promise<CustomerProductDetailsResponse>` &mdash; `{ product, relatedProducts }`.

**Throws**

- Error When the id is unknown, or the request fails.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/products/api.ts#L74)

### `getCustomerProducts` {#function-get-customer-products}

*Function*

`GET /customer/products` — the catalogue, filtered.

```ts
function getCustomerProducts(params?: GetCustomerProductsParams): Promise<CustomerProduct[]>
```

| Parameter | Type | Meaning |
|---|---|---|
| `params?` | `GetCustomerProductsParams` | Every field optional; `search` is free text and the caller is expected to have debounced it. |

Fields of `params` (`GetCustomerProductsParams`):

| Field | Type | Meaning |
|---|---|---|
| `brand?` | `string` | — |
| `category?` | `string` | — |
| `color?` | `string` | — |
| `search?` | `string` | — |
| `size?` | `string` | — |
| `sort?` | `ProductSort` | — |

**Returns** `Promise<CustomerProduct[]>` &mdash; The matching products, possibly none.

**Throws**

- Error On a network or server failure.

The query string is built by hand, one `encodeURIComponent` value at a
time, because React Native has no `URLSearchParams`. Empty values are
dropped rather than sent blank, so an unfiltered call is a clean
`/customer/products`.

Everything comes back at once — there is no paging, which suits a single
shop's catalogue and is what lets the Shop grid filter without a spinner
per page.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/products/api.ts#L48)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/products/api.ts)
