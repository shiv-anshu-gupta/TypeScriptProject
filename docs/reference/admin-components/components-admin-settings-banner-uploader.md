# BannerUploader `banner-uploader`

The drag-and-drop banner uploader.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `client/src/components/admin/settings/banner-uploader.tsx` |
| Group | [Admin panel — components](index.md) |
| Exports | 1 |

## Description

Files are inspected in the browser before anything is sent, then uploaded in
one request. Banners are **not** compressed here: unlike product images they
never pass through `client/src/lib/image.ts`, only these checks. The server
enforces matching 5 MB, 10-file and MIME limits, so the client rules are a
duplicate of a real gate rather than the only one.

The picked files and their object URLs live in this component's state alone.
Nothing is sent until the admin presses the upload button, and the selection
is lost if the page is left.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`BannerUploader`](#component-banner-uploader) | React component | `function BannerUploader( … ): Element` | Lets the admin pick banner images, shows what is wrong with each, and uploads the acceptable ones. |

## Exports in detail

### `BannerUploader` {#component-banner-uploader}

*React component*

Lets the admin pick banner images, shows what is wrong with each, and uploads
the acceptable ones.

```ts
function BannerUploader(
  props: { uploading: boolean; onUpload: (files: File[]) => Promise<boolean> },
): Element
```

| Prop | Type | Meaning |
|---|---|---|
| `onUpload` | `(files: File[]) => Promise<boolean>` | Sends the files. Wired to `upload` in `useAdminBanners`, which returns `false` on failure so the queue survives a failed attempt. |
| `uploading` | `boolean` | Whether a request is in flight; disables the button and changes its label. |

**Returns** `Element` &mdash; The uploader panel.

Files arrive by click or by drop on the same button; both paths run
`inspect`. The queue is capped at `MAX_FILES` — anything beyond
the remaining room is dropped without a message. The file input's value is
cleared after each change so the same file can be picked again.

Only files without a blocking error are uploaded, and the button is disabled
when none qualify, so a queue of rejects cannot be sent. On success the whole
queue is cleared and every object URL revoked.

Object URLs are tracked in a ref that mirrors state, so the unmount cleanup
revokes whatever was pending without re-running on every change.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/admin/settings/banner-uploader.tsx#L145)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/admin/settings/banner-uploader.tsx)
