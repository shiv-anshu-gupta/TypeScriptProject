# BannerEditDialog `banner-edit-dialog`

The banner edit dialog: name, tap target and optional schedule.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `client/src/components/admin/settings/banner-edit-dialog.tsx` |
| Group | [Admin panel — components](index.md) |
| Exports | 1 |

## Description

The image itself cannot be changed here — replacing a picture means uploading
a new banner and deleting the old one.

Category and product targets are resolved against the products feature's own
endpoints, so this dialog is the reason the Products pages are not dead
weight for banners.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`BannerEditDialog`](#component-banner-edit-dialog) | React component | `function BannerEditDialog( … ): Element` | Modal form for one banner's name, tap target and schedule. |

## Exports in detail

### `BannerEditDialog` {#component-banner-edit-dialog}

*React component*

Modal form for one banner's name, tap target and schedule.

```ts
function BannerEditDialog(
  props: { banner: AdminBanner | null; saving: boolean; onClose: () => void; onSave: (banner: AdminBanner, body: UpdateBannerBody) => Promise<boolean> },
): Element
```

| Prop | Type | Meaning |
|---|---|---|
| `banner` | `AdminBanner \| null` | The banner being edited, or `null` to keep the dialog closed. |
| `onClose` | `() => void` | — |
| `onSave` | `(banner: AdminBanner, body: UpdateBannerBody) => Promise<boolean>` | Resolves `true` when the patch succeeded. |
| `saving` | `boolean` | Whether the patch is in flight; disables both footer buttons. |

**Returns** `Element` &mdash; The dialog.

Open state is implicit: the dialog is open whenever `banner` is not `null`.
Every field is local state, seeded from the banner by an effect each time a
different banner is passed, so unsaved edits are dropped on close.

Categories are fetched once per dialog session via `getAdminCategories`
(`GET /admin/categories`) and cached in state; the effect skips the call once
`categories` is non-empty. A failure leaves the list empty and the dropdown
shows nothing to choose. Products use the debounced `ProductPicker`
instead, because the list is too long to load whole.

Changing the link type clears `targetId` and `targetName`, so a stale product
id cannot be saved against a category link.

Two checks run before saving, both shown inline: a `category` or `product`
link must have a target, and an end date must be after a start date.
`datetime-local` values are converted to ISO by `fromLocalInput`, and an
empty field becomes `null`, which clears that end of the schedule.

Only `targetId` is sent — the server resolves `targetName`. The dialog closes
only when `onSave` resolves `true`, so a rejected save keeps the edits on
screen with the hook's toast explaining why.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/admin/settings/banner-edit-dialog.tsx#L196)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/admin/settings/banner-edit-dialog.tsx)
