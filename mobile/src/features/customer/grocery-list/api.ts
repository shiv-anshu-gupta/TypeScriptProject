/**
 * Everything the customer does with a list once it has left the phone:
 * sending it, reading it back, chatting about it, paying for it.
 *
 * @remarks
 * Every call here needs a bearer token and acts on the signed-in customer.
 * The server scopes each list to its owner, so a list id from another account
 * answers as not found rather than as someone else's shopping.
 *
 * @packageDocumentation
 */

import { apiGet, apiPatch, apiPost } from "@/lib/api";
import type {
  ReadPhotoResponse,
  ChatMessage,
  ChatMessagesResponse,
  CustomerGroceryList,
  CustomerGroceryListsResponse,
  SubmitGroceryListBody,
} from "./types";

/**
 * `POST /customer/grocery-lists` — sends the list to the shop.
 *
 * @remarks
 * The one write that matters. `phone` is only needed the first time; the
 * server keeps it against the account afterwards.
 *
 * The shop may not get a new order. If the customer already has a list the
 * shop has not priced yet, the server appends to that one instead, and says
 * so with `merged` — the customer is told "added to your list", not "sent".
 *
 * @returns The created or extended list, with `merged` set when it was
 * appended to an existing one.
 * @throws Error When signed out, or the server rejects the items.
 */
export async function submitGroceryList(body: SubmitGroceryListBody) {
  // `merged` is true when the server appended these items to an existing
  // not-yet-priced list instead of creating a new one.
  return apiPost<
    CustomerGroceryList & { merged?: boolean },
    SubmitGroceryListBody
  >("/customer/grocery-lists", body);
}

/**
 * How long a photo read may take, in milliseconds.
 *
 * @remarks
 * Reading a photo means a call to a vision model on the server; that takes
 * several seconds, well past the ordinary request timeout.
 *
 * Three times the app's 20 s default, and deliberately generous: a timeout
 * here costs the customer the photo they just took.
 */
const READ_PHOTO_TIMEOUT_MS = 60000;

/**
 * `POST /customer/grocery-lists/read-photo` — multipart, 60 s.
 *
 * @remarks
 * Send a photo of a handwritten list up to be READ, and get the items back as
 * text for the customer's own list. The photo is not stored anywhere - not on
 * the server, not in the order - so this is the only moment it exists beyond
 * the phone.
 *
 * Nothing about it reaches an order: what is sent later is the text the
 * customer has since been able to correct.
 *
 * @param uris - Local file URIs from the camera or the gallery, at most
 * `MAX_PHOTOS_PER_SCAN`. The type is guessed from the extension, PNG or JPEG.
 * @returns `readable` false when the photo held no list at all, and otherwise
 * the items read, each with the reader's own confidence.
 * @throws Error On a timeout as well as on a refusal — 60 s is generous but a
 * bad connection can still exceed it.
 */
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

/**
 * `GET /customer/grocery-lists` — every list this customer has sent.
 *
 * @remarks
 * Carries more than the lists: the shop's UPI details for the pay button, the
 * number of updates the customer has not seen, and the customer's own saved
 * mobile number. The send flow calls it for that last field alone, to find
 * out whether it needs to ask for a number.
 *
 * @returns `{ items, unseenCount, upi, customerPhone }`. `customerPhone` is
 * `""` when the customer has none on file.
 * @throws Error When signed out, or the request fails.
 */
export async function getCustomerGroceryLists() {
  return apiGet<CustomerGroceryListsResponse>("/customer/grocery-lists");
}

/**
 * `PATCH /customer/grocery-lists/:id/seen` — clears the "new update" badge.
 *
 * @remarks
 * Call it only when the customer can actually see the list. An off-screen tab
 * stays mounted in this app, so a card that marks itself seen without
 * checking focus clears a badge nobody saw.
 *
 * @returns The updated list.
 * @throws Error On any failure — callers ignore it, since a badge that
 * clears late is better than an interruption.
 */
export async function markGroceryListSeen(listId: string) {
  return apiPatch<CustomerGroceryList>(
    `/customer/grocery-lists/${listId}/seen`,
  );
}

/**
 * `PATCH /customer/grocery-lists/:id/pay-at-shop` — says the customer will
 * pay at the counter.
 *
 * @remarks
 * A statement of intent, not a payment: it sets the order's payment method so
 * the shopkeeper knows not to wait for a UPI transfer. Nothing is charged
 * here and nothing is charged later by the app.
 *
 * @returns The updated list.
 * @throws Error When the server refuses — a list that is already paid, for
 * instance.
 */
export async function payGroceryListAtShop(listId: string) {
  return apiPatch<CustomerGroceryList>(
    `/customer/grocery-lists/${listId}/pay-at-shop`,
  );
}

/**
 * `PATCH /customer/grocery-lists/:id/remove-item` — drops one line from a
 * list already sent.
 *
 * @remarks
 * Addressed by **position**, not by name or id, so the index must come from
 * the list as it is now. Re-read it at the moment of confirming rather than
 * when a dialog opened, and let only one removal be in flight at a time, or a
 * second removal will delete the wrong line.
 *
 * The server decides whether it is allowed at all — only before packing, and
 * never after payment.
 *
 * @returns The whole updated list, with the total recalculated, so the caller
 * can replace its stale copy rather than patching it.
 * @throws Error When the server refuses, with a message worth showing.
 */
export async function removeGroceryListItem(listId: string, index: number) {
  return apiPatch<CustomerGroceryList, { index: number }>(
    `/customer/grocery-lists/${listId}/remove-item`,
    { index },
  );
}

/**
 * `GET /customer/grocery-lists/:id/messages` — the conversation about one
 * order.
 *
 * @remarks
 * There is no push channel for chat, so the sheet polls this every five
 * seconds — and only while it is open.
 *
 * @returns `{ messages }`, oldest first.
 * @throws Error When signed out, or the request fails.
 */
export async function getGroceryListMessages(listId: string) {
  return apiGet<ChatMessagesResponse>(
    `/customer/grocery-lists/${listId}/messages`,
  );
}

/**
 * `POST /customer/grocery-lists/:id/messages` — says something to the shop
 * about one order.
 *
 * @returns The stored message, with the id and timestamp the server gave it —
 * which is what an optimistic sender replaces its placeholder with.
 * @throws Error When the send fails; the caller rolls its placeholder back.
 */
export async function sendGroceryListMessage(listId: string, text: string) {
  return apiPost<ChatMessage, { text: string }>(
    `/customer/grocery-lists/${listId}/messages`,
    { text },
  );
}
