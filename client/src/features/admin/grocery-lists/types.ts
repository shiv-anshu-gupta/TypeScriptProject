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
  rate?: number;
  price: number;
  available?: boolean;
};

// A photo the customer attached to the list — a snap of a handwritten list or
// of the packet they want. Cloudinary https url, up to 3 per list.
export type GroceryListPhoto = {
  url: string;
};

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

export type AdminConversationsResponse = {
  conversations: AdminConversation[];
};

export type AdminGroceryList = {
  _id: string;
  code: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: AdminGroceryListItem[];
  // Optional: lists sent before photos existed come back without the field,
  // so never index into it without a fallback.
  photos?: GroceryListPhoto[];
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
  items: Array<{ price: number; rate?: number }>;
};

export type AddGroceryListItemBody = {
  name: string;
  quantity: string;
};

// One item the AI photo reader suggests from a handwritten-list photo.
// Suggestions are a draft: the shopkeeper reviews and confirms before any of
// them reach the list.
export type ParsedPhotoItem = {
  name: string;
  quantity: string;
  confidence: "high" | "medium" | "low";
};

export type ParsePhotosResponse = {
  suggestions: ParsedPhotoItem[];
};

export type BulkAddItemsBody = {
  items: Array<{ name: string; quantity: string }>;
};

export type UpdateGroceryListStatusBody = {
  status: Exclude<GroceryListStatus, "received" | "priced">;
};
