/**
 * Which product the app's single quantity picker is asking about.
 *
 * @packageDocumentation
 */

import { create } from "zustand";

// Which product the quantity picker is asking about, if any.
//
// There is ONE picker in the app, at the root, rather than one inside every
// product card. A card is drawn dozens at a time in the Shop grid, and a
// sheet is not free even while closed - it measures the window, reads the
// safe area, creates shared values and a gesture. Twenty of those on a cheap
// phone is paid for at exactly the wrong moment: while the customer scrolls.

/**
 * The product the picker is open for.
 *
 * @remarks
 * `title` is the product's name and also what goes onto the draft row, so the
 * picker needs nothing else to add an item — no id, no fetch.
 *
 * `unit` and `unitValue` are what every rule in `quantity.ts` keys off.
 */
export type QuantityTarget = {
  title: string;
  unit?: string;
  unitValue?: number;
};

type QuantitySheetStore = {
  target: QuantityTarget | null;
  open: (target: QuantityTarget) => void;
  close: () => void;
};

/**
 * Holds the product the root quantity picker is asking about, or `null` when
 * it is closed.
 *
 * @remarks
 * Written by a product card's "+" and cleared when the picker closes. Not
 * persisted.
 *
 * `target` doubles as the open/closed flag, which is why the host keeps its
 * own copy of the last title while the sheet slides away — reading `target`
 * during the animation would blank the heading mid-slide.
 *
 * The reason this is a store at all is performance, and it is load-bearing: a
 * card must only ever call `open()`, never mount a sheet of its own. See the
 * comment above.
 */
export const useQuantitySheetStore = create<QuantitySheetStore>((set) => ({
  target: null,
  open: (target) => set({ target }),
  close: () => set({ target: null }),
}));
