# ProductsTable `products-table`

The products table on `/admin/products`.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `client/src/components/admin/products/products-table.tsx` |
| Group | [Admin panel — components](index.md) |
| Exports | 1 |

## Description

Display only — it fetches nothing and mutates nothing. Editing is delegated
upwards through `onEdit`.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`ProductsTable`](#component-products-table) | React component | `function ProductsTable(props: ProductsTableProps): Element` | Lists products with cover image, title, brand, category, unit, status and stock. |

## Exports in detail

### `ProductsTable` {#component-products-table}

*React component*

Lists products with cover image, title, brand, category, unit, status and
stock.

```ts
function ProductsTable(props: ProductsTableProps): Element
```

| Prop | Type | Meaning |
|---|---|---|
| `loading` | `boolean` | — |
| `onEdit` | `(product: Product) => void` | — |
| `products` | `Product[]` | — |

**Returns** `Element`

Renders the whole `products` array — no pagination, no client-side
filtering, no sorting. What arrives is what is shown, and the search that
produced it ran on the server.

Three states share the same body: a "Loading Products..." row while
`loading`, a "No products found!!!" row when the array is empty, and the
rows themselves. Because the hook swallows a failed fetch, a request error
looks like whichever of those two the previous state left behind.

The cover comes from `getCoverImage` (the `isCover` image, else the first);
a product with no images shows an empty grey box rather than a broken
image. The unit cell hides `unitValue` when it is 1, so "per kg" rather
than "per 1 kg", and falls back to `piece` for older products with no unit.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/admin/products/products-table.tsx#L75)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/admin/products/products-table.tsx)
