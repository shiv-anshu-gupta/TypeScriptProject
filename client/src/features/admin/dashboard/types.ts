/**
 * Response shapes for the two admin dashboard endpoints.
 *
 * @remarks
 * These types describe what the server already sends; they are not validated
 * at runtime. If a field is renamed in
 * `server/src/routes/admin/dashboard.routes.ts`, the compiler will not notice
 * and the affected card or chart silently shows zero.
 *
 * @packageDocumentation
 */

/**
 * The six headline counters returned by `GET /admin/dashboard/lite`.
 *
 * @remarks
 * Every "order" figure here is a grocery list, not a legacy `Order` document.
 * `totalOrders` is every list that is not cancelled. `pendingOrders` is only
 * lists with status `received` — un-priced ones — so it is narrower than "open
 * lists" and will not match a count of everything still in progress.
 * `completedOrders` is status `completed`. `totalSales` is rupees summed over
 * lists with `paymentStatus: "paid"`, and is the only field the UI formats as
 * currency. The keys are also used verbatim as lookup keys by the stat card
 * list in `pages/admin/Dashboard.tsx`, so renaming one breaks that page.
 */
export type AdminDashboardLite = {
  totalProducts: number;
  totalCategories: number;
  totalSales: number;
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
};

/**
 * One day in the seven-day dashboard trend.
 *
 * @remarks
 * `date` is the IST calendar day as `YYYY-MM-DD` and is not displayed.
 * `label` is a pre-formatted short weekday and day-of-month string built on
 * the server with the `en-IN` locale, and is what the chart X axis renders —
 * formatting is deliberately not repeated on the client. `orders` counts
 * non-cancelled lists created that day; `sales` sums `totalAmount` for lists
 * paid that day, in rupees.
 */
export type DashboardDailyPoint = {
  date: string;
  label: string;
  orders: number;
  sales: number;
};

/**
 * The envelope payload of `GET /admin/dashboard/daily`.
 *
 * @remarks
 * `days` always holds seven entries, oldest first, including days with no
 * activity. The chart component reads `res?.days ?? []`, so an unexpected
 * shape renders empty axes rather than throwing.
 */
export type AdminDashboardDaily = {
  days: DashboardDailyPoint[];
};
