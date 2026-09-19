/**
 * The search box and action buttons above the products table.
 *
 * @remarks
 * Fully controlled and stateless: it holds no search text of its own and makes
 * no requests.
 *
 * @packageDocumentation
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

const wrapperClass =
  "flex flex-col gap-3 md:flex-row md:items-center md:justify-between";

const searchWrapClass = "relative w-full md:w-80";

const searchIconClass =
  "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground";

const searchInputClass = "pl-9";

const actionsWrapClass = "flex flex-col gap-3 sm:flex-row";

const addIconClass = "mr-2 h-4 w-4";

/**
 * Props for {@link ProductToolbar}.
 *
 * @param onSearchChange - Fires on every keystroke. The debounce is not here;
 * `useAdminProducts` waits 250 ms before it turns the value into a request.
 */
type ProductsToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  onManageCategories: () => void;
  onAddProduct: () => void;
};

/**
 * The products search field plus "Manage Category" and "Add Product".
 *
 * @remarks
 * Search is server-side: the typed value travels up to `useAdminProducts`,
 * which debounces it by 250 ms and re-issues
 * `GET /admin/products?search=`. Clearing the box therefore costs one more
 * request rather than restoring a cached list.
 *
 * Note the name mismatch — the component is `ProductToolbar` while its props
 * type is `ProductsToolbarProps` and the file is `products-toolbar.tsx`.
 */
export function ProductToolbar({
  search,
  onSearchChange,
  onManageCategories,
  onAddProduct,
}: ProductsToolbarProps) {
  return (
    <div className={wrapperClass}>
      <div className={searchWrapClass}>
        <Search className={searchIconClass} />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search products"
          className={searchInputClass}
        />
      </div>

      <div className={actionsWrapClass}>
        <Button onClick={onManageCategories} variant="outline">
          Manage Category
        </Button>
        <Button onClick={onAddProduct}>
          <Plus className={addIconClass} />
          Add Product
        </Button>
      </div>
    </div>
  );
}
