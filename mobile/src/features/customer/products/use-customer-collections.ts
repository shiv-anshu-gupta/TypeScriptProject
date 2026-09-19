/**
 * The Shop screen's data, as a hook rather than a store.
 *
 * @packageDocumentation
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  CustomerProduct,
  GetCustomerProductsParams,
  ProductCategory,
  ProductSort,
} from "./types";
import type {
  ActiveFilterBadge,
  CustomerProductFilters,
  FacetKey,
} from "./product-list.shared";
import { getCustomerCategories, getCustomerProducts } from "./api";

const emptyFilters: CustomerProductFilters = {
  category: "",
  brand: "",
  color: "",
  size: "",
};

/**
 * Loads the categories once, and the products whenever the filters, sort or
 * search change.
 *
 * @remarks
 * React Native has no URL/search-params, so filter state lives in local state
 * instead of the query string (the only behavioural difference from web).
 *
 * A hook, not a store, because one screen uses it — so the filters live and
 * die with that screen instead of leaking into the next visit. The
 * consequence to know: `initialCategory` is read **once**. The Shop tab stays
 * mounted, so a later hand-off from Home has to go through `startFresh`, not
 * through a new argument.
 *
 * Search is debounced by 300 ms, and a request that is superseded before it
 * lands is dropped — a broad search ("m") returns more and can arrive after a
 * narrower one ("milk").
 *
 * Neither fetch throws: a failed category load leaves an empty rail, and a
 * failed product load an empty grid.
 *
 * @param initialCategory - Category id to start filtered by; read on first
 * render only.
 * @returns The data (`categories`, `products`, `loading`), the current
 * `filters`, `sort` and `search`, the setters that change them, and
 * `activeFilterBadges` for showing what is applied.
 */
export function useCustomerProductList(initialCategory?: string) {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<CustomerProduct[]>([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState<CustomerProductFilters>({
    ...emptyFilters,
    category: initialCategory || "",
  });
  const [sort, setSort] = useState<ProductSort>("recent");

  // Free-text search, debounced so we don't hit the API on every keystroke.
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const query = useMemo<GetCustomerProductsParams>(
    () => ({
      category: filters.category || undefined,
      brand: filters.brand || undefined,
      color: filters.color || undefined,
      size: filters.size || undefined,
      search: debouncedSearch || undefined,
      sort,
    }),
    [filters, sort, debouncedSearch],
  );

  const hasActiveFilters = Boolean(
    filters.category || filters.brand || filters.color || filters.size,
  );

  const toggleFacet = useCallback((key: FacetKey, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: prev[key] === value ? "" : value,
    }));
  }, []);

  const changeSort = useCallback((value: ProductSort) => {
    setSort(value);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(emptyFilters);
  }, []);

  // Start a fresh browse when arriving from a shortcut outside Shop (a Home
  // category or search): exactly the given category, or none, with every other
  // filter and any old search text dropped - so the user sees what they tapped,
  // not that narrowed by whatever they picked on a previous visit.
  const startFresh = useCallback((category?: string) => {
    setFilters({ ...emptyFilters, category: category || "" });
    setSearch("");
  }, []);

  const activeFilterBadges = useMemo<ActiveFilterBadge[]>(() => {
    const items: ActiveFilterBadge[] = [];

    if (filters.category) {
      const found = categories.find((item) => item._id === filters.category);
      items.push({
        key: "category",
        label: "Category",
        value: found?.name || filters.category,
      });
    }
    if (filters.brand) {
      items.push({ key: "brand", label: "Brand", value: filters.brand });
    }
    if (filters.color) {
      items.push({ key: "color", label: "Color", value: filters.color });
    }
    if (filters.size) {
      items.push({ key: "size", label: "Size", value: filters.size });
    }

    return items;
  }, [categories, filters]);

  useEffect(() => {
    async function loadCategories() {
      try {
        const data = await getCustomerCategories();
        setCategories(data ?? []);
      } catch {
        setCategories([]);
      }
    }
    void loadCategories();
  }, []);

  useEffect(() => {
    // Answers can arrive out of order: a broad search ("m") returns more data
    // and can land after a narrower one ("milk"), and switching categories
    // quickly does the same. Only the newest request may touch the screen.
    let current = true;

    async function loadProducts() {
      setLoading(true);
      try {
        const data = await getCustomerProducts(query);
        if (current) setProducts(data ?? []);
      } catch {
        if (current) setProducts([]);
      } finally {
        if (current) setLoading(false);
      }
    }
    void loadProducts();
    return () => {
      current = false;
    };
  }, [query]);

  return {
    categories,
    products,
    loading,
    filters,
    sort,
    search,
    setSearch,
    hasActiveFilters,
    changeSort,
    toggleFacet,
    clearFilters,
    startFresh,
    activeFilterBadges,
  };
}
