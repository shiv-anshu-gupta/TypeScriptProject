import { create } from "zustand";

// Whether the sliding grocery-list sheet (opened by the centre tab button) is
// showing. Kept in a store because the button lives in the tab bar while the
// sheet itself is mounted at the app root, above every screen.
type GrocerySheetStore = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

export const useGrocerySheetStore = create<GrocerySheetStore>((set, get) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set({ isOpen: !get().isOpen }),
}));
