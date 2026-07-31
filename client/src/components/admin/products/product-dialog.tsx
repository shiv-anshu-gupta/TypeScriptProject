import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UNIT_OPTIONS } from "@/features/admin/products/constants";
import type {
  Category,
  Product,
  ProductStatus,
  ProductUnit,
} from "@/features/admin/products/types";
import { ImagePicker } from "./image-picker";
import { Button } from "@/components/ui/button";
import { useProductForm } from "@/features/admin/products/use-product-form";

type ProductDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  product: Product | null;
  onSaved: () => Promise<void>;
};

const dialogContentClass = "max-h-[92vh] overflow-y-auto sm:max-w-4xl";

const contentWrapClass = "grid gap-6";

const twoColumnGridClass = "grid gap-4 md:grid-cols-2";

const fieldGroupClass = "space-y-2";

const statusGroupClass =
  "flex gap-6 rounded-xl border border-border bg-card px-4 py-3";

const statusItemClass = "flex items-center space-x-2";

const actionsRowClass = "flex items-center justify-between gap-3";

export function ProductDialog({
  open,
  onOpenChange,
  categories,
  product,
  onSaved,
}: ProductDialogProps) {
  const {
    form,
    saving,
    deleting,
    isEditMode,
    updateField,
    addFiles,
    submit,
    removeProduct,
    removeExistingImage,
    changeCoverImage,
  } = useProductForm({
    open,
    onClose: () => onOpenChange(false),
    onSaved,
    product,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={dialogContentClass}>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Update Product" : "Create Product"}
          </DialogTitle>
        </DialogHeader>
        <div className={contentWrapClass}>
          <div className={twoColumnGridClass}>
            <div className={fieldGroupClass}>
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(event) => updateField("title", event.target.value)}
                placeholder="Title"
              />
            </div>

            <div className={fieldGroupClass}>
              <Label>Brand</Label>
              <Input
                value={form.brand}
                onChange={(event) => updateField("brand", event.target.value)}
                placeholder="e.g. Amul, Fresh Farm, Tata"
              />
            </div>
          </div>
          <div className={fieldGroupClass}>
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              rows={5}
              placeholder="Description"
            />
          </div>

          <div className={twoColumnGridClass}>
            <div className={fieldGroupClass}>
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(val) => updateField("category", val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className={fieldGroupClass}>
              <Label>Status</Label>
              <RadioGroup
                value={form.status}
                onValueChange={(value) =>
                  updateField("status", value as ProductStatus)
                }
                className={statusGroupClass}
              >
                <div className={statusItemClass}>
                  <RadioGroupItem value="active" id="product-status-active" />
                  <Label htmlFor="product-status-active">Active</Label>
                </div>

                <div className={statusItemClass}>
                  <RadioGroupItem
                    value="inactive"
                    id="product-status-inactive"
                  />
                  <Label htmlFor="product-status-inactive">Inactive</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className={twoColumnGridClass}>
            <div className={fieldGroupClass}>
              <Label>Sold per</Label>
              <div className="flex gap-2">
                <Input
                  value={form.unitValue}
                  onChange={(event) =>
                    updateField("unitValue", event.target.value)
                  }
                  type="number"
                  min="0"
                  step="any"
                  placeholder="1"
                  className="w-24"
                />
                <Select
                  value={form.unit}
                  onValueChange={(val) =>
                    updateField("unit", val as ProductUnit)
                  }
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">
                e.g. 10 + kg for a 10&nbsp;kg bag. Keep 1 for loose/single items.
              </p>
            </div>

            <div className={fieldGroupClass}>
              <Label>Stock</Label>
              <Input
                value={form.stock}
                onChange={(e) => updateField("stock", e.target.value)}
                type="number"
                min="0"
                placeholder="0"
              />
            </div>
          </div>

          <ImagePicker
            existingImages={form.existingImages}
            newFiles={form.newFiles}
            coverImagePublicId={form.coverImagePublicId}
            onFilesAdd={addFiles}
            onExistingRemove={removeExistingImage}
            onCoverImageChange={changeCoverImage}
          />

          <div className={actionsRowClass}>
            {isEditMode ? (
              <Button
                variant="destructive"
                onClick={() => void removeProduct()}
                disabled={saving || deleting}
              >
                {deleting ? "Deleting..." : "Delete Product"}
              </Button>
            ) : (
              <span />
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>

              <Button onClick={submit} disabled={saving || deleting}>
                {saving
                  ? "Saving..."
                  : isEditMode
                    ? "Update Product"
                    : "Create Product"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
