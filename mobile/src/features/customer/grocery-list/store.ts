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
import i18n from "@/lib/i18n";
import { buildUpiUrl, openUpiPayment } from "@/lib/upi";

const emptyUpi: ShopUpi = { id: "", name: "sKirana" };

// Every load takes a ticket. A response whose ticket is no longer the latest
// is thrown away: it belongs to a superseded refresh, or to the customer who
// signed out while it was in flight (clear() takes a new ticket too).
let loadTicket = 0;
// Bootstrap and the focused tab often ask at the same moment; they share one
// request instead of making two.
let inFlight: Promise<void> | null = null;

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
      if (inFlight) return inFlight;
      const ticket = ++loadTicket;
      inFlight = (async () => {
        try {
          set({ loading: true });
          const response = await getCustomerGroceryLists();
          if (ticket !== loadTicket) return;
          set({
            items: response?.items ?? [],
            unseenCount: response?.unseenCount ?? 0,
            upi: response?.upi ?? emptyUpi,
            customerPhone: response?.customerPhone ?? "",
            loading: false,
          });
        } catch {
          if (ticket !== loadTicket) return;
          // A refresh that failed (offline, server hiccup) is NOT "no orders":
          // keep what was last loaded, or Home would fall back to "write a
          // list" and Lists would say nothing was ever sent.
          set({ loading: false });
        } finally {
          inFlight = null;
        }
      })();
      return inFlight;
    },

    submitList: async (body) => {
      try {
        set({ submitting: true });
        const created = await submitGroceryList(body);
        set({ submitting: false });
        toast.success(
          i18n.t(created?.merged ? "lists.mergedIntoList" : "lists.sentToShop"),
        );
        // Refresh in the background: the draft is cleared as soon as this
        // returns, so anything typed while the history loads isn't lost.
        void get().loadLists();
        return true;
      } catch (error) {
        set({ submitting: false });
        const message =
          error instanceof Error ? error.message : i18n.t("lists.sendFailed");
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
        toast.success(i18n.t("lists.itemRemoved"));
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
        toast.success(i18n.t("lists.payAtShopSet"));
        await get().loadLists();
      } catch {
        set({ payingListId: "" });
        toast.error(i18n.t("lists.payFailed"));
      }
    },

    // Opens the customer's UPI app (GPay/PhonePe/Paytm) with the amount filled.
    // There's no automatic confirmation — the shopkeeper marks it paid once the
    // money lands in their UPI app.
    payViaUpi: async (list) => {
      const { upi } = get();

      if (!upi.id) {
        toast.error(i18n.t("lists.noUpiSetUp"));
        return;
      }

      if (list.totalAmount < 1) {
        toast.error(i18n.t("lists.notPricedYet"));
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
        toast.error(i18n.t("lists.noUpiApp"));
      }
    },

    clear: () => {
      loadTicket++;
      set({
        items: [],
        unseenCount: 0,
        upi: emptyUpi,
        customerPhone: null,
        loading: false,
        submitting: false,
        payingListId: "",
      });
    },
  }),
);
