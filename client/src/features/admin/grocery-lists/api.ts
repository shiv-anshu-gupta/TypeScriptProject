import { apiGet, apiPatch, apiPost } from "@/lib/api";
import type {
  AddGroceryListItemBody,
  AdminConversationsResponse,
  AdminGroceryListsResponse,
  ChatMessage,
  ChatMessagesResponse,
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

export async function markAdminGroceryListPaid(listId: string) {
  return apiPatch<AdminGroceryListsResponse>(
    `/admin/grocery-lists/${listId}/mark-paid`,
  );
}

export async function setAdminGroceryListItemAvailability(
  listId: string,
  index: number,
  available: boolean,
) {
  return apiPatch<AdminGroceryListsResponse, { available: boolean }>(
    `/admin/grocery-lists/${listId}/items/${index}/availability`,
    { available },
  );
}

export async function addAdminGroceryListItem(
  listId: string,
  body: AddGroceryListItemBody,
) {
  return apiPost<AdminGroceryListsResponse, AddGroceryListItemBody>(
    `/admin/grocery-lists/${listId}/items`,
    body,
  );
}

export async function getAdminConversations() {
  return apiGet<AdminConversationsResponse>(
    "/admin/grocery-lists/conversations",
  );
}

export async function getAdminGroceryListMessages(listId: string) {
  return apiGet<ChatMessagesResponse>(
    `/admin/grocery-lists/${listId}/messages`,
  );
}

export async function sendAdminGroceryListMessage(listId: string, text: string) {
  return apiPost<ChatMessage, { text: string }>(
    `/admin/grocery-lists/${listId}/messages`,
    { text },
  );
}
