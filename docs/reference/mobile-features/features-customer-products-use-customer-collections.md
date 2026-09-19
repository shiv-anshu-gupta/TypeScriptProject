# useCustomerProductList `use-customer-collections`

The Shop screen's data, as a hook rather than a store.

|  |  |
|---|---|
| Kind | TypeScript module |
| Path | `mobile/src/features/customer/products/use-customer-collections.ts` |
| Group | [Mobile app — features and state](index.md) |
| Exports | 1 |

## Exports

| Symbol | Kind | Signature | Brief |
|---|---|---|---|
| [`useCustomerProductList`](#hook-use-customer-product-list) | Hook | `function useCustomerProductList( … }` | Loads the categories once, and the products whenever the filters, sort or search change. |

## Exports in detail

### `useCustomerProductList` {#hook-use-customer-product-list}

*Hook*

Loads the categories once, and the products whenever the filters, sort or
search change.

```ts
function useCustomerProductList(
  initialCategory?: string,
): {
  categories: ProductCategory[];
  products: CustomerProduct[];
  loading: boolean;
  filters: CustomerProductFilters;
  sort: "recent";
  search: string;
  setSearch: Dispatch<SetStateAction<string>>;
  hasActiveFilters: boolean;
  changeSort: (value: "recent") => void;
  toggleFacet: (key: FacetKey, value: string) => void;
  clearFilters: () => void;
  startFresh: (category?: string) => void;
  activeFilterBadges: ActiveFilterBadge[];
}
```

| Parameter | Type | Meaning |
|---|---|---|
| `initialCategory?` | `string` | Category id to start filtered by; read on first render only. |

**Returns** `{ categories: ProductCategory[]; products: CustomerProduct[]; loading: boolean; filters: CustomerProductFilt …` &mdash; The data (`categories`, `products`, `loading`), the current `filters`, `sort` and `search`, the setters that change them, and `activeFilterBadges` for showing what is applied.

React Native has no URL/search-params, so filter state lives in local state
instead of the query string (the only behavioural difference from web).

A hook, not a store, because one screen uses it — so the filters live and
die with that screen instead of leaking into the next visit. The
consequence to know: `initialCategory` is read **once**. The Shop tab stays
mounted, so a later hand-off from Home has to go through `startFresh`, not
through a new argument.

Search is debounced by 300 ms, and a request that is superseded before it
lands is dropped — a broad search ("m") returns more and can arrive after a
narrower one ("milk").

Neither fetch throws: a failed category load leaves an empty rail, and a
failed product load an empty grid.

[Source](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/products/use-customer-collections.ts#L55)

---

[View source on GitHub](https://github.com/shiv-anshu-gupta/TypeScriptProject/blob/main/mobile/src/features/customer/products/use-customer-collections.ts)
