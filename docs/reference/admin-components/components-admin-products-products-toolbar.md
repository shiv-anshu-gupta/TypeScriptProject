# ProductToolbar `products-toolbar`

The search box and action buttons above the products table.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `client/src/components/admin/products/products-toolbar.tsx` |
| Group | [Admin panel — components](index.md) |
| Exports | 1 |

## Description

Fully controlled and stateless: it holds no search text of its own and makes
no requests.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`ProductToolbar`](#component-product-toolbar) | React component | `function ProductToolbar(props: ProductsToolbarProps): Element` | The products search field plus "Manage Category" and "Add Product". |

## Exports in detail

### `ProductToolbar` {#component-product-toolbar}

*React component*

The products search field plus "Manage Category" and "Add Product".

```ts
function ProductToolbar(props: ProductsToolbarProps): Element
```

| Prop | Type | Meaning |
|---|---|---|
| `onAddProduct` | `() => void` | — |
| `onManageCategories` | `() => void` | — |
| `onSearchChange` | `(value: string) => void` | — |
| `search` | `string` | — |

**Returns** `Element`

Search is server-side: the typed value travels up to `useAdminProducts`,
which debounces it by 250 ms and re-issues
`GET /admin/products?search=`. Clearing the box therefore costs one more
request rather than restoring a cached list.

Note the name mismatch — the component is `ProductToolbar` while its props
type is `ProductsToolbarProps` and the file is `products-toolbar.tsx`.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/admin/products/products-toolbar.tsx#L54)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/admin/products/products-toolbar.tsx)
