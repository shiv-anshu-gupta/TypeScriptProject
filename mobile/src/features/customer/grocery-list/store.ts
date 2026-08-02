import { create } from "zustand";
import type {
  CustomerGroceryList,
  ShopUpi,
  SubmitGroceryListBody,
} from "./types";
import {
  getCustomerGroceryLists,
  markGroceryListSeen,
  payGroceryListAtShop,
  removeGroceryListItem,
  submitGroceryList,
} from "./api";
import { toast } from "@/lib/toast";
import { buildUpiUrl, openUpiPayment } from "@/lib/upi";

const emptyUpi: ShopUpi = { id: "", name: "sKirana" };

type CustomerGroceryListStore = {
  items: CustomerGroceryList[];
  unseenCount: number;
  upi: ShopUpi;
  // The customer's saved mobile number. null = not fetched yet, "" = none on
  // file (prompt for it), otherwise the number.
  customerPhone: string | null;
  loading: boolean;
  submitting: boolean;
  payingListId: string;
  loadLists: () => Promise<void>;
  submitList: (body: SubmitGroceryListBody) => Promise<boolean>;
  markSeen: (listId: string) => Promise<void>;
  removeItem: (listId: string, index: number) => Promise<void>;
  payAtShop: (listId: string) => Promise<void>;
  payViaUpi: (list: CustomerGroceryList) => Promise<void>;
  clear: () => void;
};

export const useCustomerGroceryListStore = create<CustomerGroceryListStore>(
  (set, get) => ({
    items: [],
    unseenCount: 0,
    upi: emptyUpi,
    customerPhone: null,
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
          upi: response?.upi ?? emptyUpi,
          customerPhone: response?.customerPhone ?? "",
          loading: false,
        });
      } catch {
        set({ items: [], unseenCount: 0, loading: false });
      }
    },

    submitList: async (body) => {
      try {
        set({ submitting: true });
        const created = await submitGroceryList(body);
        set({ submitting: false });
        toast.success(
          created?.merged
            ? "Added to your earlier list (shop hasn't started it yet)"
            : "List sent to the shop",
        );
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

    // Remove one item from a sent list (server enforces: only before packing,
    // never after payment). The server returns the updated list — including
    // the recalculated total — which replaces the stale copy in place.
    removeItem: async (listId, index) => {
      try {
        const updated = await removeGroceryListItem(listId, index);

        if (!updated?._id) {
          throw new Error("Failed to remove item");
        }

        set((state) => ({
          items: state.items.map((item) =>
            item._id === listId ? updated : item,
          ),
        }));
        toast.success("Item removed");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to remove item";
        toast.error(message);
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

    // Opens the customer's UPI app (GPay/PhonePe/Paytm) with the amount filled.
    // There's no automatic confirmation — the shopkeeper marks it paid once the
    // money lands in their UPI app.
    payViaUpi: async (list) => {
      const { upi } = get();

      if (!upi.id) {
        toast.error("The shop hasn't set up UPI payments yet");
        return;
      }

      if (list.totalAmount < 1) {
        toast.error("This list isn't priced yet");
        return;
      }

      const url = buildUpiUrl({
        upiId: upi.id,
        payeeName: upi.name,
        amount: list.totalAmount,
        note: `Order ${list.code}`,
      });

      const opened = await openUpiPayment(url);

      if (!opened) {
        toast.error("No UPI app found on this phone");
      }
    },

    clear: () =>
      set({
        items: [],
        unseenCount: 0,
        upi: emptyUpi,
        customerPhone: null,
        loading: false,
        submitting: false,
        payingListId: "",
      }),
  }),
);
