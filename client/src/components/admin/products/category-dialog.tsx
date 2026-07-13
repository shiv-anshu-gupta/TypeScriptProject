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
import { Pencil, Tag, Trash2 } from "lucide-react";
import { useState } from "react";

const dialogContentClass = "sm:max-w-xl";

const contentWrap = "space-y-4";

const formRow = "flex gap-3";

const categoriesList = "space-y-2";

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
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState("");
  const [error, setError] = useState("");

  async function handleSave() {
    if (!name.trim()) return;

    try {
      setSaving(true);
      setError("");

      if (editingCategory) {
        await updateAdminCategory(editingCategory._id, { name: name.trim() });
      } else {
        await createAdminCategory({ name: name.trim() });
      }

      setName("");
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
  }

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) {
      setName("");
      setEditingCategory(null);
      setError("");
    }

    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={dialogContentClass}>
        <DialogHeader>
          <DialogTitle>Manage Catgories</DialogTitle>
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

          {error ? <p className={errorTextClass}>{error}</p> : null}

          <Separator />

          <div className={categoriesList}>
            {categories.map((cat) => (
              <div key={cat._id} className={categoryRow}>
                <div className={categoryInfo}>
                  <Tag className={categoryIcon} />
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
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
