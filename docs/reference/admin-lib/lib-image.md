# Image `image`

Shrinks pictures in the browser before they are uploaded.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `client/src/lib/image.ts` |
| Group | [Admin panel — library](index.md) |
| Exports | 4 |

## Description

Used by the product and category forms. Home banners deliberately do **not**
go through here — they are validated but never re-encoded, and the server
enforces matching caps on that path.

This is best-effort compression, never a guarantee: every failure path
returns the original file untouched. The hard rule is the separate
[`MAX_IMAGE_BYTES`](#constant-max-image-bytes) check that callers apply afterwards.

Relaxing that check is safe as far as correctness goes — the server caps
each upload at 5 MB and accepts only JPEG, PNG and WebP — but it is still a
speed decision: a shopkeeper on a slow connection feels every extra hundred
kilobytes, once per image, while the page waits.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`compressImage`](#function-compress-image) | Function | `function compressImage( … ): Promise<File>` | Scales an image down to fit a maximum dimension and re-encodes it as JPEG. |
| [`compressImages`](#function-compress-images) | Function | `function compressImages(files: File[]): Promise<File[]>` | Compresses several files at once. |
| [`formatBytes`](#function-format-bytes) | Function | `function formatBytes(bytes: number): string` | Renders a byte count for an error message. |
| [`MAX_IMAGE_BYTES`](#constant-max-image-bytes) | Constant | `const MAX_IMAGE_BYTES: number` | The hard per-file ceiling, 1 MB, applied after compression. |

## Exports in detail

### `compressImage` {#function-compress-image}

*Function*

Scales an image down to fit a maximum dimension and re-encodes it as JPEG.

```ts
function compressImage(
  file: File,
  maxDimension: number = MAX_DIMENSION,
  quality: number = JPEG_QUALITY,
): Promise<File>
```

| Parameter | Type | Meaning |
|---|---|---|
| `file` | `File` | The picked file. |
| `maxDimension?` | `number` | Longest side in pixels after scaling. Defaults to 1600. Defaults to `MAX_DIMENSION`. |
| `quality?` | `number` | JPEG quality from 0 to 1. Defaults to 0.8. Defaults to `JPEG_QUALITY`. |

**Returns** `Promise<File>` &mdash; The smaller file, or the original.

Never throws and never rejects. There are five paths that return the input
file unchanged, and a caller cannot tell which one was taken:

- the file is not a raster image, or is a GIF (animation would be lost);
- the browser lacks `createImageBitmap` or `canvas.toBlob`, or cannot decode
  the file;
- a 2D canvas context is unavailable;
- `toBlob` produced nothing;
- the re-encoded result came out no smaller than the original.

So an uncompressed file reaching the caller is normal, and the
[`MAX_IMAGE_BYTES`](#constant-max-image-bytes) check afterwards is what actually protects the
upload.

Aspect ratio is preserved, and an image already within `maxDimension` is
re-encoded but not scaled. Encoding is always lossy JPEG, so transparency in
a PNG is lost and the extension is rewritten to `.jpg`.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/lib/image.ts#L87)

### `compressImages` {#function-compress-images}

*Function*

Compresses several files at once.

```ts
function compressImages(files: File[]): Promise<File[]>
```

| Parameter | Type | Meaning |
|---|---|---|
| `files` | `File[]` | The picked files. |

**Returns** `Promise<File[]>` &mdash; The processed files, in the same order.

Runs in parallel and resolves to an array index-aligned with `files`. Since
[`compressImage`](#function-compress-image) never rejects, this never rejects either and always
returns one entry per input — some of which may be uncompressed originals.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/lib/image.ts#L143)

### `formatBytes` {#function-format-bytes}

*Function*

Renders a byte count for an error message.

```ts
function formatBytes(bytes: number): string
```

| Parameter | Type | Meaning |
|---|---|---|
| `bytes` | `number` | A file size. |

**Returns** `string` &mdash; A short string such as `"1.4 MB"` or `"320 KB"`.

One decimal place above 1 MB, whole kilobytes below. Display only.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/lib/image.ts#L55)

### `MAX_IMAGE_BYTES` {#constant-max-image-bytes}

*Constant*

The hard per-file ceiling, 1 MB, applied after compression.

```ts
const MAX_IMAGE_BYTES: number
```

Enforced by the callers, not by [`compressImage`](#function-compress-image). The product form
rejects each over-size file individually with a toast and still accepts the
rest; the category dialog rejects the single file with an inline error and
clears it.

This is the only size limit that exists for product and category uploads.
The server does not check.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/lib/image.ts#L44)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/lib/image.ts)
