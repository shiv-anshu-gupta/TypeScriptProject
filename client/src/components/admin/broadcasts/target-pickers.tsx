/**
 * Searchable pickers for the category or product a broadcast opens.
 *
 * @remarks
 * Both reuse the products feature's endpoints (`getAdminCategories`,
 * `getAdminProducts`), the same ones the banner edit dialog uses.
 *
 * @packageDocumentation
 */
import { useEffect, useMemo, useState } from "react";
import { Check, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { getAdminProducts } from "@/features/admin/products/api";
import type { Category, Product } from "@/features/admin/products/types";

/** One row of a picker's result list. */
type PickerRow = { id: string; label: string };

/** Search box plus a scrollable list of choices. */
function PickerList({
  inputId,
  placeholder,
  search,
  onSearch,
  rows,
  emptyText,
  selectedId,
  onPick,
}: {
  inputId: string;
  placeholder: string;
  search: string;
  onSearch: (value: string) => void;
  rows: PickerRow[];
  emptyText: string;
  selectedId?: string;
  onPick: (row: PickerRow) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={inputId}
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder={placeholder}
          className="pl-8"
          autoComplete="off"
        />
      </div>
      <ul className="max-h-48 overflow-y-auto rounded-md border border-border">
        {!rows.length ? (
          <li className="px-3 py-2 text-sm text-muted-foreground">{emptyText}</li>
        ) : (
          rows.map((row) => {
            const picked = row.id === selectedId;
            return (
              <li key={row.id}>
                <button
                  type="button"
                  onClick={() => onPick(row)}
                  aria-pressed={picked}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-muted ${
                    picked ? "bg-muted font-semibold" : ""
                  }`}
                >
                  <span className="truncate">{row.label}</span>
                  {picked ? <Check className="size-4 shrink-0 text-primary" /> : null}
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}

/**
 * Category picker. Filters the already-loaded category list in the browser.
 */
export function CategoryPicker({
  categories,
  loading,
  selectedId,
  onPick,
}: {
  categories: Category[];
  loading: boolean;
  selectedId?: string;
  onPick: (category: { _id: string; name: string }) => void;
}) {
  const [search, setSearch] = useState("");
  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return categories
      .filter((category) => !term || category.name.toLowerCase().includes(term))
      .map((category) => ({ id: category._id, label: category.name }));
  }, [categories, search]);

  return (
    <PickerList
      inputId="broadcast-category-search"
      placeholder="Search categories"
      search={search}
      onSearch={setSearch}
      rows={rows}
      emptyText={loading ? "Loading…" : "No categories found"}
      selectedId={selectedId}
      onPick={(row) => onPick({ _id: row.id, name: row.label })}
    />
  );
}

/**
 * Product picker. Searches on the server (debounced 300 ms) and lists only
 * active products — a notification must not open something customers cannot
 * see.
 */
export function ProductPicker({
  selectedId,
  onPick,
}: {
  selectedId?: string;
  onPick: (product: { _id: string; title: string }) => void;
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const products = await getAdminProducts(search);
        if (!cancelled) {
          setResults(products.filter((product) => product.status === "active").slice(0, 20));
        }
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search]);

  return (
    <PickerList
      inputId="broadcast-product-search"
      placeholder="Search products"
      search={search}
      onSearch={setSearch}
      rows={results.map((product) => ({ id: product._id, label: product.title }))}
      emptyText={loading ? "Searching…" : "No active products found"}
      selectedId={selectedId}
      onPick={(row) => onPick({ _id: row.id, title: row.label })}
    />
  );
}
