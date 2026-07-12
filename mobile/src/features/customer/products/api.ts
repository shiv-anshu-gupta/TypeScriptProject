import { apiGet } from "@/lib/api";
import type {
  CustomerProduct,
  CustomerProductDetailsResponse,
  GetCustomerProductsParams,
  ProductCategory,
} from "./types";

export async function getCustomerCategories() {
  return apiGet<ProductCategory[]>("/customer/categories");
}

export async function getCustomerProducts(params?: GetCustomerProductsParams) {
  const query: string[] = [];

  if (params?.category) query.push(`category=${encodeURIComponent(params.category)}`);
  if (params?.brand) query.push(`brand=${encodeURIComponent(params.brand)}`);
  if (params?.color) query.push(`color=${encodeURIComponent(params.color)}`);
  if (params?.size) query.push(`size=${encodeURIComponent(params.size)}`);
  if (params?.sort) query.push(`sort=${encodeURIComponent(params.sort)}`);

  const queryString = query.join("&");

  const url = queryString
    ? `/customer/products?${queryString}`
    : `/customer/products`;

  return apiGet<CustomerProduct[]>(url);
}

export async function getCustomerProductDetails(productId: string) {
  return apiGet<CustomerProductDetailsResponse>(
    `/customer/products/${productId}`,
  );
}
