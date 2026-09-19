/**
 * The Home payload, fetched once and refreshed on return.
 *
 * @packageDocumentation
 */

import { create } from "zustand";
import type { CustomerHomeResponse } from "./types";
import { getCustomerHomeDateOverview } from "./api";

const fallbackData: CustomerHomeResponse = {
  banners: [],
  categories: [],
  recentProducts: [],
  coupons: [],
};

type CustomerHomeStore = {
  data: CustomerHomeResponse;
  loading: boolean;
  // `refresh` asks for fresh data without blanking the screen, and skips the
  // request when what's on screen is still recent.
  loadHome: (options?: { refresh?: boolean }) => Promise<void>;
  clear: () => void;
};

/**
 * How long a loaded payload counts as current, in milliseconds.
 *
 * @remarks
 * Home is fetched on the first visit and then refreshed when the customer
 * comes back to it - the shop can add, hide, schedule or re-order banners at
 * any time, and a first load that failed (offline) must get another chance.
 *
 * The window applies only to a refresh, never to a first load, so a screen
 * with nothing on it always fetches.
 */
const FRESH_FOR_MS = 60 * 1000;

let lastLoadedAt = 0;
let inFlight: Promise<void> | null = null;

/**
 * Holds the Home payload and whether a first load is still running.
 *
 * @remarks
 * Written only by `loadHome`, which the Home screen calls on mount and again
 * on every focus. Nothing is persisted and nothing is cleared on sign-out —
 * the payload is the shop's, not the customer's, and Home is a public screen.
 *
 * Two module-level guards shape its behaviour. `lastLoadedAt` makes a refresh
 * within a minute a no-op, so bouncing between tabs does not hammer the
 * server. `inFlight` shares one request between a cold start and a tab focus
 * that ask together.
 *
 * `loading` is deliberately only about the *first* load. A refresh leaves the
 * current data and the spinner alone, so coming back to Home never flashes an
 * empty page.
 *
 * A failed load keeps whatever is on screen; the next visit tries again.
 *
 * `clear()` exists for completeness and is not on the sign-out path.
 */
export const useCustomerHomeStore = create<CustomerHomeStore>((set) => ({
  loading: true,
  data: fallbackData,
  loadHome: async (options) => {
    const refresh = options?.refresh ?? false;
    if (refresh && Date.now() - lastLoadedAt < FRESH_FOR_MS) return;
    // One request at a time: a tab focus and a cold start can ask together.
    if (inFlight) return inFlight;

    inFlight = (async () => {
      try {
        // A refresh keeps the current screen: only the first load shows the
        // spinner, so returning to Home never flashes an empty page.
        if (!refresh) set({ loading: true });

        const response = await getCustomerHomeDateOverview();

        lastLoadedAt = Date.now();
        set({
          data: response ?? fallbackData,
          loading: false,
        });
      } catch {
        // Keep whatever is on screen; the next visit tries again.
        set({ loading: false });
      } finally {
        inFlight = null;
      }
    })();

    return inFlight;
  },
  clear: () => {
    lastLoadedAt = 0;
    set({ data: fallbackData, loading: true });
  },
}));
