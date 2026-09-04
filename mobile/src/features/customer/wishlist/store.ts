import { create } from "zustand";
import type { CustomerWishlistItem } from "./types";
import {
  addCustomerWishlist,
  getCustomerWishlist,
  removeCustomerWishlistItem,
} from "./api";
import { toast } from "@/lib/toast";

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
    clear: () => set({ items: [], isOpen: false }),
    loadWishlist: async () => {
      try {
        const response = await getCustomerWishlist();
        set({ items: response.items ?? [] });
      } catch {
        set({ items: [] });
      }
    },
    removeItem: async (productId) => {
      try {
        const response = await removeCustomerWishlistItem(productId);
        set({ items: response?.items ?? [] });
        toast.success("Removed from wishlist");
      } catch {
        toast.error("Failed to add items to wishlist");
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
