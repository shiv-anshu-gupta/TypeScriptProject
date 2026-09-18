import { create } from "zustand";

// Which product the quantity picker is asking about, if any.
//
// There is ONE picker in the app, at the root, rather than one inside every
// product card. A card is drawn dozens at a time in the Shop grid, and a
// sheet is not free even while closed - it measures the window, reads the
// safe area, creates shared values and a gesture. Twenty of those on a cheap
// phone is paid for at exactly the wrong moment: while the customer scrolls.

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

export const useQuantitySheetStore = create<QuantitySheetStore>((set) => ({
  target: null,
  open: (target) => set({ target }),
  close: () => set({ target: null }),
}));
