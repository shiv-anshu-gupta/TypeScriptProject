/**
 * Every server call the grocery-lists screen makes.
 *
 * @remarks
 * Two things hold for almost all of them, and they shape how the page behaves.
 *
 * First, each mutation answers with the **whole refreshed array of lists**,
 * not the record it changed. The hook substitutes its state wholesale, so
 * nothing here is optimistic and the screen catches up only once the server has
 * replied. The exception is {@link sendAdminGroceryListMessage}, which returns
 * just the created message.
 *
 * Second, several of these make the server send an Expo push to the customer's
 * phone: pricing, every status step, and marking a line unavailable. They are
 * not silent bookkeeping, and pressing one twice notifies twice.
 *
 * @packageDocumentation
 */
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

/**
 * Fetches every grocery list the shop has.
 *
 * @remarks
 * `GET /admin/grocery-lists`. Unfiltered and unpaginated - the whole history
 * arrives in one response, and the status tabs, the amount matcher and the
 * search box all narrow it in the browser.
 *
 * This is the call the hook repeats every 15 seconds while the page is open,
 * and it is also how a newly arrived customer list is noticed.
 *
 * @returns Every list.
 * @throws The server's first error message.
 */
export async function getAdminGroceryLists() {
  return apiGet<AdminGroceryListsResponse>("/admin/grocery-lists");
}

/**
 * Saves the shopkeeper's prices and tells the customer.
 *
 * @remarks
 * `PATCH /admin/grocery-lists/:id/prices`. The most consequential call on this
 * page. On the server it writes every line price, sets `status` to `priced`,
 * stamps `pricedAt`, clears the customer's "seen" flag, and sends the customer
 * an Expo push carrying the new total. That push is awaited rather than left to
 * finish on its own, because the serverless function is frozen as soon as it
 * responds.
 *
 * Two consequences of the hard status write:
 *
 * - It is not idempotent from the customer's point of view. Saving twice sends
 *   two "your list is priced" notifications.
 * - It moves a list *backwards*. A list already at `packed` or `ready` returns
 *   to `priced` and the flow buttons reset. The "Update prices" button stays
 *   enabled at those stages, so this is reachable by accident.
 *
 * @param listId - The list's `_id`.
 * @param body - All line prices, in item order. See
 * {@link SetGroceryListPricesBody}.
 * @returns Every list, refreshed.
 * @throws The server's first error message.
 */
export async function setAdminGroceryListPrices(
  listId: string,
  body: SetGroceryListPricesBody,
) {
  return apiPatch<AdminGroceryListsResponse, SetGroceryListPricesBody>(
    `/admin/grocery-lists/${listId}/prices`,
    body,
  );
}

/**
 * Advances an order one step along the flow, or cancels it.
 *
 * @remarks
 * `PATCH /admin/grocery-lists/:id/status`. The server pushes the customer on
 * each step.
 *
 * The card only ever offers the immediate next step, so this is not a way to
 * jump stages from the UI - though the endpoint itself accepts any allowed
 * status.
 *
 * @param listId - The list's `_id`.
 * @param body - The target status. `received` and `priced` are not reachable
 * here; see {@link UpdateGroceryListStatusBody}.
 * @returns Every list, refreshed.
 * @throws The server's first error message.
 */
export async function updateAdminGroceryListStatus(
  listId: string,
  body: UpdateGroceryListStatusBody,
) {
  return apiPatch<AdminGroceryListsResponse, UpdateGroceryListStatusBody>(
    `/admin/grocery-lists/${listId}/status`,
    body,
  );
}

/**
 * Records that the money for an order has arrived.
 *
 * @remarks
 * `PATCH /admin/grocery-lists/:id/mark-paid`. Payment is tracked separately
 * from the packing flow, so this can be done at any stage once the list is
 * priced, and it does not move the order along.
 *
 * It cannot be undone from this panel - there is no mark-unpaid button - so the
 * card offers it only while the list is priced and still unpaid.
 *
 * Usually reached through the page's amount matcher: the shopkeeper types the
 * sum just received on UPI, sees the unpaid orders of exactly that total, and
 * marks the right one.
 *
 * @param listId - The list's `_id`.
 * @returns Every list, refreshed.
 * @throws The server's first error message.
 */
export async function markAdminGroceryListPaid(listId: string) {
  return apiPatch<AdminGroceryListsResponse>(
    `/admin/grocery-lists/${listId}/mark-paid`,
  );
}

/**
 * Marks one line out of stock, or puts it back.
 *
 * @remarks
 * `PATCH /admin/grocery-lists/:id/items/:index/availability`. Applies at once,
 * with no draft step, unlike prices.
 *
 * Marking a line unavailable forces its price to 0 on the server and pushes the
 * customer to tell them. Restoring does neither - no push is sent on the way
 * back, and any price the line had is already gone.
 *
 * @param listId - The list's `_id`.
 * @param index - Position of the item within `list.items`. Positional, so it
 * would be invalidated by anything that reorders the array.
 * @param available - `false` to mark out of stock.
 * @returns Every list, refreshed.
 * @throws The server's first error message.
 */
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

/**
 * Corrects an existing line's name or quantity.
 *
 * @remarks
 * `PATCH /admin/grocery-lists/:id/items/:index`. For fixing a customer's
 * wording - an unclear abbreviation, a missing unit - without changing how many
 * lines the order has.
 *
 * Because the item count is unchanged, the hook keeps this list's pricing
 * drafts rather than discarding them, so a half-typed price survives the edit.
 *
 * @param listId - The list's `_id`.
 * @param index - Position of the item within `list.items`.
 * @param body - The replacement name and quantity.
 * @returns Every list, refreshed.
 * @throws The server's first error message.
 */
export async function updateAdminGroceryListItem(
  listId: string,
  index: number,
  body: AddGroceryListItemBody,
) {
  return apiPatch<AdminGroceryListsResponse, AddGroceryListItemBody>(
    `/admin/grocery-lists/${listId}/items/${index}`,
    body,
  );
}

/**
 * Appends a line the customer asked for after sending the list.
 *
 * @remarks
 * `POST /admin/grocery-lists/:id/items`. Usually follows a chat message or a
 * phone call.
 *
 * This changes the item count, so the hook drops this list's pricing drafts
 * afterwards and lets the inputs re-seed from the server. Any price typed but
 * not yet saved is lost - save prices before adding an item.
 *
 * @param listId - The list's `_id`.
 * @param body - The new item's name and quantity.
 * @returns Every list, refreshed.
 * @throws The server's first error message.
 */
export async function addAdminGroceryListItem(
  listId: string,
  body: AddGroceryListItemBody,
) {
  return apiPost<AdminGroceryListsResponse, AddGroceryListItemBody>(
    `/admin/grocery-lists/${listId}/items`,
    body,
  );
}

/**
 * Fetches a summary of every customer conversation.
 *
 * @remarks
 * `GET /admin/grocery-lists/conversations`. Backs the Messages page, which
 * repeats it every 15 seconds. Each row carries only the last message; the full
 * thread is fetched separately when a row is opened.
 *
 * @returns One summary per conversation.
 * @throws The server's first error message.
 */
export async function getAdminConversations() {
  return apiGet<AdminConversationsResponse>(
    "/admin/grocery-lists/conversations",
  );
}

/**
 * Fetches the full chat thread for one order.
 *
 * @remarks
 * `GET /admin/grocery-lists/:id/messages`. Called when the chat is opened and
 * then every 5 seconds while it stays open. The whole thread comes back each
 * time - there is no incremental fetch - so the poll re-reads everything.
 *
 * @param listId - The list's `_id`.
 * @returns Every message in the thread.
 * @throws The server's first error message.
 */
export async function getAdminGroceryListMessages(listId: string) {
  return apiGet<ChatMessagesResponse>(
    `/admin/grocery-lists/${listId}/messages`,
  );
}

/**
 * Sends a message from the shop to the customer.
 *
 * @remarks
 * `POST /admin/grocery-lists/:id/messages`. Note that it returns only the
 * created message, not the thread - the one call on this screen that does not
 * answer with a refreshed collection.
 *
 * The chat clears its input before this resolves and puts the text back, with a
 * toast, if it fails. That is the only optimistic behaviour anywhere on this
 * screen.
 *
 * @param listId - The list's `_id`.
 * @param text - The message body.
 * @returns The created message.
 * @throws The server's first error message.
 */
export async function sendAdminGroceryListMessage(listId: string, text: string) {
  return apiPost<ChatMessage, { text: string }>(
    `/admin/grocery-lists/${listId}/messages`,
    { text },
  );
}
