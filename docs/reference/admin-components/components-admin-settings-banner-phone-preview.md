# BannerPhonePreview `banner-phone-preview`

A mock phone showing the live banners as the app's Home carousel draws them.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `client/src/components/admin/settings/banner-phone-preview.tsx` |
| Group | [Admin panel — components](index.md) |
| Exports | 1 |

## Description

A static drawing, not the real app: the surrounding blocks are placeholders
for the app's header, search bar and category circles. Only the banners are
real images.

It receives the banners the page has already filtered to status `"live"`, so
hidden, scheduled, ended and over-the-limit banners never appear — which is
the point of the preview.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`BannerPhonePreview`](#component-banner-phone-preview) | React component | `function BannerPhonePreview(props: { live: AdminBanner[] }): Element` | Renders the phone mock and its carousel. |

## Exports in detail

### `BannerPhonePreview` {#component-banner-phone-preview}

*React component*

Renders the phone mock and its carousel.

```ts
function BannerPhonePreview(props: { live: AdminBanner[] }): Element
```

| Prop | Type | Meaning |
|---|---|---|
| `live` | `AdminBanner[]` | Banners whose computed status is exactly `"live"`, in carousel order. |

**Returns** `Element` &mdash; The preview.

Slide width is derived from the constants above, and slide height from
`BANNER_RATIO`, so the preview keeps the real 1600 × 736 shape. Paging is by
CSS `translateX`; there is no auto-advance and no swipe — the dots are the
only control.

The selected index is clamped against the current list length, so deleting or
hiding the last banner cannot leave the carousel scrolled past the end. With
no live banners it shows a note that the app skips the space entirely.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/admin/settings/banner-phone-preview.tsx#L60)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/admin/settings/banner-phone-preview.tsx)
