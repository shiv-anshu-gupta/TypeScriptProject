/**
 * The promo-code admin screen: a searchable table of promos plus a create/edit
 * dialog.
 *
 * @remarks
 * The route is `/admin/coupons` (`client/src/router.tsx`), the sidebar label is
 * "Coupons" (`client/src/components/admin/common/sidebar.tsx`) and the heading
 * rendered here is "Promos". The three names refer to the same thing.
 *
 * All state and all server calls live in {@link useAdminPromos}; this module is
 * layout only. There is no polling and no optimistic update — every mutation
 * waits for the server and replaces the whole list.
 *
 * Maintenance note: no consumer of these promo codes could be found in this
 * repository. The mobile app's core flow is "the customer writes a free-text
 * grocery list and the shop prices it", which never reads a promo. The page and
 * its server routes are live, but nothing in the repo is known to redeem a code.
 *
 * @packageDocumentation
 */

import PromoDialog from "@/components/admin/promos/promo-dialog";
import PromoToolbar from "@/components/admin/promos/promo-toolbar";
import PromoTable from "@/components/admin/promos/promos-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminPromos } from "@/features/admin/promo/use-admin-promo";

const pageWrapClass = "space-y-6 p-6";

const cardClass = "border-border bg-card shadow-sm";

const cardHeaderClass = "space-y-4";

const cardTitleClass = "text-xl";

/**
 * Route component for `/admin/coupons`.
 *
 * @remarks
 * Takes its whole state from {@link useAdminPromos} and wires it to three
 * children: {@link PromoToolbar} (search box and "Add promo"),
 * {@link PromoTable} (the rows) and {@link PromoDialog} (create and edit).
 *
 * The `onOpenChange` handler passed to the dialog is asymmetric on purpose:
 * closing routes through `closePromoDialog`, which also clears `editingPromo`,
 * so the next "Add promo" opens a blank form rather than the last edited one.
 *
 * @returns The promos page.
 */
function AdminPromos() {
  const {
    search,
    setSearch,
    promos,
    loading,
    promoDialogOpen,
    setPromoDialogOpen,
    editingPromo,
    openCreateDialog,
    closePromoDialog,
    savePromo,
    removePromo,
    saving,
    deletingPromoId,
    openEditDialog,
  } = useAdminPromos();

  return (
    <div className={pageWrapClass}>
      <Card className={cardClass}>
        <CardHeader className={cardHeaderClass}>
          <CardTitle className={cardTitleClass}>Promos</CardTitle>
          <PromoToolbar
            search={search}
            onSearchChange={setSearch}
            onAddPromo={openCreateDialog}
          />
        </CardHeader>

        <CardContent>
          <PromoTable
            promos={promos}
            loading={loading}
            deletingPromoId={deletingPromoId}
            onEdit={openEditDialog}
            onDelete={removePromo}
          />
        </CardContent>
      </Card>

      <PromoDialog
        open={promoDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closePromoDialog();
            return;
          }
          setPromoDialogOpen(true);
        }}
        promo={editingPromo}
        saving={saving}
        onSaved={savePromo}
      />
    </div>
  );
}

export default AdminPromos;
