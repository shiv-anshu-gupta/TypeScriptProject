import { create } from "zustand";
import type { CustomerWishlistItem } from "./types";
import {
  addCustomerWishlist,
  getCustomerWishlist,
  removeCustomerWishlistItem,
} from "./api";
import { toast } from "@/lib/toast";
import i18n from "@/lib/i18n";

// Same ticket rule as the grocery-list store: a late answer never overwrites
// newer state, and a failed load never empties the hearts.
let loadTicket = 0;

type CustomerWishlistStore = {
  items: CustomerWishlistItem[];
  isOpen: boolean;
  setOpen: (val: boolean) => void;
  setItems: (items: CustomerWishlistItem[]) => void;
  loadWishlist: () => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  // Save / unsave any product by id — used by the heart on a product card.
  // Returns what it did so the caller can show a translated toast; throws on
  // failure so the caller can revert its optimistic state.
  toggleItem: (productId: string) => Promise<"added" | "removed">;
  isSaved: (productId: string) => boolean;
  clear: () => void;
};

export const useCustomerWishlistStore = create<CustomerWishlistStore>(
  (set, get) => ({
    items: [],
    isOpen: false,
    setOpen: (value) => set({ isOpen: value }),
    setItems: (items) => set({ items }),
    clear: () => {
      loadTicket++;
      set({ items: [], isOpen: false });
    },
    loadWishlist: async () => {
      const ticket = ++loadTicket;
      try {
        const response = await getCustomerWishlist();
        if (ticket === loadTicket) set({ items: response.items ?? [] });
      } catch {
        // Keep the saved items already on screen.
      }
    },
    removeItem: async (productId) => {
      try {
        const response = await removeCustomerWishlistItem(productId);
        set({ items: response?.items ?? [] });
        toast.success(i18n.t("wishlist.removed"));
      } catch {
        toast.error(i18n.t("common.wishlistFailed"));
      }
    },
    isSaved: (productId) =>
      get().items.some((item) => item.productId === productId),
    toggleItem: async (productId) => {
      const active = get().isSaved(productId);
      const response = active
        ? await removeCustomerWishlistItem(productId)
        : await addCustomerWishlist({ productId });
      set({ items: response?.items ?? [] });
      return active ? "removed" : "added";
    },
  }),
);
