/**
 * Whether the grocery-list sheet is showing.
 *
 * @packageDocumentation
 */

import { create } from "zustand";

/**
 * Whether the sliding grocery-list sheet (opened by the centre tab button) is
 * showing. Kept in a store because the button lives in the tab bar while the
 * sheet itself is mounted at the app root, above every screen.
 */
type GrocerySheetStore = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
};

/**
 * Holds one boolean: is the list sheet open.
 *
 * @remarks
 * Written by the centre tab button, by Home's banners and journey card, and
 * by the send flow — which closes the sheet through `getState().close()`
 * rather than a hook, because it runs outside React's render.
 *
 * Not persisted: a restart should not reopen a sheet.
 *
 * Closing it before navigating on Android is not optional. The sheet is drawn
 * over the whole app there, so a screen pushed underneath looks like nothing
 * happened.
 */
export const useGrocerySheetStore = create<GrocerySheetStore>((set, get) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set({ isOpen: !get().isOpen }),
}));
