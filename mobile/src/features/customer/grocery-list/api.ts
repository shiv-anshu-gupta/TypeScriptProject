import { apiGet, apiPatch, apiPost } from "@/lib/api";
import type {
  UploadedPhoto,
  ChatMessage,
  ChatMessagesResponse,
  CustomerGroceryList,
  CustomerGroceryListsResponse,
  SubmitGroceryListBody,
} from "./types";

export async function submitGroceryList(body: SubmitGroceryListBody) {
  // `merged` is true when the server appended these items to an existing
  // not-yet-priced list instead of creating a new one.
  return apiPost<
    CustomerGroceryList & { merged?: boolean },
    SubmitGroceryListBody
  >("/customer/grocery-lists", body);
}

// Upload the photos picked for a list. Sent as a file upload; the server
// answers with the addresses to send back with the list itself.
export async function uploadListPhotos(uris: string[]) {
  const form = new FormData();
  uris.forEach((uri, index) => {
    const extension = uri.split(".").pop()?.toLowerCase();
    const type = extension === "png" ? "image/png" : "image/jpeg";
    form.append("photos", {
      uri,
      name: `list-photo-${index + 1}.${extension === "png" ? "png" : "jpg"}`,
      type,
      // React Native's FormData takes this shape, which TypeScript's DOM
      // definition of FormData doesn't know about.
    } as unknown as Blob);
  });

  return apiPost<{ photos: UploadedPhoto[] }, FormData>(
    "/customer/grocery-lists/photos",
    form,
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

export async function getGroceryListMessages(listId: string) {
  return apiGet<ChatMessagesResponse>(
    `/customer/grocery-lists/${listId}/messages`,
  );
}

export async function sendGroceryListMessage(listId: string, text: string) {
  return apiPost<ChatMessage, { text: string }>(
    `/customer/grocery-lists/${listId}/messages`,
    { text },
  );
}
