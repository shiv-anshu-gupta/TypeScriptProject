# Products types `types`

The catalogue's shapes.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/features/customer/products/types.ts` |
| Group | [Mobile app — features and state](index.md) |
| Exports | 8 |

## Description

Some of these are apparel leftovers from the storefront this app grew out
of — colours, sizes, brands. They are still returned by the server and
still rendered when a product has them, which for a grocery shop is
usually never.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`CustomerProduct`](#type-customer-product) | Type | `type CustomerProduct = { … };` | A product, in full. |
| [`CustomerProductDetailsResponse`](#type-customer-product-details-response) | Type | `type CustomerProductDetailsResponse = { … };` | The body of the product details endpoint. |
| [`GetCustomerProductsParams`](#type-get-customer-products-params) | Type | `type GetCustomerProductsParams = { … };` | The catalogue filters. |
| [`ProductCategory`](#type-product-category) | Type | `type ProductCategory = { … };` | One category. |
| [`ProductImage`](#type-product-image) | Type | `type ProductImage = { … };` | One picture of a product. |
| [`ProductSize`](#type-product-size) | Type | `type ProductSize = "S" \| "M" \| "L" \| "XL";` | Clothing sizes. |
| [`ProductSort`](#type-product-sort) | Type | `type ProductSort = "recent";` | The orders the catalogue can be sorted in. |
| [`ProductUnit`](#type-product-unit) | Type | `type ProductUnit = "kg" \| "g" \| "litre" \| "ml" \| "piece" \| "dozen" \| "pack";` | How a product is sold. |

## Exports in detail

### `CustomerProduct` {#type-customer-product}

*Type*

A product, in full.

```ts
type CustomerProduct = {
  _id: string;
  title: string;
  description: string;
  category: ProductCategory;
  brand: string;
  stock: number;
  images: ProductImage[];
  colors: string[];
  sizes: ProductSize[];
  unit: ProductUnit;
  unitValue?: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
};
```

| Property | Type | Meaning |
|---|---|---|
| `_id` | `string` | — |
| `brand` | `string` | — |
| `category` | `ProductCategory` | — |
| `colors` | `string[]` | — |
| `createdAt` | `string` | — |
| `description` | `string` | — |
| `images` | `ProductImage[]` | — |
| `sizes` | `ProductSize[]` | — |
| `status` | `"active" \| "inactive"` | — |
| `stock` | `number` | — |
| `title` | `string` | — |
| `unit` | `ProductUnit` | — |
| `unitValue?` | `number` | — |
| `updatedAt` | `string` | — |

There is no price. Prices are not published in this app — the shop prices a
list by hand after the customer sends it.

`stock` is shown as availability, not as a number to order against; the
shop confirms what it can supply when it prices.

`status` is the shop's own switch. An `inactive` product should not be
reachable from a list request, so a screen that finds one is looking at
something stale.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/products/types.ts#L87)

### `CustomerProductDetailsResponse` {#type-customer-product-details-response}

*Type*

The body of the product details endpoint.

```ts
type CustomerProductDetailsResponse = {
  product: CustomerProduct;
  relatedProducts: CustomerProduct[];
};
```

| Property | Type | Meaning |
|---|---|---|
| `product` | `CustomerProduct` | — |
| `relatedProducts` | `CustomerProduct[]` | — |

Related products are full products, so tapping one can push a new details
screen with its card already drawn.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/products/types.ts#L128)

### `GetCustomerProductsParams` {#type-get-customer-products-params}

*Type*

The catalogue filters.

```ts
type GetCustomerProductsParams = {
  category?: string;
  brand?: string;
  color?: string;
  size?: string;
  search?: string;
  sort?: ProductSort;
};
```

| Property | Type | Meaning |
|---|---|---|
| `brand?` | `string` | — |
| `category?` | `string` | — |
| `color?` | `string` | — |
| `search?` | `string` | — |
| `size?` | `string` | — |
| `sort?` | `ProductSort` | — |

`category` is an id. `brand`, `color` and `size` are supported by the
server and by the list hook, but no screen currently offers a way to set
them.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/products/types.ts#L112)

### `ProductCategory` {#type-product-category}

*Type*

One category.

```ts
type ProductCategory = {
  _id: string;
  name: string;
  imageUrl?: string;
};
```

| Property | Type | Meaning |
|---|---|---|
| `_id` | `string` | — |
| `imageUrl?` | `string` | — |
| `name` | `string` | — |

Filtering uses `_id`, never `name`. `imageUrl` is optional and the rail
falls back to a letter tile without it.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/products/types.ts#L50)

### `ProductImage` {#type-product-image}

*Type*

One picture of a product.

```ts
type ProductImage = {
  url: string;
  publicId: string;
  isCover: boolean;
};
```

| Property | Type | Meaning |
|---|---|---|
| `isCover` | `boolean` | — |
| `publicId` | `string` | — |
| `url` | `string` | — |

`isCover` marks the one a card should show. Nothing guarantees a product
has exactly one, which is why `getCoverImage` falls back to the first
image and then to `""`.

`publicId` is Cloudinary's handle, used by the admin panel to delete an
image; the mobile app only ever reads `url`.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/products/types.ts#L67)

### `ProductSize` {#type-product-size}

*Type*

Clothing sizes.

```ts
type ProductSize = "S" | "M" | "L" | "XL";
```

An apparel leftover. Grocery products carry none, and the details screen
renders the size row only when the array is non-empty.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/products/types.ts#L30)

### `ProductSort` {#type-product-sort}

*Type*

The orders the catalogue can be sorted in.

```ts
type ProductSort = "recent";
```

One value at present. Prices are not published in this app, so there is
nothing else to sort by; the union is kept so adding one does not change
every signature.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/products/types.ts#L21)

### `ProductUnit` {#type-product-unit}

*Type*

How a product is sold.

```ts
type ProductUnit = "kg" | "g" | "litre" | "ml" | "piece" | "dozen" | "pack";
```

Drives the quantity picker's whole shape: `piece`, `dozen` and `pack` are
counted, the rest are weighed or measured. It pairs with `unitValue`, the
pack size — 1 or absent means loose or single.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/products/types.ts#L40)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/products/types.ts)
