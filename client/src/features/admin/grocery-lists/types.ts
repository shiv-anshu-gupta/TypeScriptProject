/**
 * The shapes behind the shop's daily screen: orders, their items, the chat,
 * and the bodies of the endpoints that change them.
 *
 * @remarks
 * A "grocery list" is the order itself. A customer types items freely in the
 * mobile app — no product catalogue is involved — the shop prices them, and the
 * list moves through a one-way status flow to completion. The Product and Promo
 * pages in this panel play no part in that.
 *
 * These types mirror the server's documents. Do not widen one without checking
 * the matching route, since the server validates independently.
 *
 * @packageDocumentation
 */

/**
 * Where an order has got to.
 *
 * @remarks
 * The flow runs one way and one step at a time:
 * `received → priced → packing → packed → ready → completed`. `cancelled` can
 * be entered from any open stage. `completed` and `cancelled` are terminal —
 * the card disables pricing, item editing and the flow buttons once either is
 * reached.
 *
 * The card enforces "next step only": earlier steps render as ticks and later
 * steps are disabled. An earlier version used buttons that looked like toggles
 * and was misread, so do not restore free movement between statuses here.
 *
 * `received` and `priced` are absent from
 * {@link UpdateGroceryListStatusBody} because neither is set through the
 * status endpoint: `received` is the starting state, and `priced` is set as a
 * side effect of saving prices.
 *
 * Each step sends the customer an Expo push from the server.
 */
export type GroceryListStatus =
  | "received"
  | "priced"
  | "packing"
  | "packed"
  | "ready"
  | "completed"
  | "cancelled";

/** How the customer said they would pay. */
export type GroceryListPaymentMethod = "online" | "upi" | "at_shop";

/**
 * Whether the money has arrived.
 *
 * @remarks
 * Independent of {@link GroceryListStatus}: an order can be completed and still
 * unpaid, or paid while still being packed. The shop marks payment by hand,
 * usually after matching a UPI transfer with the page's amount matcher.
 */
export type GroceryListPaymentStatus = "pending" | "paid";

/**
 * One line of an order.
 *
 * @remarks
 * `name` and `quantity` are the customer's own words, so `quantity` is free
 * text — "2 kg", "half dozen", "1 packet" — and is never parsed as a number for
 * storage. The pricing helper reads only a leading number from it, and treats
 * one as absent.
 *
 * `rate` and `price` are separate on purpose: `rate` is what a unit costs and
 * `price` is what the line costs. Typing a rate fills the price in, but the
 * price can also be typed directly and then no longer matches rate times
 * quantity. `price` is what the customer is charged.
 *
 * `rate` is optional in the type but is in practice always sent: saving prices
 * writes `0` for any line whose rate was never filled in, rather than omitting
 * the field.
 *
 * `available` is also optional, and an absent value means available. When a
 * line is marked unavailable the server forces its `price` to 0 and pushes the
 * customer — but only on the way to unavailable, not on restore.
 */
export type AdminGroceryListItem = {
  name: string;
  quantity: string;
  rate?: number;
  price: number;
  available?: boolean;
};

/**
 * One customer conversation as shown on the Messages page.
 *
 * @remarks
 * A summary row, not the thread: it carries only the last message, so the
 * Messages page can list every conversation from a single request. Opening a
 * row mounts the chat component, which fetches the full thread separately.
 *
 * `sender` on the last message drives two pieces of the row — a `You:` prefix
 * when it was staff, and a "reply" pill when it was the customer and therefore
 * still needs an answer.
 */
export type AdminConversation = {
  listId: string;
  code: string;
  customerName: string;
  customerPhone: string;
  status: GroceryListStatus;
  messageCount: number;
  lastMessage: {
    text: string;
    sender: "customer" | "staff";
    createdAt: string;
  };
};

/** Payload of `GET /admin/grocery-lists/conversations`. */
export type AdminConversationsResponse = {
  conversations: AdminConversation[];
};

/**
 * A complete order, as the grocery-lists page works with it.
 *
 * @remarks
 * `code` is the short human-readable order number shown to the customer and
 * used in the Share message; `_id` is the Mongo id used in every URL and as the
 * key for the pricing drafts and the packing checklist.
 *
 * `totalAmount` is the server's figure. While the shopkeeper is typing, the
 * card shows the sum of the local drafts instead, so the two differ until
 * prices are saved. `totalAmount` greater than zero is also how the card
 * decides a list has been priced, which is what switches the primary button
 * from "Send prices to customer" to "Update prices".
 *
 * The timestamps record when each stage was reached and are nullable because a
 * stage may not have happened. The card shows `updatedAt ?? createdAt`, and
 * adds a "first sent" line when the list was edited on a later day.
 *
 * Note there is no field here for the packing checklist. That state exists only
 * in the shop device's `localStorage`. Moving it to the server would need a new
 * field on {@link AdminGroceryListItem}.
 */
export type AdminGroceryList = {
  _id: string;
  code: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: AdminGroceryListItem[];
  totalItems: number;
  totalAmount: number;
  status: GroceryListStatus;
  paymentMethod: GroceryListPaymentMethod;
  paymentStatus: GroceryListPaymentStatus;
  note: string;
  pricedAt?: string | null;
  packedAt?: string | null;
  readyAt?: string | null;
  completedAt?: string | null;
  paidAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
};

/**
 * Payload of `GET /admin/grocery-lists` — and of every mutation on this page.
 *
 * @remarks
 * Each `PATCH` and `POST` here answers with the whole refreshed array rather
 * than the one record that changed. The hook therefore replaces its state
 * wholesale and never patches a row, which is why nothing on this page is
 * optimistic: the screen catches up only once the server has answered.
 */
export type AdminGroceryListsResponse = {
  items: AdminGroceryList[];
};

/**
 * One chat message between the shop and the customer about an order.
 *
 * @remarks
 * `sender` decides the side and colour of the bubble. `senderName` is shown for
 * customer messages so staff can see who they are talking to.
 */
export type ChatMessage = {
  _id: string;
  sender: "customer" | "staff";
  senderName: string;
  text: string;
  createdAt: string;
};

/** Payload of `GET /admin/grocery-lists/:id/messages`. */
export type ChatMessagesResponse = {
  messages: ChatMessage[];
};

/**
 * Body of `PATCH /admin/grocery-lists/:id/prices`.
 *
 * @remarks
 * The array is positional: entry `n` prices item `n`, so it must always be the
 * full list in order, never just the lines that changed.
 *
 * Saving prices also hard-sets the status to `priced` on the server. Pressing
 * "Update prices" on a list that has already reached `packed` or `ready`
 * therefore drops it back to `priced`, resets the flow buttons, and sends the
 * customer a second "your list is priced" push. The button stays enabled at
 * those stages, so this is reachable by accident.
 */
export type SetGroceryListPricesBody = {
  items: Array<{ price: number; rate?: number }>;
};

/**
 * Body of `POST /admin/grocery-lists/:id/items` and of the item edit.
 *
 * @remarks
 * Both fields are stripped against a Unicode allowlist in the card before they
 * are sent. That allowlist deliberately includes combining marks so Devanagari
 * matras survive; removing them would corrupt Hindi item names. The server
 * applies the same rule, and requires a name of at least two characters.
 */
export type AddGroceryListItemBody = {
  name: string;
  quantity: string;
};

/**
 * Body of `PATCH /admin/grocery-lists/:id/status`.
 *
 * @remarks
 * `received` and `priced` are excluded because neither is reachable through
 * this endpoint. `received` is where a list starts, and `priced` is set as a
 * side effect of saving prices. So the type permits no way back to either, and
 * the only route to `priced` is through the prices endpoint.
 */
export type UpdateGroceryListStatusBody = {
  status: Exclude<GroceryListStatus, "received" | "priced">;
};
