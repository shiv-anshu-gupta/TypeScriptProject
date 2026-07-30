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

type CategoryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onSaved: () => Promise<void>;
};

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
                setImageFile(event.target.files?.[0] ?? null)
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
                    setImageFile(event.target.files?.[0] ?? null)
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
