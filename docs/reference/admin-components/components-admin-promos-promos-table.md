# PromoTable `promos-table`

The promos table: one row per promo code, with edit and delete controls.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `client/src/components/admin/promos/promos-table.tsx` |
| Group | [Admin panel — components](index.md) |
| Exports | 1 |

## Description

Presentational only. It receives the already-filtered list from the page and
raises `onEdit` / `onDelete`; it holds no state and makes no API call.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`PromoTable`](#component-promo-table) | React component | `function PromoTable(props: PromoTableProps): Element` | Renders the promo rows, or a single full-width cell while loading or when the list is empty. |

## Exports in detail

### `PromoTable` {#component-promo-table}

*React component · default export*

Renders the promo rows, or a single full-width cell while loading or when the
list is empty.

```ts
function PromoTable(props: PromoTableProps): Element
```

| Prop | Type | Meaning |
|---|---|---|
| `deletingPromoId` | `string` | Id of the promo whose delete request is in flight. Only that row's delete button is disabled; the rest stay live. |
| `loading` | `boolean` | — |
| `onDelete` | `(promoId: string) => Promise<void>` | — |
| `onEdit` | `(promo: Promo) => void` | — |
| `promos` | `Promo[]` | — |

**Returns** `Element` &mdash; The table.

Columns are code, discount percentage, count, minimum order value, valid
from, valid till, then an edit and a delete button. Dates go through
`formatDateTime`. There is no sorting and no pagination — every promo
the server returned is drawn.

The delete button does not confirm here; the `window.confirm` prompt lives in
`removePromo` inside `useAdminPromos`.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/admin/promos/promos-table.tsx#L87)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/admin/promos/promos-table.tsx)
