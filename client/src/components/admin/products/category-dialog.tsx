/**
 * The "Manage Categories" dialog: add, rename, re-image and delete categories.
 *
 * @remarks
 * Unlike the product dialog, this one has no hook — all its state and all its
 * requests sit in the component.
 *
 * @packageDocumentation
 */

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  createAdminCategory,
  deleteAdminCategory,
  updateAdminCategory,
} from "@/features/admin/products/api";
import type { Category } from "@/features/admin/products/types";
import { compressImage, MAX_IMAGE_BYTES, formatBytes } from "@/lib/image";
import { Camera, Pencil, Search, Tag, Trash2 } from "lucide-react";
import { useState } from "react";

const dialogContentClass = "flex max-h-[90vh] flex-col sm:max-w-xl";

const contentWrap = "flex min-h-0 flex-1 flex-col gap-4";

const formRow = "flex gap-3";

const categoriesList =
  "min-h-0 flex-1 space-y-2 overflow-y-auto rounded-xl border border-border bg-muted/30 p-2";

const categoryRow =
  "flex items-center justify-between rounded-xl border border-border bg-card px-3 py-3";

const categoryInfo = "flex items-center gap-2";

const categoryIcon = "h-4 w-4 text-muted-foreground";

const categoryName = "text-sm font-medium text-foreground";

const editButtonClass = "h-4 w-4";

const deleteButtonClass = "h-4 w-4 text-destructive";

const rowActions = "flex items-center gap-1";

const errorTextClass = "text-sm text-destructive";

/**
 * Props for {@link CategoryDialog}.
 *
 * @param categories - The full list, owned by the page. The dialog never
 * fetches it; it re-reads the prop after `onSaved` refreshes upstream.
 * @param onSaved - Awaited after every successful create, update or delete.
 * The page passes `refreshAll`, so the product list picks up renamed
 * categories too.
 */
type CategoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onSaved: () => Promise<void>;
};

/**
 * Dialog for managing product categories.
 *
 * @remarks
 * One text field doubles as create and rename: pressing the pencil on a row
 * loads it into `editingCategory`, after which the button reads "Update" and
 * calls `PUT /admin/categories/:id` instead of `POST /admin/categories`. Both
 * go as multipart form-data so an optional image can ride along; the mobile
 * app shows that image as a circle on the Shop tab.
 *
 * Images are compressed by `compressImage` (`client/src/lib/image.ts`) and
 * then held to a hard 1 MB. Unlike the product form, a single file is in play,
 * so an over-limit image is refused with an inline error and the selection is
 * cleared. The server applies no size or MIME check on this route, so this is
 * the only limit. The "Take photo" button carries `capture="environment"` and
 * opens the rear camera directly on a phone.
 *
 * The search box filters the array **in the browser** — no request is made,
 * which is the opposite of the products search on the page behind it. The
 * count beside "All categories" always reflects the unfiltered list.
 *
 * Deleting asks through `window.confirm`, then calls
 * `DELETE /admin/categories/:id`. The server refuses to delete a category that
 * still has products, and its message is shown verbatim in the error line, so
 * do not swap it for a generic string. Deleting the row currently being edited
 * also resets the form.
 *
 * All state is local and dropped when the dialog closes: `name`, `imageFile`,
 * `editingCategory`, `saving`, `deletingCategoryId`, `error` and `filter`.
 * Nothing is applied optimistically — the list only changes once `onSaved`
 * has refetched.
 */
export function CategoryDialog({
  open,
  onOpenChange,
  categories,
  onSaved,
}: CategoryDialogProps) {
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");

  const query = filter.trim().toLowerCase();
  const visibleCategories = query
    ? categories.filter((cat) => cat.name.toLowerCase().includes(query))
    : categories;

  // Shrink the picked image before it is uploaded (avoids the host's upload
  // size limit that surfaces as a bare "Network error").
  async function pickImage(file: File | null) {
    if (!file) {
      setImageFile(null);
      return;
    }

    const compressed = await compressImage(file);

    // Hard 1 MB cap even after compression.
    if (compressed.size > MAX_IMAGE_BYTES) {
      setError(
        `Image is too large (${formatBytes(compressed.size)}). It must be under 1 MB.`,
      );
      setImageFile(null);
      return;
    }

    setError("");
    setImageFile(compressed);
  }

  async function handleSave() {
    if (!name.trim()) return;

    try {
      setSaving(true);
      setError("");

      if (editingCategory) {
        await updateAdminCategory(
          editingCategory._id,
          { name: name.trim() },
          imageFile,
        );
      } else {
        await createAdminCategory({ name: name.trim() }, imageFile);
      }

      setName("");
      setImageFile(null);
      setEditingCategory(null);
      await onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(categoryToDelete: Category) {
    const confirmed = window.confirm(
      `Delete the category "${categoryToDelete.name}"?`,
    );

    if (!confirmed) return;

    try {
      setDeletingCategoryId(categoryToDelete._id);
      setError("");

      await deleteAdminCategory(categoryToDelete._id);

      // If the row being edited was the one deleted, reset the form.
      if (editingCategory?._id === categoryToDelete._id) {
        setEditingCategory(null);
        setName("");
      }

      await onSaved();
    } catch (err) {
      // The server refuses to delete a category that still has products.
      setError(
        err instanceof Error ? err.message : "Failed to delete category",
      );
    } finally {
      setDeletingCategoryId("");
    }
  }

  function handleEdit(getCurrentCategory: Category) {
    setEditingCategory(getCurrentCategory);
    setName(getCurrentCategory.name);
    setImageFile(null);
  }

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) {
      setName("");
      setImageFile(null);
      setEditingCategory(null);
      setError("");
      setFilter("");
    }

    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={dialogContentClass}>
        <DialogHeader>
          <DialogTitle>Manage Categories</DialogTitle>
        </DialogHeader>

        <div className={contentWrap}>
          <div className={formRow}>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter category name you want to add!!!"
            />
            <Button onClick={handleSave} disabled={saving || !name.trim()}>
              {editingCategory ? "Update" : "Add"}
            </Button>
          </div>

          {/* Optional category image — shown as a circle in the mobile app */}
          <div className="flex items-center gap-3">
            {editingCategory?.imageUrl && !imageFile ? (
              <img
                src={editingCategory.imageUrl}
                alt={editingCategory.name}
                className="h-10 w-10 rounded-full border border-border object-cover"
              />
            ) : null}
            <Input
              type="file"
              accept="image/*"
              onChange={(event) =>
                void pickImage(event.target.files?.[0] ?? null)
              }
            />
            {/* Opens the phone camera directly (no-op difference on desktop) */}
            <Button type="button" variant="outline" asChild>
              <label className="cursor-pointer">
                <Camera className="mr-1.5 h-4 w-4" />
                Take photo
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(event) =>
                    void pickImage(event.target.files?.[0] ?? null)
                  }
                />
              </label>
            </Button>
          </div>
          {imageFile ? (
            <p className="text-xs text-muted-foreground">
              Selected: {imageFile.name}
            </p>
          ) : null}

          {error ? <p className={errorTextClass}>{error}</p> : null}

          <Separator />

          {/* Header + search so a long list (40+) stays manageable */}
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-foreground">
              All categories
              <span className="ml-1.5 text-muted-foreground">
                ({categories.length})
              </span>
            </p>
            <div className="relative w-44">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                placeholder="Search…"
                className="h-9 pl-8"
              />
            </div>
          </div>

          {/* Fixed-height scroll area — the dialog no longer grows with the list */}
          <div className={categoriesList}>
            {visibleCategories.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                {query
                  ? `No category matches “${filter.trim()}”.`
                  : "No categories yet."}
              </p>
            ) : (
              visibleCategories.map((cat) => (
                <div key={cat._id} className={categoryRow}>
                  <div className={categoryInfo}>
                    {cat.imageUrl ? (
                      <img
                        src={cat.imageUrl}
                        alt={cat.name}
                        className="h-8 w-8 rounded-full border border-border object-cover"
                      />
                    ) : (
                      <Tag className={categoryIcon} />
                    )}
                    <span className={categoryName}>{cat.name}</span>
                  </div>

                  <div className={rowActions}>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(cat)}
                    >
                      <Pencil className={editButtonClass} />
                    </Button>

                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={deletingCategoryId === cat._id}
                      onClick={() => void handleDelete(cat)}
                    >
                      <Trash2 className={deleteButtonClass} />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
