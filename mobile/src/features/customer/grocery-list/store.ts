/**
 * The customer's sent orders, and everything they can do to one.
 *
 * @packageDocumentation
 */

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

/**
 * The ticket the newest load holds.
 *
 * @remarks
 * Every load takes a ticket. A response whose ticket is no longer the latest
 * is thrown away: it belongs to a superseded refresh, or to the customer who
 * signed out while it was in flight (clear() takes a new ticket too).
 *
 * Module scope, not store state, so it survives every `set` and is never part
 * of what a component subscribes to.
 */
let loadTicket = 0;
/**
 * The load currently in flight, if any.
 *
 * @remarks
 * Bootstrap and the focused tab often ask at the same moment; they share one
 * request instead of making two.
 *
 * So `loadLists()` resolving means "a load finished", not necessarily "your
 * load finished" — which is all any caller needs, since they read the store
 * afterwards rather than a return value.
 */
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

/**
 * Holds every list the customer has sent, plus what is needed to act on one.
 *
 * @remarks
 * Holds `items`, `unseenCount`, `upi`, `customerPhone`, and three pieces of
 * busy state: `loading` for the list fetch, `submitting` for a send, and
 * `payingListId` for the one list whose pay button is working.
 *
 * Written by `loadLists` at startup, on focus of the Lists and Account tabs,
 * and whenever a push notification arrives; and by the actions below.
 * `submitList` is called only through `useSendDraft`.
 *
 * Nothing is persisted. It is fetched at startup when signed in and cleared
 * on sign-out — which, with the ticket, is what stops a shared phone showing
 * the previous customer's orders.
 *
 * **A failed load is not "no orders".** Every catch keeps what is already on
 * screen. Emptying the store on a network error would make Home fall back to
 * "write a list" and the Lists tab claim nothing was ever sent.
 *
 * **`customerPhone` has three states, not two.** `null` means not fetched
 * yet, `""` means the customer has none on file and should be asked, and
 * anything else is the number. The send flow depends on that distinction: it
 * loads the lists once purely to turn `null` into one of the other two.
 *
 * `removeItem` replaces the whole list with the server's answer rather than
 * splicing locally, because removing a line changes the total.
 *
 * `payViaUpi` opens the customer's UPI app and nothing more. There is no
 * callback and no confirmation; the shopkeeper marks the order paid when the
 * money lands.
 */
export const useCustomerGroceryListStore = create<CustomerGroceryListStore>(
  (set, get) => ({
    items: [],
    unseenCount: 0,
    upi: emptyUpi,
    customerPhone: null,
    loading: false,
    submitting: false,
    payingListId: "",

    /**
     * Fetches the customer's lists, the shop's UPI details and their saved
     * number.
     *
     * @remarks
     * Shares one request with any load already running. Resolves rather than
     * throwing on failure, keeping whatever is already on screen — so a
     * caller cannot tell success from failure and should not try.
     */
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

    /**
     * Sends a list to the shop and tells the customer what happened.
     *
     * @remarks
     * Owns the toast for both outcomes, including the "added to your list"
     * wording when the server merged into an unpriced order — so callers
     * show nothing of their own.
     *
     * The refresh afterwards is deliberately not awaited: the draft is
     * cleared as soon as this returns, and anything typed while the history
     * loads would otherwise be lost.
     *
     * @returns `true` when the shop has it. Never throws; a failure is a
     * toast and `false`.
     */
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

    /**
     * Clears the "new update" badge for one list.
     *
     * @remarks
     * Updates the store optimistically as well as on the server, so the badge
     * goes at once. A failure is swallowed — a badge that clears on the next
     * load is better than an error the customer can do nothing about.
     */
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

    /**
     * Remove one item from a sent list (server enforces: only before packing,
     * never after payment). The server returns the updated list — including
     * the recalculated total — which replaces the stale copy in place.
     *
     * @remarks
     * `index` is a position in the list as it stands, so it has to be read at
     * the moment of confirming and only one removal may be in flight.
     *
     * Toasts both outcomes and never throws.
     */
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

    /**
     * Tells the shop the customer will pay at the counter.
     *
     * @remarks
     * Sets `payingListId` while it works, so one card's button can show a
     * spinner without the others doing the same. Reloads afterwards, because
     * the change is the shop's to act on.
     *
     * Toasts both outcomes and never throws.
     */
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

    /**
     * Opens the customer's UPI app (GPay/PhonePe/Paytm) with the amount filled.
     * There's no automatic confirmation — the shopkeeper marks it paid once the
     * money lands in their UPI app.
     *
     * @remarks
     * Refuses with a toast when the shop has set no UPI id, or when the list
     * has not been priced — a UPI app opened with nothing to pay reads as a
     * broken button.
     *
     * Changes no state at all: it neither marks the list paid nor sets
     * `payingListId`, because nothing here knows whether the customer went
     * through with it.
     */
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

    /**
     * Empties the store on sign-out.
     *
     * @remarks
     * Takes a new ticket as it goes, so a load still in flight for the
     * previous customer cannot land afterwards. Called from the app root
     * whenever Clerk reports nobody signed in.
     */
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
