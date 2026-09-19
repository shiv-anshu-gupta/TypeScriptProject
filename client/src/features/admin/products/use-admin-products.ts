/**
 * State for the `/admin/products` page: the product list, the category list
 * and the two dialogs.
 *
 * @remarks
 * There is no store and no polling here — everything lives in component state
 * inside {@link useAdminProducts} and is lost on unmount.
 *
 * @packageDocumentation
 */

import { useCallback, useEffect, useState } from "react";
import type { Category, Product } from "./types";
import { getAdminCategories, getAdminProducts } from "./api";

/**
 * Loads products and categories for the products page and owns its dialog
 * state.
 *
 * @remarks
 * Fetching:
 *
 * - Categories load once on mount via `GET /admin/categories`.
 * - Products load through a `setTimeout` keyed on `search`, so the request is
 *   **debounced by 250 ms**; the timer is cleared on every keystroke. Each run
 *   issues `GET /admin/products?search=…`, so filtering is server-side.
 * - There is **no polling**. Another device's change is invisible until
 *   something calls `refreshAll` or the page is reloaded.
 *
 * Mutations happen inside the dialogs, not here. They call `refreshAll` on
 * success, which refetches both lists in parallel with the current search term
 * still applied. Nothing is updated optimistically, so a row only changes once
 * the server has answered.
 *
 * A failed product fetch is swallowed with a `console.log` and leaves the
 * previous array in place, so a broken request looks like an unchanged table
 * rather than an error.
 *
 * `loading` is only raised by the product fetch; the category fetch has no
 * loading flag and no error handling, so a category failure rejects into an
 * unhandled promise.
 *
 * Local-only state: `search`, the debounce timer, both dialog open flags and
 * `editingProduct` (`null` means the dialog is in create mode).
 *
 * @returns The two lists, the loading flag, `refreshAll`, and the dialog
 * open/close helpers the page wires to the toolbar and the table.
 */
export function useAdminProducts() {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setcategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryDialogOpen, setcategoryDialogOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const loadCategories = useCallback(async () => {
    const data = await getAdminCategories();
    setcategories(data ?? []);
  }, []);

  const loadProducts = useCallback(async (searchValue = "") => {
    setLoading(true);

    try {
      const data = await getAdminProducts(searchValue);
      setProducts(data ?? []);
    } catch {
      console.log("fetching failed");
    } finally {
      setLoading(false);
    }
  }, []);

  function openCreateDialog() {
    setEditingProduct(null);
    setProductDialogOpen(true);
  }

  function openEditDialog(product: Product) {
    setEditingProduct(product);
    setProductDialogOpen(true);
  }

  function closeProductDialog() {
    setProductDialogOpen(false);
    setEditingProduct(null);
  }

  const refreshAll = useCallback(async () => {
    await Promise.all([loadCategories(), loadProducts(search)]);
  }, [loadCategories, loadProducts, search]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadProducts(search);
    }, 250);

    return () => clearTimeout(timer);
  }, [search, loadProducts]);

  return {
    search,
    setSearch,
    products,
    categories,
    loading,
    refreshAll,
    categoryDialogOpen,
    setcategoryDialogOpen,
    productDialogOpen,
    setProductDialogOpen,
    editingProduct,
    openCreateDialog,
    closeProductDialog,
    openEditDialog,
  };
}
