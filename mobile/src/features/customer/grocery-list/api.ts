import { apiGet, apiPatch, apiPost } from "@/lib/api";
import type {
  ReadPhotoResponse,
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

// Reading a photo means a call to a vision model on the server; that takes
// several seconds, well past the ordinary request timeout.
const READ_PHOTO_TIMEOUT_MS = 60000;

// Send a photo of a handwritten list up to be READ, and get the items back as
// text for the customer's own list. The photo is not stored anywhere - not on
// the server, not in the order - so this is the only moment it exists beyond
// the phone.
export async function readListPhotos(uris: string[]) {
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

  return apiPost<ReadPhotoResponse, FormData>(
    "/customer/grocery-lists/read-photo",
    form,
    { timeout: READ_PHOTO_TIMEOUT_MS },
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
