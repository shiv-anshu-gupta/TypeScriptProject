/**
 * The `/admin/products` screen — the shop's catalogue for the mobile app's
 * Shop tab.
 *
 * @remarks
 * Routed at `/admin/products` behind `ProtectedLayout` and
 * `RoleGuardLayout allow={["admin"]}` (`client/src/router.tsx`).
 *
 * This file is layout only. All state and every request live in
 * `useAdminProducts`; the two dialogs own their own save and delete calls.
 *
 * @packageDocumentation
 */

import { CategoryDialog } from "@/components/admin/products/category-dialog";
import { ProductDialog } from "@/components/admin/products/product-dialog";
import { ProductsTable } from "@/components/admin/products/products-table";
import { ProductToolbar } from "@/components/admin/products/products-toolbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminProducts } from "@/features/admin/products/use-admin-products";

const pageWrap = "space-y-6 p-6";

const cardClass = "border-border bg-card shadow-sm";

const cardHeaderClass = "space-y-4";

const cardTitleClass = "text-xl";

const cardContentClass = "space-y-4";

/**
 * Renders the products card — toolbar plus table — and mounts both dialogs.
 *
 * @remarks
 * Composition only: it reads everything from `useAdminProducts` and passes it
 * down. Typing in the toolbar sets `search`, which the hook debounces by
 * 250 ms before re-issuing `GET /admin/products?search=`. Both dialogs are
 * always mounted and toggled by their `open` prop.
 *
 * Both dialogs get `refreshAll` as `onSaved`, so any save or delete refetches
 * the products and the categories together. Nothing here updates
 * optimistically and there is no polling.
 *
 * The product dialog's `onOpenChange` routes a close through
 * `closeProductDialog` so `editingProduct` is cleared — without that, the next
 * "Add Product" would open on the last edited row.
 *
 * The default export is what `router.tsx` imports.
 */
function AdminProducts() {
  const {
    search,
    setSearch,
    products,
    categories,
    loading,
    categoryDialogOpen,
    setcategoryDialogOpen,
    productDialogOpen,
    setProductDialogOpen,
    editingProduct,
    openCreateDialog,
    closeProductDialog,
    refreshAll,
    openEditDialog,
  } = useAdminProducts();

  return (
    <div className={pageWrap}>
      <Card className={cardClass}>
        <CardHeader className={cardHeaderClass}>
          <CardTitle className={cardTitleClass}>Products</CardTitle>
          <ProductToolbar
            search={search}
            onSearchChange={setSearch}
            onManageCategories={() => setcategoryDialogOpen(true)}
            onAddProduct={openCreateDialog}
          />
        </CardHeader>
        <CardContent className={cardContentClass}>
          <ProductsTable
            loading={loading}
            products={products}
            onEdit={openEditDialog}
          />
        </CardContent>
      </Card>

      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setcategoryDialogOpen}
        categories={categories}
        onSaved={refreshAll}
      />

      <ProductDialog
        open={productDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeProductDialog();
            return;
          }

          setProductDialogOpen(true);
        }}
        categories={categories}
        product={editingProduct}
        onSaved={refreshAll}
      />
    </div>
  );
}

export default AdminProducts;
