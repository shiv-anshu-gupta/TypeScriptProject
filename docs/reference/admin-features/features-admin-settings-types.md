# Settings types `types`

Types for the app's home banners.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `client/src/features/admin/settings/types.ts` |
| Group | [Admin panel — features and hooks](index.md) |
| Exports | 5 |

## Description

`AdminBanner` is the stored record; `UpdateBannerBody` is the partial patch
the admin page sends; `BannerStatus` is derived in the browser by
`bannerStatuses` and never travels over the wire.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`AdminBanner`](#type-admin-banner) | Type | `type AdminBanner = { … };` | One banner as the server stores it. |
| [`AdminBannersResponse`](#type-admin-banners-response) | Type | `type AdminBannersResponse = { … };` | Payload of every banner endpoint. |
| [`BannerLinkType`](#type-banner-link-type) | Type | `type BannerLinkType = "none" \| "writeList" \| "shop" \| "category" \| "product";` | Where a tap on a banner leads in the mobile app. |
| [`BannerStatus`](#type-banner-status) | Type | `type BannerStatus = "live" \| "hidden" \| "scheduled" \| "ended" \| "overLimit";` | A banner's computed state. |
| [`UpdateBannerBody`](#type-update-banner-body) | Type | `type UpdateBannerBody = Partial<{ title: string; isActive: boolean; link: { type: BannerLinkType; targetId?: string }; startsAt: string \| null; endsAt: string \| null }>;` | Body of `PATCH /admin/settings/banners/:id`. |

## Exports in detail

### `AdminBanner` {#type-admin-banner}

*Type*

One banner as the server stores it.

```ts
type AdminBanner = {
  _id: string;
  imageUrl: string;
  imagePublicId: string;
  title: string;
  isActive: boolean;
  sortOrder: number;
  link: { type: BannerLinkType; targetId?: string; targetName?: string };
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
};
```

| Property | Type | Meaning |
|---|---|---|
| `_id` | `string` | — |
| `createdAt` | `string` | — |
| `endsAt` | `string \| null` | — |
| `imagePublicId` | `string` | — |
| `imageUrl` | `string` | — |
| `isActive` | `boolean` | — |
| `link` | `{ type: BannerLinkType; targetId?: string; targetName?: string }` | — |
| `sortOrder` | `number` | — |
| `startsAt` | `string \| null` | — |
| `title` | `string` | — |

`imagePublicId` is the Cloudinary handle, used server-side when the banner is
deleted. `sortOrder` is the stored position, but the client relies on the
array order the server returns rather than re-sorting by this field.
`link.targetName` is resolved by the server for category and product links
and is absent once the target is deleted. `startsAt` and `endsAt` are ISO
strings or `null` for "no limit".

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/settings/types.ts#L35)

### `AdminBannersResponse` {#type-admin-banners-response}

*Type*

Payload of every banner endpoint.

```ts
type AdminBannersResponse = {
  items: AdminBanner[];
  limit: number;
};
```

| Property | Type | Meaning |
|---|---|---|
| `items` | `AdminBanner[]` | — |
| `limit` | `number` | — |

Read, upload, update, reorder and delete all return this same shape, so any
response can replace client state.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/settings/types.ts#L55)

### `BannerLinkType` {#type-banner-link-type}

*Type*

Where a tap on a banner leads in the mobile app.

```ts
type BannerLinkType = "none" | "writeList" | "shop" | "category" | "product";
```

`none` makes the banner a picture only. `writeList` opens the write-list
sheet — the app's main flow — and `shop` the Shop tab; neither needs a
target. `category` and `product` each require a `targetId`, which the edit
dialog refuses to leave blank.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/settings/types.ts#L22)

### `BannerStatus` {#type-banner-status}

*Type*

A banner's computed state.

```ts
type BannerStatus = "live" | "hidden" | "scheduled" | "ended" | "overLimit";
```

Derived in the browser by `bannerStatuses`; the server stores none of it.
`hidden` means `isActive` is false, `scheduled` that `startsAt` is still in
the future, `ended` that `endsAt` has passed, and `overLimit` that the banner
is otherwise live but sits past the carousel limit, so the app will not show
it.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/settings/types.ts#L89)

### `UpdateBannerBody` {#type-update-banner-body}

*Type*

Body of `PATCH /admin/settings/banners/:id`.

```ts
type UpdateBannerBody = Partial<{ title: string; isActive: boolean; link: { type: BannerLinkType; targetId?: string }; startsAt: string | null; endsAt: string | null }>;
```

Every field is optional: the visibility toggle sends `isActive` alone, the
edit dialog sends title, link and both dates. `startsAt` or `endsAt` set to
`null` clears that end of the schedule. Note the link here carries only
`targetId` — `targetName` is the server's to resolve.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/settings/types.ts#L70)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/settings/types.ts)
