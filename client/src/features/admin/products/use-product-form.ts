import { useEffect, useState } from "react";
import type { Product, ProductFormState, ProductImage } from "./types";
import {
  createAdminProduct,
  deleteAdminProduct,
  updateAdminProduct,
} from "./api";

type UseProductFormOptions = {
  open: boolean;
  product: Product | null;
  onSaved: () => Promise<void>;
  onClose: () => void;
};

function getEmptyForm(): ProductFormState {
  return {
    title: "",
    description: "",
    category: "",
    brand: "",
    unit: "piece",
    stock: "",
    status: "active",
    existingImages: [],
    newFiles: [],
    coverImagePublicId: "",
  };
}

export function getCoverImage(images: ProductImage[] = []) {
  return images.find((img) => img.isCover) ?? images[0];
}

function mapProductToFormValues(product: Product): ProductFormState {
  const cover = getCoverImage(product.images);

  return {
    title: product.title,
    description: product.description,
    category: product.category._id,
    brand: product.brand,
    unit: product.unit ?? "piece",
    stock: String(product.stock),
    status: product.status,
    existingImages: product.images ?? [],
    newFiles: [],
    coverImagePublicId: cover?.publicId ?? "",
  };
}

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

  function addFiles(files: FileList | null) {
    if (!files?.length) return;

    setForm((prev) => ({
      ...prev,
      newFiles: [...prev.newFiles, ...Array.from(files)],
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

  async function submit() {
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
            stock: Number(form.stock),
            status: form.status,
          },
          form.newFiles,
        );
      }

      await onSaved();
      onClose();
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
      await onSaved();
      onClose();
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
