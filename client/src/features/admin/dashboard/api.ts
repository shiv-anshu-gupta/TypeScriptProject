/**
 * HTTP calls for the admin dashboard.
 *
 * @remarks
 * Both helpers go through `apiGet` from `@/lib/api`, so they inherit the
 * Clerk bearer token from the axios request interceptor, unwrap the
 * `{ status, data, errors }` envelope, and throw a plain `Error` carrying the
 * server's first error message when the request fails. Both server routes sit
 * behind `requireAdmin`, so a non-admin session gets a rejected promise, never
 * partial data.
 *
 * There is no caching here. Caching is done by the callers: the zustand store
 * for the stats, and a `useEffect` in `DashboardCharts` for the daily series.
 *
 * @see {@link ../../../lib/api | apiGet}
 * @packageDocumentation
 */

import { apiGet } from "@/lib/api";
import type { AdminDashboardDaily, AdminDashboardLite } from "./types";

/**
 * Fetches the six headline counters shown on the dashboard stat cards.
 *
 * @remarks
 * Calls `GET /admin/dashboard/lite`. The server derives every figure from the
 * `GroceryList` collection plus product and category counts — there is no
 * legacy `Order` document involved. `totalOrders` counts lists whose status is
 * not `cancelled`, `pendingOrders` counts only lists with status `received`
 * (that is, un-priced ones), `completedOrders` counts status `completed`, and
 * `totalSales` sums `totalAmount` over lists with `paymentStatus: "paid"`.
 *
 * @returns The resolved stats object.
 * @throws Error when the request fails or the envelope reports an error.
 */
export async function getAdminDashboardLite() {
  return apiGet<AdminDashboardLite>("/admin/dashboard/lite");
}

/**
 * Fetches the seven-day orders and sales series used by the charts.
 *
 * @remarks
 * Calls `GET /admin/dashboard/daily`. The server returns exactly seven
 * buckets, oldest first, bucketed by IST calendar day so a late-evening order
 * lands on the right date. Days with no activity come back as zeroes rather
 * than being omitted, so the chart always has seven points. Orders are counted
 * by `createdAt` and sales by `paidAt`, which means an order placed one day
 * and paid the next contributes to two different buckets.
 *
 * @returns An object with a `days` array of seven points.
 * @throws Error when the request fails or the envelope reports an error.
 */
export async function getAdminDashboardDaily() {
  return apiGet<AdminDashboardDaily>("/admin/dashboard/daily");
}
