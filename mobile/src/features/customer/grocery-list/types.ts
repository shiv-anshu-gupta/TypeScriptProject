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

// A photo the customer sent with the list. Only the address comes back; the
// file itself lives on Cloudinary.
export type GroceryListPhoto = {
  url: string;
};

export type CustomerGroceryList = {
  _id: string;
  code: string;
  items: GroceryListItem[];
  // Missing on lists sent before photos existed.
  photos?: GroceryListPhoto[];
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

// What the photo upload answers with, and what goes back with the list.
export type UploadedPhoto = {
  url: string;
  publicId: string;
};

export type SubmitGroceryListBody = {
  items: Array<{
    name: string;
    quantity: string;
  }>;
  photos?: UploadedPhoto[];
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
