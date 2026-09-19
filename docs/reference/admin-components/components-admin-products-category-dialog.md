# CategoryDialog `category-dialog`

The "Manage Categories" dialog: add, rename, re-image and delete categories.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `client/src/components/admin/products/category-dialog.tsx` |
| Group | [Admin panel — components](index.md) |
| Exports | 1 |

## Description

Unlike the product dialog, this one has no hook — all its state and all its
requests sit in the component.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`CategoryDialog`](#component-category-dialog) | React component | `function CategoryDialog(props: CategoryDialogProps): Element` | Dialog for managing product categories. |

## Exports in detail

### `CategoryDialog` {#component-category-dialog}

*React component*

Dialog for managing product categories.

```ts
function CategoryDialog(props: CategoryDialogProps): Element
```

| Prop | Type | Meaning |
|---|---|---|
| `categories` | `Category[]` | — |
| `onOpenChange` | `(open: boolean) => void` | — |
| `onSaved` | `() => Promise<void>` | — |
| `open` | `boolean` | — |

**Returns** `Element`

One text field doubles as create and rename: pressing the pencil on a row
loads it into `editingCategory`, after which the button reads "Update" and
calls `PUT /admin/categories/:id` instead of `POST /admin/categories`. Both
go as multipart form-data so an optional image can ride along; the mobile
app shows that image as a circle on the Shop tab.

Images are compressed by `compressImage` (`client/src/lib/image.ts`) and
then held to a hard 1 MB. Unlike the product form, a single file is in play,
so an over-limit image is refused with an inline error and the selection is
cleared. The server applies no size or MIME check on this route, so this is
the only limit. The "Take photo" button carries `capture="environment"` and
opens the rear camera directly on a phone.

The search box filters the array **in the browser** — no request is made,
which is the opposite of the products search on the page behind it. The
count beside "All categories" always reflects the unfiltered list.

Deleting asks through `window.confirm`, then calls
`DELETE /admin/categories/:id`. The server refuses to delete a category that
still has products, and its message is shown verbatim in the error line, so
do not swap it for a generic string. Deleting the row currently being edited
also resets the form.

All state is local and dropped when the dialog closes: `name`, `imageFile`,
`editingCategory`, `saving`, `deletingCategoryId`, `error` and `filter`.
Nothing is applied optimistically — the list only changes once `onSaved`
has refetched.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/admin/products/category-dialog.tsx#L104)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/admin/products/category-dialog.tsx)
