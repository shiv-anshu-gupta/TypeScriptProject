import { apiGet, apiPatch } from "@/lib/api";
import type {
  AdminGroceryListsResponse,
  SetGroceryListPricesBody,
  UpdateGroceryListStatusBody,
} from "./types";

export async function getAdminGroceryLists() {
  return apiGet<AdminGroceryListsResponse>("/admin/grocery-lists");
}

export async function setAdminGroceryListPrices(
  listId: string,
  body: SetGroceryListPricesBody,
) {
  return apiPatch<AdminGroceryListsResponse, SetGroceryListPricesBody>(
    `/admin/grocery-lists/${listId}/prices`,
    body,
  );
}

export async function updateAdminGroceryListStatus(
  listId: string,
  body: UpdateGroceryListStatusBody,
) {
  return apiPatch<AdminGroceryListsResponse, UpdateGroceryListStatusBody>(
    `/admin/grocery-lists/${listId}/status`,
    body,
  );
}
