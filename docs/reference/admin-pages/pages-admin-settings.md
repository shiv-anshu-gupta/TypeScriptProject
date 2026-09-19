# AdminSettings `Settings`

The home-banners admin screen.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `client/src/pages/admin/Settings.tsx` |
| Group | [Admin panel — pages](index.md) |
| Exports | 1 |

## Description

The route is `/admin/settings` and the sidebar label is "Home banners"
(`client/src/components/admin/common/sidebar.tsx`). It configures the picture
strip at the top of the **mobile app's** Home screen — nothing on this web
page is affected by it, so the only way to see the real result is the app, or
the [`BannerPhonePreview`](../admin-components/components-admin-settings-banner-phone-preview.md#component-banner-phone-preview) mock here.

Four panes: the uploader, the ordered banner list, the phone preview, and the
edit dialog. All server state comes from [`useAdminBanners`](../admin-features/features-admin-settings-use-admin-banners.md#hook-use-admin-banners); the only
state this module owns is which banner's dialog is open.

Status per banner is computed locally by `bannerStatuses`, never sent by the
server, and the header counts are derived from it.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`AdminSettings`](#component-admin-settings) | React component | `function AdminSettings(): Element` | Route component for `/admin/settings`. |

## Exports in detail

### `AdminSettings` {#component-admin-settings}

*React component · default export*

Route component for `/admin/settings`.

```ts
function AdminSettings(): Element
```

Takes no props.

**Returns** `Element` &mdash; The home-banners page.

Reads everything from [`useAdminBanners`](../admin-features/features-admin-settings-use-admin-banners.md#hook-use-admin-banners) and keeps one piece of local
state, `editing`, which is both the banner being edited and the edit dialog's
open flag.

`statuses` is memoised on `items` and `limit`. Because `bannerStatuses`
defaults its `now` argument to the current time, the statuses are only
recomputed when the list or the limit changes — a banner whose schedule
starts or ends while the page sits open keeps its old badge until the next
change or refresh.

`live` is the banners whose status is exactly `"live"`, so anything past the
carousel limit (`overLimit`) is excluded from the phone preview, matching
what the app will show. The header counts hidden and scheduled banners and
hides each count when it is zero.

There is no polling; "Refresh" re-runs `GET /admin/settings/banners` by hand.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/pages/admin/Settings.tsx#L61)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/pages/admin/Settings.tsx)
