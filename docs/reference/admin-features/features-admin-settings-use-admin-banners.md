# useAdminBanners `use-admin-banners`

State and server calls for the `/admin/settings` home-banners page.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `client/src/features/admin/settings/use-admin-banners.ts` |
| Group | [Admin panel — features and hooks](index.md) |
| Exports | 1 |

## Description

One hook owns the list, the carousel limit and every mutation. The page is
layout only. All errors are surfaced as toasts here rather than thrown at the
page.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`useAdminBanners`](#hook-use-admin-banners) | Hook | `function useAdminBanners(): { … }` | Drives the home-banners page. |

## Exports in detail

### `useAdminBanners` {#hook-use-admin-banners}

*Hook*

Drives the home-banners page.

```ts
function useAdminBanners(): {
  items: AdminBanner[];
  limit: number;
  loading: boolean;
  uploading: boolean;
  busyId: string | null;
  refresh: () => Promise<void>;
  upload: (files: File[]) => Promise<boolean>;
  update: (banner: AdminBanner, body: UpdateBannerBody, done?: string) => Promise<boolean>;
  toggleActive: (banner: AdminBanner) => Promise<boolean>;
  move: (banner: AdminBanner, step: -1 | 1) => Promise<void>;
  remove: (banner: AdminBanner) => Promise<boolean>;
}
```

**Returns** `{ items: AdminBanner[]; limit: number; loading: boolean; uploading: boolean; busyId: string \| null; refresh: …` &mdash; The banner list, the carousel limit, the progress flags and the mutations the page needs.

Fetches `GET /admin/settings/banners` on mount. There is **no polling** — the
list changes only through this admin's own actions or the "Refresh" button.

Every mutation returns the full list plus the limit, and `apply` replaces both
wholesale, so the page always reflects exactly what the server will serve the
app. `limit` is therefore re-read on every response.

`move` is the **one optimistic mutation** in this app: the swap is applied to
local state first, then `PUT …/order` is sent, and the previous array is
restored if the request fails. Everything else waits for the server.

Every call catches its own error and shows a toast, so nothing here rejects at
the page. `upload`, `update` and `remove` return a boolean instead, which the
uploader and the delete confirmation use to decide whether to clear
themselves.

Local-only state: `loading`, `uploading` and `busyId`. Nothing is persisted.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/settings/use-admin-banners.ts#L78)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/settings/use-admin-banners.ts)
