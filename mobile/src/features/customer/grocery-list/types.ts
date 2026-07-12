export type GroceryListStatus =
  | "received"
  | "priced"
  | "packing"
  | "packed"
  | "ready"
  | "completed"
  | "cancelled";

export type GroceryListPaymentMethod = "online" | "at_shop";
export type GroceryListPaymentStatus = "pending" | "paid";

export type GroceryListItem = {
  name: string;
  quantity: string;
  price: number;
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

export type CustomerGroceryListsResponse = {
  items: CustomerGroceryList[];
  unseenCount: number;
};

export type SubmitGroceryListBody = {
  items: Array<{
    name: string;
    quantity: string;
  }>;
  note?: string;
};

export type PayOnlineResponse = {
  razorpay: {
    keyId: string;
    orderId: string;
    amount: number;
    currency: string;
  };
  list: CustomerGroceryList;
};
