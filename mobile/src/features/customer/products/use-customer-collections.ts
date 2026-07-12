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

// React Native has no URL/search-params, so filter state lives in local state
// instead of the query string (the only behavioural difference from web).
export function useCustomerProductList(initialCategory?: string) {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [products, setProducts] = useState<CustomerProduct[]>([]);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState<CustomerProductFilters>({
    ...emptyFilters,
    category: initialCategory || "",
  });
  const [sort, setSort] = useState<ProductSort>("recent");

  const query = useMemo<GetCustomerProductsParams>(
    () => ({
      category: filters.category || undefined,
      brand: filters.brand || undefined,
      color: filters.color || undefined,
      size: filters.size || undefined,
      sort,
    }),
    [filters, sort],
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
    async function loadColors() {
      try {
        const data = await getCustomerProducts();
        const unique = new Set<string>();
        (data ?? []).forEach((item) =>
          item.colors.forEach((color) => unique.add(color)),
        );
        setAvailableColors(
          Array.from(unique).sort((a, b) => a.localeCompare(b)),
        );
      } catch {
        setAvailableColors([]);
      }
    }
    void loadColors();
  }, []);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const data = await getCustomerProducts(query);
        setProducts(data ?? []);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    void loadProducts();
  }, [query]);

  return {
    categories,
    products,
    loading,
    filters,
    sort,
    hasActiveFilters,
    changeSort,
    availableColors,
    toggleFacet,
    clearFilters,
    activeFilterBadges,
  };
}
