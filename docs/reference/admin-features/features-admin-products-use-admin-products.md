# useAdminProducts `use-admin-products`

State for the `/admin/products` page: the product list, the category list and the two dialogs.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `client/src/features/admin/products/use-admin-products.ts` |
| Group | [Admin panel — features and hooks](index.md) |
| Exports | 1 |

## Description

There is no store and no polling here — everything lives in component state
inside [`useAdminProducts`](#hook-use-admin-products) and is lost on unmount.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`useAdminProducts`](#hook-use-admin-products) | Hook | `function useAdminProducts(): { … }` | Loads products and categories for the products page and owns its dialog state. |

## Exports in detail

### `useAdminProducts` {#hook-use-admin-products}

*Hook*

Loads products and categories for the products page and owns its dialog
state.

```ts
function useAdminProducts(): {
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  products: Product[];
  categories: Category[];
  loading: boolean;
  refreshAll: () => Promise<void>;
  categoryDialogOpen: boolean;
  setcategoryDialogOpen: Dispatch<SetStateAction<boolean>>;
  productDialogOpen: boolean;
  setProductDialogOpen: Dispatch<SetStateAction<boolean>>;
  editingProduct: Product | null;
  openCreateDialog: () => void;
  closeProductDialog: () => void;
  openEditDialog: (product: Product) => void;
}
```

**Returns** `{ search: string; setSearch: Dispatch<SetStateAction<…>>; products: Product[]; categories: Category[]; loadi …` &mdash; The two lists, the loading flag, `refreshAll`, and the dialog open/close helpers the page wires to the toolbar and the table.

Fetching:

- Categories load once on mount via `GET /admin/categories`.
- Products load through a `setTimeout` keyed on `search`, so the request is
  **debounced by 250 ms**; the timer is cleared on every keystroke. Each run
  issues `GET /admin/products?search=…`, so filtering is server-side.
- There is **no polling**. Another device's change is invisible until
  something calls `refreshAll` or the page is reloaded.

Mutations happen inside the dialogs, not here. They call `refreshAll` on
success, which refetches both lists in parallel with the current search term
still applied. Nothing is updated optimistically, so a row only changes once
the server has answered.

A failed product fetch is swallowed with a `console.log` and leaves the
previous array in place, so a broken request looks like an unchanged table
rather than an error.

`loading` is only raised by the product fetch; the category fetch has no
loading flag and no error handling, so a category failure rejects into an
unhandled promise.

Local-only state: `search`, the debounce timer, both dialog open flags and
`editingProduct` (`null` means the dialog is in create mode).

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/products/use-admin-products.ts#L49)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/products/use-admin-products.ts)
