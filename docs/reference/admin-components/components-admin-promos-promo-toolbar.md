# PromoToolbar `promo-toolbar`

The controls above the promos table: a search box and an "Add promo" button.

|  |  |
|---|---|
| Kind | TypeScript module (JSX) |
| Path | `client/src/components/admin/promos/promo-toolbar.tsx` |
| Group | [Admin panel — components](index.md) |
| Exports | 1 |

## Description

Fully controlled — it owns no state and calls no API. The search value lives
in `useAdminPromos`.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`PromoToolbar`](#component-promo-toolbar) | React component | `function PromoToolbar(props: PromoToolbarProps): Element` | Search field plus "Add promo" button. |

## Exports in detail

### `PromoToolbar` {#component-promo-toolbar}

*React component · default export*

Search field plus "Add promo" button.

```ts
function PromoToolbar(props: PromoToolbarProps): Element
```

| Prop | Type | Meaning |
|---|---|---|
| `onAddPromo` | `() => void` | — |
| `onSearchChange` | `(value: string) => void` | — |
| `search` | `string` | — |

**Returns** `Element` &mdash; The toolbar row.

Every keystroke calls `onSearchChange` — there is no debounce, because the
filter is client-side and matches the `code` field only
(`filteredPromos` in `useAdminPromos`). Nothing is sent to the server
while the admin types.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/admin/promos/promo-toolbar.tsx#L47)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/components/admin/promos/promo-toolbar.tsx)
