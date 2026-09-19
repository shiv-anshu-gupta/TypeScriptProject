/**
 * The product create/edit form: its state, its image rules, its validation and
 * its save and delete calls.
 *
 * @remarks
 * This is where the only defence against oversized product uploads lives.
 * Images are compressed in the browser by `client/src/lib/image.ts` and then
 * held to a hard 1 MB per file. That is a deliberate choice about speed, not
 * the last line of defence: the server caps each file at 5 MB and accepts only
 * JPEG, PNG and WebP.
 *
 * @packageDocumentation
 */

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { compressImages, MAX_IMAGE_BYTES, formatBytes } from "@/lib/image";
import type { Product, ProductFormState, ProductImage } from "./types";
import {
  createAdminProduct,
  deleteAdminProduct,
  updateAdminProduct,
} from "./api";

/**
 * Arguments to {@link useProductForm}.
 *
 * @remarks
 * `product` doubles as the mode switch: `null` means create, anything else
 * means edit. `open` is used only as a reset trigger — the hook keeps running
 * while the dialog is closed.
 */
type UseProductFormOptions = {
  open: boolean;
  product: Product | null;
  onSaved: () => Promise<void>;
  onClose: () => void;
};

/**
 * The blank form used in create mode.
 *
 * @remarks
 * Defaults are `unit: "piece"`, `unitValue: "1"` and `status: "active"`, so a
 * new product is visible in the mobile app as soon as it is saved. `stock`
 * starts empty rather than `"0"`, and `validate` rejects an empty value, so
 * the admin has to type a number.
 */
function getEmptyForm(): ProductFormState {
  return {
    title: "",
    description: "",
    category: "",
    brand: "",
    unit: "piece",
    unitValue: "1",
    stock: "",
    status: "active",
    existingImages: [],
    newFiles: [],
    coverImagePublicId: "",
  };
}

/**
 * Picks the picture to show as a product's cover.
 *
 * @remarks
 * The image flagged `isCover`, else the first in the array. Returns
 * `undefined` when the product has no images, so callers must guard — both
 * `products-table.tsx` and `mapProductToFormValues` do.
 *
 * This is the single definition of "cover" on the admin side; the table and
 * the form both call it, so they cannot disagree.
 */
export function getCoverImage(images: ProductImage[] = []) {
  return images.find((img) => img.isCover) ?? images[0];
}

/**
 * Turns a saved product into editable form values.
 *
 * @remarks
 * Numbers become strings because the inputs are controlled text fields.
 * Products saved before `unit` and `unitValue` existed fall back to `piece`
 * and `1`. The cover is resolved through {@link getCoverImage}, so opening and
 * re-saving a product with no flagged cover promotes its first image.
 */
function mapProductToFormValues(product: Product): ProductFormState {
  const cover = getCoverImage(product.images);

  return {
    title: product.title,
    description: product.description,
    category: product.category._id,
    brand: product.brand,
    unit: product.unit ?? "piece",
    unitValue: String(product.unitValue ?? 1),
    stock: String(product.stock),
    status: product.status,
    existingImages: product.images ?? [],
    newFiles: [],
    coverImagePublicId: cover?.publicId ?? "",
  };
}

/**
 * Drives the product dialog: form state, image handling, validation, save and
 * delete.
 *
 * @remarks
 * Form state is reset whenever `open` or `product` changes — to the product's
 * values in edit mode, to a blank form in create mode. Nothing is persisted,
 * so closing the dialog discards unsaved edits and every picked file.
 *
 * Images. `addFiles` runs each picked file through `compressImages`
 * (`client/src/lib/image.ts`: longest side 1600 px, re-encoded as JPEG at
 * quality 0.8), then applies a hard `MAX_IMAGE_BYTES` (1 MB) cap. The check is
 * **per file**: an over-limit image is dropped with its own toast while the
 * rest of the selection is still added. Compression is best-effort — GIFs and
 * non-raster files pass through untouched — which is why the cap exists as a
 * separate step. The server enforces neither size nor type on this route, so
 * this is the only gate; if the limit is ever raised, add a server-side
 * `fileSize` at the same time.
 *
 * `removeExistingImage` drops an image by `publicId` and, when that image was
 * the cover, promotes whichever image is then first. Removal only takes effect
 * on save: the surviving list is sent as `existingImages`.
 *
 * Saving. `validate` mirrors the server's requirements and runs first so the
 * admin gets an instant toast instead of a round-trip 400; it requires title,
 * description, category, brand, a numeric stock and at least one image.
 * `submit` then calls `PUT /admin/products/:id` in edit mode or
 * `POST /admin/products` otherwise, awaits `onSaved` (the page's `refreshAll`)
 * and closes the dialog. Nothing is applied optimistically.
 *
 * Deleting. `removeProduct` is behind a `window.confirm` naming the product,
 * then `DELETE /admin/products/:id`, then the same refresh-and-close.
 *
 * Errors from any call surface as a toast carrying the server's message.
 *
 * @returns The form state, the `saving` and `deleting` flags, `isEditMode`,
 * and the field, image, submit and delete handlers.
 */
export function useProductForm({
  open,
  onClose,
  onSaved,
  product,
}: UseProductFormOptions) {
  const [form, setForm] = useState<ProductFormState>(getEmptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setForm(product ? mapProductToFormValues(product) : getEmptyForm());
  }, [open, product]);

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;

    // Shrink before they ever hit the network, so large camera photos don't
    // exceed the host's upload limit (the "Network error" cause).
    const compressed = await compressImages(Array.from(files));

    // Hard 1 MB cap — reject anything still too large even after compression.
    const accepted: File[] = [];
    for (const file of compressed) {
      if (file.size > MAX_IMAGE_BYTES) {
        toast.error(
          `Image is too large (${formatBytes(file.size)}). Each image must be under 1 MB.`,
        );
      } else {
        accepted.push(file);
      }
    }

    if (!accepted.length) return;

    setForm((prev) => ({
      ...prev,
      newFiles: [...prev.newFiles, ...accepted],
    }));
  }

  function updateField<K extends keyof ProductFormState>(
    key: K,
    value: ProductFormState[K],
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function removeExistingImage(publicId: string) {
    setForm((prev) => {
      const nextImages = prev.existingImages.filter(
        (image) => image.publicId !== publicId,
      );

      const nextCoverImageId =
        prev.coverImagePublicId === publicId
          ? (nextImages[0]?.publicId ?? "")
          : prev.coverImagePublicId;

      return {
        ...prev,
        existingImages: nextImages,
        coverImagePublicId: nextCoverImageId,
      };
    });
  }

  function changeCoverImage(publicId: string) {
    updateField("coverImagePublicId", publicId);
  }

  // Catch the common problems on the client so the admin gets instant, clear
  // feedback instead of a round-trip 400. Mirrors the server's requirements.
  function validate(): string | null {
    if (!form.title.trim()) return "Title is required";
    if (!form.description.trim()) return "Description is required";
    if (!form.category) return "Please choose a category";
    if (!form.brand.trim()) return "Brand is required";
    if (form.stock === "" || Number.isNaN(Number(form.stock)))
      return "Stock must be a number";
    const totalImages = form.existingImages.length + form.newFiles.length;
    if (totalImages === 0) return "Add at least one image";
    return null;
  }

  async function submit() {
    const problem = validate();
    if (problem) {
      toast.error(problem);
      return;
    }

    try {
      setSaving(true);

      if (product) {
        await updateAdminProduct(
          product._id,
          {
            title: form.title.trim(),
            description: form.description.trim(),
            category: form.category,
            brand: form.brand.trim(),
            unit: form.unit,
            unitValue: Number(form.unitValue) || 1,
            stock: Number(form.stock),
            status: form.status,
            existingImages: form.existingImages,
            coverImagePublicId: form.coverImagePublicId || undefined,
          },
          form.newFiles,
        );
      } else {
        await createAdminProduct(
          {
            title: form.title.trim(),
            description: form.description.trim(),
            category: form.category,
            brand: form.brand.trim(),
            unit: form.unit,
            unitValue: Number(form.unitValue) || 1,
            stock: Number(form.stock),
            status: form.status,
          },
          form.newFiles,
        );
      }

      toast.success(product ? "Product updated" : "Product created");
      await onSaved();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save the product",
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeProduct() {
    if (!product) return;

    const confirmed = window.confirm(
      `Delete "${product.title}" permanently? This cannot be undone.`,
    );

    if (!confirmed) return;

    try {
      setDeleting(true);
      await deleteAdminProduct(product._id);
      toast.success("Product deleted");
      await onSaved();
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not delete the product",
      );
    } finally {
      setDeleting(false);
    }
  }

  return {
    form,
    saving,
    deleting,
    isEditMode: !!product,
    addFiles,
    submit,
    removeProduct,
    updateField,
    removeExistingImage,
    changeCoverImage,
  };
}
