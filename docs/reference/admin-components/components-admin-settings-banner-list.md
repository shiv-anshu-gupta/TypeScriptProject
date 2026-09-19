# BannerList `banner-list`

The ordered list of banners, with reorder, visibility, edit and delete controls.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `client/src/components/admin/settings/banner-list.tsx` |
| Group | [Admin panel — components](index.md) |
| Exports | 1 |

## Description

Presentational: it renders the list the page passes in and raises callbacks.
The only state it owns is which images failed to load and which banner is
awaiting delete confirmation.

Row order is the app's carousel order, so the up and down arrows change what
customers see first — and can push another live banner past the carousel
limit.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`BannerList`](#component-banner-list) | React component | `function BannerList( … ): Element` | Renders one row per banner, plus the delete confirmation dialog. |

## Exports in detail

### `BannerList` {#component-banner-list}

*React component*

Renders one row per banner, plus the delete confirmation dialog.

```ts
function BannerList(
  props: { items: AdminBanner[]; statuses: BannerStatus[]; busyId: string | null; limit: number; onMove: (banner: AdminBanner, step: -1 | 1) => void; onToggle: (banner: AdminBanner) => void; onEdit: (banner: AdminBanner) => void; onDelete: (banner: AdminBanner) => Promise<boolean> },
): Element
```

| Prop | Type | Meaning |
|---|---|---|
| `busyId` | `string \| null` | Id of the banner whose request is in flight, or `null`. |
| `items` | `AdminBanner[]` | — |
| `limit` | `number` | Carousel limit, used only to word the `overLimit` badge. |
| `onDelete` | `(banner: AdminBanner) => Promise<boolean>` | Resolves `true` when the delete succeeded. |
| `onEdit` | `(banner: AdminBanner) => void` | — |
| `onMove` | `(banner: AdminBanner, step: -1 \| 1) => void` | Called with `-1` to move a banner up, `1` to move it down. |
| `onToggle` | `(banner: AdminBanner) => void` | — |
| `statuses` | `BannerStatus[]` | Statuses from `bannerStatuses`, aligned by index with `items`. |

**Returns** `Element` &mdash; The list and its confirmation dialog.

Each row shows its position, up and down arrows, a thumbnail at the banner
aspect ratio, the name (falling back to "Banner N"), a status badge, and one
line summarising the tap target and schedule from `linkSummary` and
`scheduleSummary`.

While any mutation is in flight, `busyId` disables the controls on **every**
row, not just the one being saved, so two overlapping changes cannot race;
only the affected row is dimmed.

Images that fail to load — typically removed from Cloudinary behind the
app's back — are tracked in a local `Set` and shown as "Image missing" in
place of the status badge. The app skips them too, so the fix is to delete
the record.

Deleting is confirmed in a dialog, not `window.confirm`, and the dialog says
the image goes with it and suggests hiding as the reversible option. The
dialog closes only when `onDelete` resolves `true`.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/admin/settings/banner-list.tsx#L134)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/admin/settings/banner-list.tsx)
