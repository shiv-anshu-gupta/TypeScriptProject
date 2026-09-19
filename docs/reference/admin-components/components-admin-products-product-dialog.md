# ProductDialog `product-dialog`

The create/edit product dialog.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `client/src/components/admin/products/product-dialog.tsx` |
| Group | [Admin panel — components](index.md) |
| Exports | 1 |

## Description

Markup only. Every piece of behaviour — form state, image compression and
the 1 MB cap, validation, `POST`/`PUT`/`DELETE /admin/products` — lives in
`useProductForm`.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`ProductDialog`](#component-product-dialog) | React component | `function ProductDialog(props: ProductDialogProps): Element` | Dialog for creating or editing one product. |

## Exports in detail

### `ProductDialog` {#component-product-dialog}

*React component*

Dialog for creating or editing one product.

```ts
function ProductDialog(props: ProductDialogProps): Element
```

| Prop | Type | Meaning |
|---|---|---|
| `categories` | `Category[]` | — |
| `onOpenChange` | `(open: boolean) => void` | — |
| `onSaved` | `() => Promise<void>` | — |
| `open` | `boolean` | — |
| `product` | `Product \| null` | — |

**Returns** `Element`

The fields are title, brand, description, category, status, "Sold per"
(`unitValue` plus a unit from `UNIT_OPTIONS`), stock and the images handled
by `ImagePicker`.

It stays mounted whether open or not; `useProductForm` reseeds the form
whenever `open` or `product` changes, so an abandoned edit is discarded
rather than reappearing.

"Delete Product" shows only in edit mode and goes through a
`window.confirm` inside the hook before `DELETE /admin/products/:id`.
"Cancel" closes without warning, losing any unsaved edits and picked files.
Both footer buttons are disabled while `saving` or `deleting`.

Images added here are compressed in the browser and rejected per file above
1 MB. The server checks neither size nor type for this route, so that limit
must not be relaxed on its own.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/admin/products/product-dialog.tsx#L95)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/admin/products/product-dialog.tsx)
