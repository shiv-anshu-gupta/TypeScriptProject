# Cloudinary `cloudinary`

Every picture in the shop: getting it into Cloudinary, asking for it back at the size it will be drawn, and deleting it when the admin removes it.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `server/src/utils/cloudinary.ts` |
| Group | [Server — utilities and middleware](index.md) |
| Exports | 5 |

## Description

Configured at import time from `CLOUDINARY_CLOUD_NAME`,
`CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET`. Unlike Razorpay, missing
values do not stop the server - uploads simply fail when first attempted.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`cdnImage`](#function-cdn-image) | Function | `function cdnImage(url: string, variant: "thumb" \| "card" \| "detail" \| "banner"): string` | Rewrites a stored Cloudinary URL to ask for the picture at the size it will be drawn. |
| [`deleteFromCloudinary`](#function-delete-from-cloudinary) | Function | `function deleteFromCloudinary(publicIds: string[]): Promise<void>` | Best-effort removal of images the admin deleted. |
| [`ImageVariant`](#type-image-variant) | Type | `type ImageVariant = keyof typeof VARIANTS;` | The name of a delivery size: `thumb`, `card`, `detail` or `banner`. |
| [`uploadManyBuffersToCloudinary`](#function-upload-many-buffers-to-cloudinary) | Function | `function uploadManyBuffersToCloudinary( … ): Promise<CloudinaryUploadResult[]>` | Uploads several image buffers at once, keeping their order. |
| [`uploadSingleBufferToCloudinary`](#function-upload-single-buffer-to-cloudinary) | Function | `function uploadSingleBufferToCloudinary( … ): Promise<CloudinaryUploadResult>` | Uploads one image buffer to Cloudinary and returns where it landed. |

## Exports in detail

### `cdnImage` {#function-cdn-image}

*Function*

Rewrites a stored Cloudinary URL to ask for the picture at the size it will
be drawn.

```ts
function cdnImage(url: string, variant: "thumb" | "card" | "detail" | "banner"): string
```

| Parameter | Type | Meaning |
|---|---|---|
| `url` | `string` | — |
| `variant` | `"thumb" \| "card" \| "detail" \| "banner"` | — |

**Returns** `string` &mdash; The transformed URL, or the input untouched in the two cases above.

Pure string work - no network call, and nothing in the database changes.
Cloudinary makes the derivative the first time the URL is fetched and
caches it thereafter.

Two inputs are returned unchanged: a URL that is not a Cloudinary upload
(a seeded link, an empty field), and one that already carries an `f_auto`
or `f_webp` transformation, so calling this twice is harmless.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/cloudinary.ts#L182)

### `deleteFromCloudinary` {#function-delete-from-cloudinary}

*Function*

Best-effort removal of images the admin deleted. We never let a failed
cleanup block the update itself — the DB is the source of truth.

```ts
function deleteFromCloudinary(publicIds: string[]): Promise<void>
```

| Parameter | Type | Meaning |
|---|---|---|
| `publicIds` | `string[]` | Cloudinary `public_id` values, as stored alongside each image URL. Passing a URL here does nothing. |

**Returns** `Promise<void>`

Every id is destroyed at Cloudinary in parallel and each failure is
swallowed, so this resolves even when none of them could be removed. The
worst case is an orphaned picture in the library, which costs a little
storage; the alternative - failing the admin's save - would leave the
product wrong.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/cloudinary.ts#L207)

### `ImageVariant` {#type-image-variant}

*Type*

The name of a delivery size: `thumb`, `card`, `detail` or `banner`.

```ts
type ImageVariant = keyof typeof VARIANTS;
```

Each maps to a width in pixels - see the table above for what each is for
and why its number was chosen.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/cloudinary.ts#L145)

### `uploadManyBuffersToCloudinary` {#function-upload-many-buffers-to-cloudinary}

*Function*

Uploads several image buffers at once, keeping their order.

```ts
function uploadManyBuffersToCloudinary(
  files: Buffer<ArrayBufferLike>[],
  folder: string = "ecommerce-monster-video/products",
): Promise<CloudinaryUploadResult[]>
```

| Parameter | Type | Meaning |
|---|---|---|
| `files` | `Buffer<ArrayBufferLike>[]` | — |
| `folder?` | `string` | Defaults to `"ecommerce-monster-video/products"`. |

**Returns** `Promise<CloudinaryUploadResult[]>` &mdash; One result per input, in the same order, so an image's position in the product's gallery is preserved.

**Throws**

- Error if any single upload fails.

All uploads run together, so the wait is roughly that of the slowest one
rather than their sum. `Promise.all` means one failure rejects the lot -
and the pictures that did succeed are already in Cloudinary, unreferenced.
A caller that minds should clean up with [`deleteFromCloudinary`](#function-delete-from-cloudinary).

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/cloudinary.ts#L101)

### `uploadSingleBufferToCloudinary` {#function-upload-single-buffer-to-cloudinary}

*Function*

Uploads one image buffer to Cloudinary and returns where it landed.

```ts
function uploadSingleBufferToCloudinary(
  fileBuffer: Buffer,
  folder: string = "ecommerce-monster-video/products",
): Promise<CloudinaryUploadResult>
```

| Parameter | Type | Meaning |
|---|---|---|
| `fileBuffer` | `Buffer` | — |
| `folder?` | `string` | the Cloudinary folder to store under. The default keeps product pictures together; banners and category images pass their own. Defaults to `"ecommerce-monster-video/products"`. |

**Returns** `Promise<CloudinaryUploadResult>` &mdash; The delivery URL (`secure_url`) and the `public_id`. Store BOTH - the id is the only handle that can later delete the picture.

**Throws**

- Error when Cloudinary reports a failure, or returns no result.

The buffer is streamed rather than written to disk, so nothing touches the
filesystem - which matters on serverless hosts with a read-only one.

Cloudinary shrinks the picture on the way in: at most
`MAX_STORED_DIMENSION` on its longer side, `crop: "limit"` so a small
picture is never enlarged, and `quality: "auto:good"`. What comes back is
therefore not byte-identical to what the admin chose.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/cloudinary.ts#L50)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/server/src/utils/cloudinary.ts)
