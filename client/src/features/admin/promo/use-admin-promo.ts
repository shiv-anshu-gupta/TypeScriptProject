/**
 * State and server calls for the `/admin/coupons` (Promos) page.
 *
 * @remarks
 * Everything the page does lives here: loading the list, the client-side search
 * filter, the create/edit dialog and the delete confirmation. The page itself
 * is layout only.
 *
 * @packageDocumentation
 */

import { useEffect, useMemo, useState } from "react";
import type { Promo, PromoFormValues } from "./types";
import {
  createAdminPromo,
  deleteAdminPromo,
  getAdminPromos,
  updateAdminPromo,
} from "./api";

/**
 * Drives the Promos page.
 *
 * @remarks
 * Fetches `GET /admin/promos` once on mount. There is **no polling**, so the
 * list only changes when this admin acts or reloads the page; a promo added
 * from another browser will not appear.
 *
 * There are **no optimistic updates**. Each mutation awaits the server, which
 * answers with the full list, and that array replaces state wholesale — no
 * per-row patching.
 *
 * Search is client-side and matches the `code` field only, case-insensitively,
 * via `includes`. Nothing else in the row is searchable, and no request is made
 * while typing.
 *
 * Errors are not handled. `refreshAll`, `savePromo` and `removePromo` use
 * `try`/`finally` without a `catch`, so a rejected API call clears the loading
 * or saving flag and then propagates. `PromoDialog.submit` catches its own
 * rejection into `console.log`, so a failed save is invisible in the UI; a
 * failed initial load or delete surfaces as an unhandled rejection.
 *
 * Local-only state: `search`, `promoDialogOpen`, `editingPromo`, `saving` and
 * `deletingPromoId`. None of it is persisted.
 *
 * @returns The filtered promo list plus the flags and callbacks the page and its
 * children need. Note that `promos` is the **filtered** array, not the raw one.
 */
export function useAdminPromos() {
  const [search, setSearch] = useState("");
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoDialogOpen, setPromoDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promo | null>(null);
  const [deletingPromoId, setDeletingPromoId] = useState("");
  const [saving, setSaving] = useState(false);

  /**
   * Reloads the whole list from `GET /admin/promos`.
   *
   * @remarks
   * Runs once on mount and is also returned so a caller could refetch, though
   * nothing in the page currently does. Holds `loading` true for the duration.
   * It has no `catch`, so a failed request leaves the previous list in place and
   * the rejection escapes.
   */
  async function refreshAll() {
    try {
      setLoading(true);

      const response = await getAdminPromos();
      setPromos((response ?? { items: [] }).items);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshAll();
  }, []);

  /**
   * The list the table renders: promos whose `code` contains the search text.
   *
   * @remarks
   * Client-side only, case-insensitive, `code` field alone. An empty query
   * returns the original array untouched.
   */
  const filteredPromos = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return promos;

    return promos.filter((promo) => promo.code.toLowerCase().includes(query));
  }, [promos, search]);

  /**
   * Opens the dialog in create mode.
   *
   * @remarks
   * Clears `editingPromo` first, so the dialog's effect seeds a blank form.
   */
  function openCreateDialog() {
    setEditingPromo(null);
    setPromoDialogOpen(true);
  }

  /**
   * Closes the dialog and forgets which promo was being edited.
   *
   * @remarks
   * Clearing `editingPromo` matters: it is what makes the next "Add promo"
   * open blank rather than showing the last edited promo.
   */
  function closePromoDialog() {
    setEditingPromo(null);
    setPromoDialogOpen(false);
  }

  /**
   * Opens the dialog in edit mode for one promo.
   *
   * @param promo - The row that was clicked. Its values seed the form, and its
   * `_id` decides that the save is a PATCH rather than a POST.
   */
  function openEditDialog(promo: Promo) {
    setEditingPromo(promo);
    setPromoDialogOpen(true);
  }

  /**
   * Creates or updates a promo, depending on whether `editingPromo` is set.
   *
   * @remarks
   * PATCHes `/admin/promos/:id` when editing, otherwise POSTs `/admin/promos`.
   * The response is the full list and replaces state; the dialog is then closed
   * and `editingPromo` cleared. No `catch`, so a rejection propagates to the
   * dialog's own `try`/`catch` and the dialog stays open.
   *
   * @param values - The dialog's cleaned form values.
   */
  async function savePromo(values: PromoFormValues) {
    try {
      setSaving(true);

      const response = editingPromo
        ? await updateAdminPromo(editingPromo?._id, values)
        : await createAdminPromo(values);

      setPromos((response ?? { items: [] })?.items);
      closePromoDialog();
    } finally {
      setSaving(false);
    }
  }

  /**
   * Deletes a promo after a browser confirmation.
   *
   * @remarks
   * Gated by `window.confirm`; cancelling returns without a request. The prompt
   * text reads "Are you want to delete this promo" — a known typo, left as-is.
   * On confirm it calls `DELETE /admin/promos/:id` and replaces state with the
   * returned list. `deletingPromoId` is set for the duration so only that row's
   * delete button is disabled.
   *
   * @param promoId - The promo's `_id`.
   */
  async function removePromo(promoId: string) {
    const confirmed = window.confirm("Are you want to delete this promo");

    if (!confirmed) return;

    try {
      setDeletingPromoId(promoId);

      const response = await deleteAdminPromo(promoId);
      setPromos((response ?? { items: [] }).items);
    } finally {
      setDeletingPromoId("");
    }
  }

  return {
    search,
    setSearch,
    promos: filteredPromos,
    loading,
    promoDialogOpen,
    setPromoDialogOpen,
    editingPromo,
    openCreateDialog,
    closePromoDialog,
    refreshAll,
    savePromo,
    removePromo,
    saving,
    deletingPromoId,
    openEditDialog,
  };
}
