/**
 * The customer's saved products.
 *
 * @packageDocumentation
 */

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

/**
 * Holds the saved products, and whether the wishlist sheet is showing.
 *
 * @remarks
 * Written by `loadWishlist` at startup, by `toggleItem` and `removeItem`, and
 * by the product-details store through `setItems` — which is why `setItems`
 * is public: the details screen's own save button already has the server's
 * answer and should not cause a second fetch.
 *
 * Nothing is persisted. It is loaded at startup when signed in and cleared on
 * sign-out, so the hearts on a shared phone are never the previous
 * customer's.
 *
 * A failed load keeps the items already on screen — same ticket rule as the
 * grocery-list store, so a late answer never overwrites newer state and a
 * failure never empties the hearts.
 *
 * The two mutations differ on purpose. `removeItem` owns its toasts and never
 * throws, for the Wishlist screen. `toggleItem` **throws** and toasts nothing,
 * because the heart on a product card flips optimistically and has to be able
 * to flip back — it returns what it did so the caller can pick the right
 * message.
 *
 * `isSaved` reads the current items, so calling it inside a component does
 * not subscribe that component to anything. A card that wants to re-render
 * when its own state changes should select just its own answer.
 */
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
