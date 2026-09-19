# ImagePicker `image-picker`

The image area of the product dialog: two pickers, the existing pictures and previews of newly added files.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `client/src/components/admin/products/image-picker.tsx` |
| Group | [Admin panel — components](index.md) |
| Exports | 1 |

## Description

Presentation only. It neither compresses nor size-checks anything — both
happen in `useProductForm` after `onFilesAdd` hands the files up.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`ImagePicker`](#component-image-picker) | React component | `function ImagePicker(props: ImagePickerProps): Element` | Picks product images and manages the ones already saved. |

## Exports in detail

### `ImagePicker` {#component-image-picker}

*React component*

Picks product images and manages the ones already saved.

```ts
function ImagePicker(props: ImagePickerProps): Element
```

| Prop | Type | Meaning |
|---|---|---|
| `coverImagePublicId` | `string` | — |
| `existingImages` | `ProductImage[]` | — |
| `newFiles` | `File[]` | — |
| `onCoverImageChange` | `(publicId: string) => void` | — |
| `onExistingRemove` | `(publicId: string) => void` | — |
| `onFilesAdd` | `(files: FileList \| null) => void` | — |

**Returns** `Element`

Two inputs feed the same `onFilesAdd`. "Choose from gallery" is `multiple`;
"Take photo" carries `capture="environment"`, which opens the rear camera
directly on a phone — the main affordance for a shopkeeper adding stock from
the shop floor — and behaves like an ordinary file picker on desktop. Both
are `accept="image/*"`, which is the only type check anywhere in the product
upload path, and a hint the browser is free to ignore.

Previews for new files are `URL.createObjectURL` blobs held in a `useMemo`
keyed on `newFiles`, and the cleanup effect revokes them when `newFiles`
changes or the component unmounts. Leaving that effect out would leak a blob
per picked photo for the life of the tab.

Cover selection and removal act on existing images only, by `publicId`, and
are staged in form state — nothing reaches the server until the dialog is
saved.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/admin/products/image-picker.tsx#L90)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/admin/products/image-picker.tsx)
