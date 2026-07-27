import { apiGet, apiPatch, apiPost } from "@/lib/api";
import type {
  CustomerGroceryList,
  CustomerGroceryListsResponse,
  SubmitGroceryListBody,
} from "./types";

export async function submitGroceryList(body: SubmitGroceryListBody) {
  return apiPost<CustomerGroceryList, SubmitGroceryListBody>(
    "/customer/grocery-lists",
    body,
  );
}

export async function getCustomerGroceryLists() {
  return apiGet<CustomerGroceryListsResponse>("/customer/grocery-lists");
}

export async function markGroceryListSeen(listId: string) {
  return apiPatch<CustomerGroceryList>(
    `/customer/grocery-lists/${listId}/seen`,
  );
}

export async function payGroceryListAtShop(listId: string) {
  return apiPatch<CustomerGroceryList>(
    `/customer/grocery-lists/${listId}/pay-at-shop`,
  );
}

export async function removeGroceryListItem(listId: string, index: number) {
  return apiPatch<CustomerGroceryList, { index: number }>(
    `/customer/grocery-lists/${listId}/remove-item`,
    { index },
  );
}
