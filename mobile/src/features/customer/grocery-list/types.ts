/**
 * The shapes of a sent list, its chat, and what comes back from reading a
 * photo.
 *
 * @remarks
 * These mirror the server's documents, so `_id` and ISO date strings appear
 * as the server sends them rather than being mapped on the way in.
 *
 * @packageDocumentation
 */

/**
 * The statuses an order passes through while it is still in progress, in
 * order. Used by the Home journey card, the Lists "Active" tab and the
 * timeline, so they can never disagree about what counts as active.
 *
 * @remarks
 * The order is the timeline's order, so it can be rendered by iterating this
 * rather than by listing the steps again.
 *
 * `completed` and `cancelled` are deliberately absent: an order that has
 * reached either is finished and is not tracked.
 */
export const ACTIVE_STATUSES = [
  "received",
  "priced",
  "packing",
  "packed",
  "ready",
] as const;

/**
 * Every status an order can hold.
 *
 * @remarks
 * The shop moves it forward from the admin panel; the app only reads it. The
 * customer's own actions — paying, removing an item — do not change it.
 */
export type GroceryListStatus =
  | "received"
  | "priced"
  | "packing"
  | "packed"
  | "ready"
  | "completed"
  | "cancelled";

/**
 * How the customer said they would pay.
 *
 * @remarks
 * `online` is a leftover from the gateway this app no longer has; live orders
 * are `upi` or `at_shop`. It is what the customer intends, not proof of
 * anything — {@link GroceryListPaymentStatus} is what says whether money
 * arrived.
 */
export type GroceryListPaymentMethod = "online" | "upi" | "at_shop";
/**
 * Whether the shop has the money.
 *
 * @remarks
 * Only the shopkeeper sets this, by hand, once the payment lands in their own
 * UPI app or at the counter. The UPI deep link has no callback, so nothing in
 * this app can move it.
 */
export type GroceryListPaymentStatus = "pending" | "paid";

/**
 * One line of a sent list.
 *
 * @remarks
 * `quantity` is the free text the customer wrote — it is read, not parsed.
 *
 * `rate` and `price` are filled in by the shop when it prices the list, so
 * before that they are absent or zero and must not be shown as a real price.
 * `available` is the shop saying it could not supply this line.
 */
export type GroceryListItem = {
  name: string;
  quantity: string;
  rate?: number;
  price: number;
  available?: boolean;
};

/**
 * One order, as the customer sees it.
 *
 * @remarks
 * `code` is the short human reference the customer and shopkeeper say aloud;
 * `_id` is what the API takes. They are not interchangeable.
 *
 * `totalAmount` is 0 until the shop prices the list, so the pay buttons check
 * the status rather than the amount.
 *
 * `seenByCustomer` drives the "new update" badge and is cleared by a PATCH,
 * not by rendering.
 *
 * The `…At` timestamps are set as the order passes each stage and stay unset
 * before it, which is how the timeline knows how far it has got.
 */
export type CustomerGroceryList = {
  _id: string;
  code: string;
  items: GroceryListItem[];
  totalItems: number;
  totalAmount: number;
  status: GroceryListStatus;
  paymentMethod: GroceryListPaymentMethod;
  paymentStatus: GroceryListPaymentStatus;
  seenByCustomer: boolean;
  note: string;
  pricedAt?: string | null;
  packedAt?: string | null;
  readyAt?: string | null;
  completedAt?: string | null;
  paidAt?: string | null;
  createdAt: string;
};

/**
 * Where a UPI payment goes.
 *
 * @remarks
 * `id` is the shop's VPA. It can be empty, meaning the shop has not set UPI
 * up — the pay button says so rather than opening an app with nowhere to
 * send money.
 */
export type ShopUpi = {
  id: string;
  name: string;
};

/**
 * The body of `GET /customer/grocery-lists`.
 *
 * @remarks
 * Deliberately more than the lists: one request answers the badge, the pay
 * button and the send flow's "do we know this customer's number" question.
 *
 * `customerPhone` is `""` when there is none on file.
 */
export type CustomerGroceryListsResponse = {
  items: CustomerGroceryList[];
  unseenCount: number;
  upi: ShopUpi;
  customerPhone: string;
};

/**
 * One item read off a photo of a handwritten list. It is a SUGGESTION: it
 * lands on the customer's own list, in an editable line, so they can correct
 * anything the reader misheard before the shop sees it.
 *
 * @remarks
 * `confidence` is the reader's own opinion. Nothing filters on it at present;
 * every line reaches the paper, because the customer is a better judge of
 * their own handwriting than the model is.
 */
export type ScannedItem = {
  name: string;
  quantity: string;
  confidence: "high" | "medium" | "low";
};

/**
 * The body of the read-photo endpoint.
 *
 * @remarks
 * `readable` false is a normal answer, not an error: the request succeeded
 * and there was simply no list in the picture. Check it before looking at
 * `items`.
 */
export type ReadPhotoResponse = {
  // False when the photo held no readable list at all (a blurry snap, a
  // picture of something else).
  readable: boolean;
  items: ScannedItem[];
};

/**
 * What is sent to the shop.
 *
 * @remarks
 * Text only. There is no image field and never was — a photo is read into
 * lines on the phone and discarded before this is built.
 *
 * `phone` is needed only on a first send; afterwards the server has it.
 */
export type SubmitGroceryListBody = {
  items: Array<{
    name: string;
    quantity: string;
  }>;
  note?: string;
  phone?: string;
};

/**
 * Chat: one message on an order's conversation.
 *
 * @remarks
 * `sender` says which side of the sheet it is drawn on. `senderName` is who
 * at the shop wrote it, which matters when more than one person answers.
 */
export type ChatMessage = {
  _id: string;
  sender: "customer" | "staff";
  senderName: string;
  text: string;
  createdAt: string;
};

/**
 * The body of the messages endpoint.
 *
 * @remarks
 * The whole conversation each time, oldest first — there is no paging, since
 * one order's chat is short.
 */
export type ChatMessagesResponse = {
  messages: ChatMessage[];
};
