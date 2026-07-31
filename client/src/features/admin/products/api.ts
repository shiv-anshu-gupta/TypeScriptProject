import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
import type {
  Category,
  CreateCategoryBody,
  CreateProductBody,
  Product,
  UpdateCategoryBody,
  UpdateProductBody,
} from "./types";

// category
export async function getAdminCategories() {
  return apiGet<Category[]>("/admin/categories");
}

// Categories are sent as multipart form-data because they can carry an
// optional image (shown as circles in the mobile app).
function buildCategoryFormData(
  body: CreateCategoryBody | UpdateCategoryBody,
  image?: File | null,
) {
  const formData = new FormData();
  formData.append("name", body.name);

  if (image) {
    formData.append("image", image);
  }

  return formData;
}

export async function createAdminCategory(
  body: CreateCategoryBody,
  image?: File | null,
) {
  return apiPost<Category, FormData>(
    "/admin/categories",
    buildCategoryFormData(body, image),
  );
}

export async function updateAdminCategory(
  categoryId: string,
  body: UpdateCategoryBody,
  image?: File | null,
) {
  return apiPut<Category, FormData>(
    `/admin/categories/${categoryId}`,
    buildCategoryFormData(body, image),
  );
}

export async function deleteAdminCategory(categoryId: string) {
  return apiDelete<{ _id: string }>(`/admin/categories/${categoryId}`);
}

// products

export async function getAdminProducts(search?: string) {
  const query = search?.trim()
    ? `/admin/products?search=${encodeURIComponent(search.trim())}`
    : `/admin/products`;

  return apiGet<Product[]>(query);
}

export async function getAdminProductById(productId: string) {
  return apiGet<Product>(`/admin/products/${productId}`);
}

function buildProductFormData(
  body: CreateProductBody | UpdateProductBody,
  files: File[],
) {
  const formData = new FormData();
  formData.append("title", body.title);
  formData.append("description", body.description);
  formData.append("category", body.category);
  formData.append("brand", body.brand);
  formData.append("unit", body.unit);
  formData.append("unitValue", String(body.unitValue));
  formData.append("stock", String(body.stock));
  formData.append("status", body.status);

  if ("existingImages" in body && body.existingImages) {
    formData.append("existingImages", JSON.stringify(body.existingImages));
  }

  if ("coverImagePublicId" in body && body.coverImagePublicId) {
    formData.append("coverImagePublicId", body.coverImagePublicId);
  }

  files.forEach((file) => formData.append("images", file));

  return formData;
}

export async function createAdminProduct(
  body: CreateProductBody,
  files: File[],
) {
  const formData = buildProductFormData(body, files);

  return apiPost<Product, FormData>("/admin/products", formData);
}

export async function updateAdminProduct(
  productId: string,
  body: UpdateProductBody,
  files: File[],
) {
  const formData = buildProductFormData(body, files);

  return apiPut<Product, FormData>(`/admin/products/${productId}`, formData);
}

export async function deleteAdminProduct(productId: string) {
  return apiDelete<{ _id: string }>(`/admin/products/${productId}`);
}
