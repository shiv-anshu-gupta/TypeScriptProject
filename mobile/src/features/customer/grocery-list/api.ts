import { apiGet, apiPatch, apiPost } from "@/lib/api";
import type {
  CustomerGroceryList,
  CustomerGroceryListsResponse,
  PayOnlineResponse,
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

export async function startGroceryListOnlinePayment(listId: string) {
  return apiPost<PayOnlineResponse>(
    `/customer/grocery-lists/${listId}/pay-online`,
  );
}

export async function confirmGroceryListPayment(
  listId: string,
  body: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  },
) {
  return apiPost<CustomerGroceryList, typeof body>(
    `/customer/grocery-lists/${listId}/confirm-payment`,
    body,
  );
}
