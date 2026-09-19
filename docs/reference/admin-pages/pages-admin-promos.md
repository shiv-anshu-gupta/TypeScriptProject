# AdminPromos `Promos`

The promo-code admin screen: a searchable table of promos plus a create/edit dialog.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `client/src/pages/admin/Promos.tsx` |
| Group | [Admin panel — pages](index.md) |
| Exports | 1 |

## Description

The route is `/admin/coupons` (`client/src/router.tsx`), the sidebar label is
"Coupons" (`client/src/components/admin/common/sidebar.tsx`) and the heading
rendered here is "Promos". The three names refer to the same thing.

All state and all server calls live in [`useAdminPromos`](../admin-features/features-admin-promo-use-admin-promo.md#hook-use-admin-promos); this module is
layout only. There is no polling and no optimistic update — every mutation
waits for the server and replaces the whole list.

Maintenance note: no consumer of these promo codes could be found in this
repository. The mobile app's core flow is "the customer writes a free-text
grocery list and the shop prices it", which never reads a promo. The page and
its server routes are live, but nothing in the repo is known to redeem a code.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`AdminPromos`](#component-admin-promos) | React component | `function AdminPromos(): Element` | Route component for `/admin/coupons`. |

## Exports in detail

### `AdminPromos` {#component-admin-promos}

*React component · default export*

Route component for `/admin/coupons`.

```ts
function AdminPromos(): Element
```

Takes no props.

**Returns** `Element` &mdash; The promos page.

Takes its whole state from [`useAdminPromos`](../admin-features/features-admin-promo-use-admin-promo.md#hook-use-admin-promos) and wires it to three
children: [`PromoToolbar`](../admin-components/components-admin-promos-promo-toolbar.md#component-promo-toolbar) (search box and "Add promo"),
[`PromoTable`](../admin-components/components-admin-promos-promos-table.md#component-promo-table) (the rows) and [`PromoDialog`](../admin-components/components-admin-promos-promo-dialog.md#component-promo-dialog) (create and edit).

The `onOpenChange` handler passed to the dialog is asymmetric on purpose:
closing routes through `closePromoDialog`, which also clears `editingPromo`,
so the next "Add promo" opens a blank form rather than the last edited one.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/pages/admin/Promos.tsx#L50)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/pages/admin/Promos.tsx)
