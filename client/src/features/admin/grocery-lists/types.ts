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

export type AdminGroceryListItem = {
  name: string;
  quantity: string;
  price: number;
};

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
};

export type AdminGroceryListsResponse = {
  items: AdminGroceryList[];
};

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

export type SetGroceryListPricesBody = {
  items: Array<{ price: number }>;
};

export type UpdateGroceryListStatusBody = {
  status: Exclude<GroceryListStatus, "received" | "priced">;
};
