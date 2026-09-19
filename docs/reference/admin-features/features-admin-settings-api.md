# Settings api `api`

Server calls for the app's home banners.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `client/src/features/admin/settings/api.ts` |
| Group | [Admin panel — features and hooks](index.md) |
| Exports | 5 |

## Description

Wrappers over `client/src/lib/api.ts`, which attaches the Clerk bearer token,
unwraps the `{ status, data, errors }` envelope and throws
`errors[0].message`. Callers get the payload directly.

Every route answers with the same `AdminBannersResponse` — the full list in
its current order, plus the carousel limit — so `useAdminBanners` can
apply any response the same way.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`deleteAdminBanner`](#function-delete-admin-banner) | Function | `function deleteAdminBanner(bannerId: string): Promise<AdminBannersResponse>` | Deletes one banner and its stored image. |
| [`getAdminBanners`](#function-get-admin-banners) | Function | `function getAdminBanners(): Promise<AdminBannersResponse>` | Fetches every banner, in order, plus the carousel limit. |
| [`reorderAdminBanners`](#function-reorder-admin-banners) | Function | `function reorderAdminBanners(ids: string[]): Promise<AdminBannersResponse>` | Stores a new banner order. |
| [`updateAdminBanner`](#function-update-admin-banner) | Function | `function updateAdminBanner(bannerId: string, body: UpdateBannerBody): Promise<AdminBannersResponse>` | Updates one banner's title, link, schedule or visibility. |
| [`uploadAdminBanners`](#function-upload-admin-banners) | Function | `function uploadAdminBanners(files: File[]): Promise<AdminBannersResponse>` | Uploads one or more banner images. |

## Exports in detail

### `deleteAdminBanner` {#function-delete-admin-banner}

*Function*

Deletes one banner and its stored image.

```ts
function deleteAdminBanner(bannerId: string): Promise<AdminBannersResponse>
```

| Parameter | Type | Meaning |
|---|---|---|
| `bannerId` | `string` | The banner's `_id`. |

**Returns** `Promise<AdminBannersResponse>` &mdash; The full refreshed list.

**Throws**

- Error carrying the server's message.

`DELETE /admin/settings/banners/:id`. Not reversible — the picture goes too,
which is why `BannerList` confirms in a dialog and suggests hiding instead.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/settings/api.ts#L103)

### `getAdminBanners` {#function-get-admin-banners}

*Function*

Fetches every banner, in order, plus the carousel limit.

```ts
function getAdminBanners(): Promise<AdminBannersResponse>
```

**Returns** `Promise<AdminBannersResponse>` &mdash; `{ items, limit }`.

**Throws**

- Error carrying the server's first error message, or the axios message.

`GET /admin/settings/banners`. Runs once on mount and again on "Refresh";
there is no polling.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/settings/api.ts#L33)

### `reorderAdminBanners` {#function-reorder-admin-banners}

*Function*

Stores a new banner order.

```ts
function reorderAdminBanners(ids: string[]): Promise<AdminBannersResponse>
```

| Parameter | Type | Meaning |
|---|---|---|
| `ids` | `string[]` | Every banner's `_id`, in the new order. |

**Returns** `Promise<AdminBannersResponse>` &mdash; The full refreshed list, in the stored order.

**Throws**

- Error carrying the server's message.

`PUT /admin/settings/banners/order` with the complete list of ids in the
wanted order — not a move instruction. This is the one call the UI fires
optimistically: `useAdminBanners` swaps the two rows locally first and
restores the previous order if this rejects.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/settings/api.ts#L88)

### `updateAdminBanner` {#function-update-admin-banner}

*Function*

Updates one banner's title, link, schedule or visibility.

```ts
function updateAdminBanner(bannerId: string, body: UpdateBannerBody): Promise<AdminBannersResponse>
```

| Parameter | Type | Meaning |
|---|---|---|
| `bannerId` | `string` | The banner's `_id`. |
| `body` | `UpdateBannerBody` | — |

**Returns** `Promise<AdminBannersResponse>` &mdash; The full refreshed list.

**Throws**

- Error carrying the server's message.

`PATCH /admin/settings/banners/:id`. The body is partial, so the visibility
toggle sends `isActive` alone while the edit dialog sends title, link and
both dates. Sending `null` for `startsAt` or `endsAt` clears that date.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/settings/api.ts#L71)

### `uploadAdminBanners` {#function-upload-admin-banners}

*Function*

Uploads one or more banner images.

```ts
function uploadAdminBanners(files: File[]): Promise<AdminBannersResponse>
```

| Parameter | Type | Meaning |
|---|---|---|
| `files` | `File[]` | Files already validated by `BannerUploader`; only ones without a blocking error reach here. |

**Returns** `Promise<AdminBannersResponse>` &mdash; The full refreshed list.

**Throws**

- Error carrying the server's message, for example a rejected file size or type.

`POST /admin/settings/banners`, as multipart form-data under the repeated
field name `images`. The files are sent exactly as picked — banners skip the
browser-side compression in `client/src/lib/image.ts` that product images go
through. The server applies its own 5 MB, 10-file and MIME limits, and
appends the new banners to the end of the order.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/settings/api.ts#L53)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/settings/api.ts)
