import { create } from "zustand";
import type { CustomerGroceryList, SubmitGroceryListBody } from "./types";
import {
  confirmGroceryListPayment,
  getCustomerGroceryLists,
  markGroceryListSeen,
  payGroceryListAtShop,
  startGroceryListOnlinePayment,
  submitGroceryList,
} from "./api";
import { toast } from "@/lib/toast";
import { openRazorpayCheckout } from "@/lib/razorpay";

type CustomerGroceryListStore = {
  items: CustomerGroceryList[];
  unseenCount: number;
  loading: boolean;
  submitting: boolean;
  payingListId: string;
  loadLists: () => Promise<void>;
  submitList: (body: SubmitGroceryListBody) => Promise<boolean>;
  markSeen: (listId: string) => Promise<void>;
  payAtShop: (listId: string) => Promise<void>;
  payOnline: (listId: string) => Promise<void>;
  clear: () => void;
};

export const useCustomerGroceryListStore = create<CustomerGroceryListStore>(
  (set, get) => ({
    items: [],
    unseenCount: 0,
    loading: false,
    submitting: false,
    payingListId: "",

    loadLists: async () => {
      try {
        set({ loading: true });
        const response = await getCustomerGroceryLists();
        set({
          items: response?.items ?? [],
          unseenCount: response?.unseenCount ?? 0,
          loading: false,
        });
      } catch {
        set({ items: [], unseenCount: 0, loading: false });
      }
    },

    submitList: async (body) => {
      try {
        set({ submitting: true });
        await submitGroceryList(body);
        set({ submitting: false });
        toast.success("List sent to the shop");
        await get().loadLists();
        return true;
      } catch (error) {
        set({ submitting: false });
        const message =
          error instanceof Error ? error.message : "Failed to send list";
        toast.error(message);
        return false;
      }
    },

    markSeen: async (listId) => {
      try {
        await markGroceryListSeen(listId);
        set((state) => ({
          items: state.items.map((item) =>
            item._id === listId ? { ...item, seenByCustomer: true } : item,
          ),
          unseenCount: Math.max(state.unseenCount - 1, 0),
        }));
      } catch {
        // a failed badge clear shouldn't interrupt the user
      }
    },

    payAtShop: async (listId) => {
      try {
        set({ payingListId: listId });
        await payGroceryListAtShop(listId);
        set({ payingListId: "" });
        toast.success("You'll pay at the shop on pickup");
        await get().loadLists();
      } catch {
        set({ payingListId: "" });
        toast.error("Failed to update payment method");
      }
    },

    payOnline: async (listId) => {
      try {
        set({ payingListId: listId });

        const session = await startGroceryListOnlinePayment(listId);

        if (!session.razorpay?.keyId || !session.razorpay.orderId) {
          throw new Error("Invalid payment session");
        }

        // Native Razorpay sheet — unavailable in Expo Go (see lib/razorpay).
        const payment = await openRazorpayCheckout({
          key: session.razorpay.keyId,
          amount: session.razorpay.amount,
          currency: session.razorpay.currency,
          order_id: session.razorpay.orderId,
          name: "Monster Grocery",
          description: `List ${session.list.code}`,
          prefill: { name: "", email: "" },
        });

        await confirmGroceryListPayment(listId, {
          razorpay_payment_id: payment.razorpay_payment_id,
          razorpay_order_id: payment.razorpay_order_id,
          razorpay_signature: payment.razorpay_signature,
        });

        set({ payingListId: "" });
        toast.success("Payment successful");
        await get().loadLists();
      } catch (error) {
        set({ payingListId: "" });
        const message =
          error instanceof Error ? error.message : "Payment failed";
        toast.error(message);
      }
    },

    clear: () =>
      set({
        items: [],
        unseenCount: 0,
        loading: false,
        submitting: false,
        payingListId: "",
      }),
  }),
);
