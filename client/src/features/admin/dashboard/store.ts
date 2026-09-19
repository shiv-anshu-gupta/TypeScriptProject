/**
 * Zustand store holding the six dashboard stat-card figures.
 *
 * @remarks
 * The store is module-level state, so it lives for the whole browser session
 * and survives route changes. It fetches at most once per session and has no
 * polling, no invalidation and no refresh action.
 *
 * @packageDocumentation
 */

import { create } from "zustand";
import type { AdminDashboardLite } from "./types";
import { getAdminDashboardLite } from "./api";

/**
 * All-zero stats used as the initial value and as the error result.
 *
 * @remarks
 * This same object is written to `stats` when the fetch throws, which is why
 * a failed request is indistinguishable from an empty shop in the UI.
 */
const fallbackStats: AdminDashboardLite = {
  totalProducts: 0,
  totalCategories: 0,
  totalSales: 0,
  totalOrders: 0,
  pendingOrders: 0,
  completedOrders: 0,
};

/**
 * Shape of the dashboard store: the stats plus its two status flags.
 *
 * @remarks
 * `loading` starts as `true` so the page shows the loader on first paint,
 * before any effect has run. `hasLoaded` is set to `true` on both success and
 * failure and is never reset, so it means "we have attempted a fetch", not
 * "we hold good data".
 */
type AdminDashboardStore = {
  stats: AdminDashboardLite;
  loading: boolean;
  hasLoaded: boolean;
  fetchDashboard: () => Promise<void>;
};

/**
 * Hook giving the dashboard page its stats, loading flag and fetch action.
 *
 * @remarks
 * `fetchDashboard` calls `getAdminDashboardLite`, i.e.
 * `GET /admin/dashboard/lite`. The page calls it from an effect only when
 * `hasLoaded` is false, and `hasLoaded` is set on every outcome, so the store
 * fetches once per browser session: navigating away from the dashboard and
 * back shows the same numbers until a full page reload. There is no refresh
 * button and no polling.
 *
 * Trap: the `catch` swallows the error and writes `fallbackStats`, so a failed
 * or unauthorised request renders six zeroes with no message. "All six are 0"
 * therefore means either a genuinely empty shop or a broken request, and the
 * UI cannot tell them apart. Check the network tab before believing the
 * numbers.
 *
 * The store is created without a selector-equality helper, and the page
 * subscribes with `(state) => state`, so any change to the store re-renders
 * the whole dashboard. That is harmless here because there is only one write
 * per session.
 */
export const useAdminDashboardLiteStore = create<AdminDashboardStore>(
  (set) => ({
    stats: fallbackStats,
    loading: true,
    hasLoaded: false,
    fetchDashboard: async () => {
      try {
        set({ loading: true });

        const response = await getAdminDashboardLite();

        set({
          stats: response ?? fallbackStats,
          loading: false,
          hasLoaded: true,
        });
      } catch {
        set({
          stats: fallbackStats,
          loading: false,
          hasLoaded: true,
        });
      }
    },
  }),
);
