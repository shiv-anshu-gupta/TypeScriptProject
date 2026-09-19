# useProductForm `use-product-form`

The product create/edit form: its state, its image rules, its validation and its save and delete calls.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `client/src/features/admin/products/use-product-form.ts` |
| Group | [Admin panel — features and hooks](index.md) |
| Exports | 2 |

## Description

This is where the only defence against oversized product uploads lives.
Images are compressed in the browser by `client/src/lib/image.ts` and then
held to a hard 1 MB per file. That is a deliberate choice about speed, not
the last line of defence: the server caps each file at 5 MB and accepts only
JPEG, PNG and WebP.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`getCoverImage`](#function-get-cover-image) | Function | `function getCoverImage(images: ProductImage[] = []): ProductImage` | Picks the picture to show as a product's cover. |
| [`useProductForm`](#hook-use-product-form) | Hook | `function useProductForm( … }` | Drives the product dialog: form state, image handling, validation, save and delete. |

## Exports in detail

### `getCoverImage` {#function-get-cover-image}

*Function*

Picks the picture to show as a product's cover.

```ts
function getCoverImage(images: ProductImage[] = []): ProductImage
```

| Parameter | Type | Meaning |
|---|---|---|
| `images?` | `ProductImage[]` | Defaults to `[]`. |

**Returns** `ProductImage`

The image flagged `isCover`, else the first in the array. Returns
`undefined` when the product has no images, so callers must guard — both
`products-table.tsx` and `mapProductToFormValues` do.

This is the single definition of "cover" on the admin side; the table and
the form both call it, so they cannot disagree.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/products/use-product-form.ts#L76)

### `useProductForm` {#hook-use-product-form}

*Hook*

Drives the product dialog: form state, image handling, validation, save and
delete.

```ts
function useProductForm(
  options: UseProductFormOptions,
): {
  form: ProductFormState;
  saving: boolean;
  deleting: boolean;
  isEditMode: boolean;
  addFiles: (files: FileList | null) => Promise<void>;
  submit: () => Promise<void>;
  removeProduct: () => Promise<void>;
  updateField: (key: K, value: ProductFormState[K]) => void;
  removeExistingImage: (publicId: string) => void;
  changeCoverImage: (publicId: string) => void;
}
```

| Parameter | Type | Meaning |
|---|---|---|
| `options` | `UseProductFormOptions` | — |

Fields of `options` (`UseProductFormOptions`):

| Field | Type | Meaning |
|---|---|---|
| `onClose` | `() => void` | — |
| `onSaved` | `() => Promise<void>` | — |
| `open` | `boolean` | — |
| `product` | `Product \| null` | — |

**Returns** `{ form: ProductFormState; saving: boolean; deleting: boolean; isEditMode: boolean; addFiles: (files: FileLis …` &mdash; The form state, the `saving` and `deleting` flags, `isEditMode`, and the field, image, submit and delete handlers.

Form state is reset whenever `open` or `product` changes — to the product's
values in edit mode, to a blank form in create mode. Nothing is persisted,
so closing the dialog discards unsaved edits and every picked file.

Images. `addFiles` runs each picked file through `compressImages`
(`client/src/lib/image.ts`: longest side 1600 px, re-encoded as JPEG at
quality 0.8), then applies a hard `MAX_IMAGE_BYTES` (1 MB) cap. The check is
**per file**: an over-limit image is dropped with its own toast while the
rest of the selection is still added. Compression is best-effort — GIFs and
non-raster files pass through untouched — which is why the cap exists as a
separate step. The server enforces neither size nor type on this route, so
this is the only gate; if the limit is ever raised, add a server-side
`fileSize` at the same time.

`removeExistingImage` drops an image by `publicId` and, when that image was
the cover, promotes whichever image is then first. Removal only takes effect
on save: the surviving list is sent as `existingImages`.

Saving. `validate` mirrors the server's requirements and runs first so the
admin gets an instant toast instead of a round-trip 400; it requires title,
description, category, brand, a numeric stock and at least one image.
`submit` then calls `PUT /admin/products/:id` in edit mode or
`POST /admin/products` otherwise, awaits `onSaved` (the page's `refreshAll`)
and closes the dialog. Nothing is applied optimistically.

Deleting. `removeProduct` is behind a `window.confirm` naming the product,
then `DELETE /admin/products/:id`, then the same refresh-and-close.

Errors from any call surface as a toast carrying the server's message.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/products/use-product-form.ts#L145)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/products/use-product-form.ts)
