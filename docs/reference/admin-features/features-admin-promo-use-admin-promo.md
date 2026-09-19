# useAdminPromos `use-admin-promo`

State and server calls for the `/admin/coupons` (Promos) page.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `client/src/features/admin/promo/use-admin-promo.ts` |
| Group | [Admin panel — features and hooks](index.md) |
| Exports | 1 |

## Description

Everything the page does lives here: loading the list, the client-side search
filter, the create/edit dialog and the delete confirmation. The page itself
is layout only.

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`useAdminPromos`](#hook-use-admin-promos) | Hook | `function useAdminPromos(): { … }` | Drives the Promos page. |

## Exports in detail

### `useAdminPromos` {#hook-use-admin-promos}

*Hook*

Drives the Promos page.

```ts
function useAdminPromos(): {
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  promos: Promo[];
  loading: boolean;
  promoDialogOpen: boolean;
  setPromoDialogOpen: Dispatch<SetStateAction<boolean>>;
  editingPromo: Promo | null;
  openCreateDialog: () => void;
  closePromoDialog: () => void;
  refreshAll: () => Promise<void>;
  savePromo: (values: PromoFormValues) => Promise<void>;
  removePromo: (promoId: string) => Promise<void>;
  saving: boolean;
  deletingPromoId: string;
  openEditDialog: (promo: Promo) => void;
}
```

**Returns** `{ search: string; setSearch: Dispatch<SetStateAction<…>>; promos: Promo[]; loading: boolean; promoDialogOpen …` &mdash; The filtered promo list plus the flags and callbacks the page and its children need. Note that `promos` is the **filtered** array, not the raw one.

Fetches `GET /admin/promos` once on mount. There is **no polling**, so the
list only changes when this admin acts or reloads the page; a promo added
from another browser will not appear.

There are **no optimistic updates**. Each mutation awaits the server, which
answers with the full list, and that array replaces state wholesale — no
per-row patching.

Search is client-side and matches the `code` field only, case-insensitively,
via `includes`. Nothing else in the row is searchable, and no request is made
while typing.

Errors are not handled. `refreshAll`, `savePromo` and `removePromo` use
`try`/`finally` without a `catch`, so a rejected API call clears the loading
or saving flag and then propagates. `PromoDialog.submit` catches its own
rejection into `console.log`, so a failed save is invisible in the UI; a
failed initial load or delete surfaces as an unhandled rejection.

Local-only state: `search`, `promoDialogOpen`, `editingPromo`, `saving` and
`deletingPromoId`. None of it is persisted.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/promo/use-admin-promo.ts#L49)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/client/src/features/admin/promo/use-admin-promo.ts)
