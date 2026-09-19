# Product list shared `product-list.shared`

Helpers and fixed option lists shared by the catalogue screens.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/features/customer/products/product-list.shared.ts` |
| Group | [Mobile app — features and state](index.md) |
| Exports | 7 |

## Description

Kept apart from `types.ts` because these are values, not shapes, and both
the Shop grid and the details screen need them.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`ActiveFilterBadge`](#type-active-filter-badge) | Type | `type ActiveFilterBadge = { … };` | One "you are filtering by this" chip. |
| [`BRAND_OPTIONS`](#constant-brand-options) | Constant | `const BRAND_OPTIONS: string[]` | Brands the filter UI would offer. |
| [`CustomerProductFilters`](#type-customer-product-filters) | Type | `type CustomerProductFilters = { … };` | The catalogue filters as the screen holds them. |
| [`FacetKey`](#type-facet-key) | Type | `type FacetKey = "category" \| "brand" \| "color" \| "size";` | Which filter a value belongs to. |
| [`getCoverImage`](#function-get-cover-image) | Function | `function getCoverImage(product: CustomerProduct): string` | The picture to show for a product. |
| [`getSwatchColor`](#function-get-swatch-color) | Function | `function getSwatchColor(color: string): string` | Turns a colour name into something that can be painted. |
| [`SIZE_OPTIONS`](#constant-size-options) | Constant | `const SIZE_OPTIONS: readonly ["S", "M", "L", "XL"]` | Sizes the filter UI would offer. |

## Exports in detail

### `ActiveFilterBadge` {#type-active-filter-badge}

*Type*

One "you are filtering by this" chip.

```ts
type ActiveFilterBadge = {
  key: FacetKey;
  label: string;
  value: string;
};
```

| Property | Type | Meaning |
|---|---|---|
| `key` | `FacetKey` | — |
| `label` | `string` | — |
| `value` | `string` | — |

`value` is already resolved for display — a category shows its name, not
its id — while `key` is what a tap passes back to clear it.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/products/product-list.shared.ts#L94)

### `BRAND_OPTIONS` {#constant-brand-options}

*Constant*

Brands the filter UI would offer.

```ts
const BRAND_OPTIONS: string[]
```

An apparel leftover, hard-coded rather than read from the catalogue. No
screen currently shows a brand filter, so nothing renders this — but the
hook behind Shop does support filtering by brand.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/products/product-list.shared.ts#L21)

### `CustomerProductFilters` {#type-customer-product-filters}

*Type*

The catalogue filters as the screen holds them.

```ts
type CustomerProductFilters = {
  category: string;
  brand: string;
  color: string;
  size: string;
};
```

| Property | Type | Meaning |
|---|---|---|
| `brand` | `string` | — |
| `category` | `string` | — |
| `color` | `string` | — |
| `size` | `string` | — |

Every field is a string and `""` means "not filtering", rather than
`undefined` — a `TextInput` and a chip both produce strings, and the api
layer drops the empties on its way out.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/products/product-list.shared.ts#L80)

### `FacetKey` {#type-facet-key}

*Type*

Which filter a value belongs to.

```ts
type FacetKey = "category" | "brand" | "color" | "size";
```

Used to toggle one filter by key, so a single handler serves every chip
instead of one per facet.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/products/product-list.shared.ts#L70)

### `getCoverImage` {#function-get-cover-image}

*Function*

The picture to show for a product.

```ts
function getCoverImage(product: CustomerProduct): string
```

| Parameter | Type | Meaning |
|---|---|---|
| `product` | `CustomerProduct` | — |

Fields of `product` (`CustomerProduct`):

| Field | Type | Meaning |
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

**Returns** `string`

The image marked as cover, then the first one, then `""`. The empty string
is deliberate: cards render a placeholder for it, so a product with no
pictures is still tappable.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/products/product-list.shared.ts#L108)

### `getSwatchColor` {#function-get-swatch-color}

*Function*

Turns a colour name into something that can be painted.

```ts
function getSwatchColor(color: string): string
```

| Parameter | Type | Meaning |
|---|---|---|
| `color` | `string` | — |

**Returns** `string`

Looks the name up in a small table of the colours the shop actually uses,
and otherwise hands the string straight back — so a name a CSS colour
already covers still works, and an unknown one degrades to whatever the
platform makes of it rather than throwing.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/products/product-list.shared.ts#L125)

### `SIZE_OPTIONS` {#constant-size-options}

*Constant*

Sizes the filter UI would offer.

```ts
const SIZE_OPTIONS: readonly ["S", "M", "L", "XL"]
```

Matches `ProductSize`. Another apparel leftover with no UI at present.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/products/product-list.shared.ts#L40)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/products/product-list.shared.ts)
