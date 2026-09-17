// The statuses an order passes through while it is still in progress, in
// order. Used by the Home journey card, the Lists "Active" tab and the
// timeline, so they can never disagree about what counts as active.
export const ACTIVE_STATUSES = [
  "received",
  "priced",
  "packing",
  "packed",
  "ready",
] as const;

export type GroceryListStatus =
  | "received"
  | "priced"
  | "packing"
  | "packed"
  | "ready"
  | "completed"
  | "cancelled";

export type GroceryListPaymentMethod = "online" | "upi" | "at_shop";
export type GroceryListPaymentStatus = "pending" | "paid";

export type GroceryListItem = {
  name: string;
  quantity: string;
  rate?: number;
  price: number;
  available?: boolean;
};

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

export type ShopUpi = {
  id: string;
  name: string;
};

export type CustomerGroceryListsResponse = {
  items: CustomerGroceryList[];
  unseenCount: number;
  upi: ShopUpi;
  customerPhone: string;
};

// One item read off a photo of a handwritten list. It is a SUGGESTION: it
// lands on the customer's own list, in an editable line, so they can correct
// anything the reader misheard before the shop sees it.
export type ScannedItem = {
  name: string;
  quantity: string;
  confidence: "high" | "medium" | "low";
};

export type ReadPhotoResponse = {
  // False when the photo held no readable list at all (a blurry snap, a
  // picture of something else).
  readable: boolean;
  items: ScannedItem[];
};

export type SubmitGroceryListBody = {
  items: Array<{
    name: string;
    quantity: string;
  }>;
  note?: string;
  phone?: string;
};

// Chat: one message on an order's conversation.
export type ChatMessage = {
  _id: string;
  sender: "customer" | "staff";
  senderName: string;
  text: string;
  createdAt: string;
};

export type ChatMessagesResponse = {
  messages: ChatMessage[];
};
