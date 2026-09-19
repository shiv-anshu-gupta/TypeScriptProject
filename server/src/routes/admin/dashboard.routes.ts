/**
 * Read-only counters and the seven-day trend behind the admin panel's home
 * screen.
 *
 * @remarks
 * Mounted at `/admin` in `server/src/server.ts`, giving
 * `GET /admin/dashboard/lite` and `GET /admin/dashboard/daily`.
 *
 * Both routes require an admin (`requireAdmin` is applied router-wide), take
 * no parameters and write nothing.
 *
 * "Orders" here means grocery lists, not the `orders` collection. The shop
 * runs on grocery lists, so every order and sales figure on this dashboard is
 * computed from `grocerylists`; the `orders` collection is not read at all.
 *
 * @packageDocumentation
 */
import { Router, type Request, type Response } from "express";
import { requireAdmin } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { Product } from "../../models/Product";
import { Category } from "../../models/Category";
import { GroceryList } from "../../models/GroceryList";
import { ok } from "../../utils/envelope";

type TotalSaleRow = {
  _id: null;
  totalSales: number;
};

export const adminDashboardRouter = Router();

adminDashboardRouter.use(requireAdmin);

/**
 * `GET /admin/dashboard/lite` — the six headline counters.
 *
 * @remarks
 * Auth: admin. No parameters.
 *
 * What each number counts, given that "order" means a grocery list:
 * `totalProducts` and `totalCategories` are whole-collection counts, with no
 * status filter, so inactive products are included. `totalOrders` is every
 * list that is not `cancelled`, over all time. `pendingOrders` is lists still
 * in `received`, which means awaiting pricing rather than awaiting payment.
 * `completedOrders` is lists in `completed`. `totalSales` sums `totalAmount`
 * across lists whose `paymentStatus` is `paid`, and is 0 when there are none.
 *
 * All six are lifetime totals with no date window.
 *
 * Side effects: none.
 */
adminDashboardRouter.get(
  "/dashboard/lite",
  asyncHandler(async (_req: Request, res: Response) => {
    // Orders are grocery lists now. Count non-cancelled lists as orders, plus
    // how many still need pricing and how many are completed.
    const [
      totalProducts,
      totalCategories,
      totalOrders,
      pendingOrders,
      completedOrders,
      salesRows,
    ] = await Promise.all([
      Product.countDocuments(),
      Category.countDocuments(),
      GroceryList.countDocuments({ status: { $ne: "cancelled" } }),
      GroceryList.countDocuments({ status: "received" }),
      GroceryList.countDocuments({ status: "completed" }),
      GroceryList.aggregate<TotalSaleRow>([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } },
      ]),
    ]);

    res.json(
      ok({
        totalProducts,
        totalCategories,
        totalSales: salesRows[0]?.totalSales || 0,
        totalOrders,
        pendingOrders,
        completedOrders,
      }),
    );
  }),
);

// Last-7-days trend: orders placed per day + sales received per day, bucketed
// by IST calendar day so a late-evening order lands on the right date.
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
/**
 * Produces the IST calendar date of an instant as a `YYYY-MM-DD` string.
 *
 * @remarks
 * A fixed +5:30 shift, then the date part of the ISO string. India observes
 * no daylight saving, so the fixed offset is exact and needs no timezone
 * database.
 *
 * @param date - Any instant, typically a stored `createdAt` or `paidAt`.
 * @returns The IST day, for use as a bucket key.
 */
function istDayKey(date: Date): string {
  return new Date(date.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

type DailyList = {
  createdAt?: Date;
  paidAt?: Date | null;
  totalAmount?: number;
  status?: string;
  paymentStatus?: string;
};

/**
 * `GET /admin/dashboard/daily` — orders placed and money received on each of
 * the last seven IST days.
 *
 * @remarks
 * Auth: admin. No parameters.
 *
 * Always returns exactly seven entries, oldest first and ending with today.
 * A day with no activity is present with zeroes rather than missing, so the
 * chart needs no gap filling.
 *
 * The two series are bucketed by different timestamps, and a list can appear
 * in one and not the other. `orders` counts non-cancelled lists by
 * `createdAt`; `sales` sums `totalAmount` of paid lists by `paidAt`. A list
 * created on Monday and paid on Wednesday therefore counts as an order on
 * Monday and as sales on Wednesday.
 *
 * `label` is built with `toLocaleDateString("en-IN", ...)`, so its exact
 * wording depends on the locale data available to the running server rather
 * than on anything stored.
 *
 * Side effects: none.
 */
adminDashboardRouter.get(
  "/dashboard/daily",
  asyncHandler(async (_req: Request, res: Response) => {
    const DAYS = 7;
    const now = Date.now();

    const keys: string[] = [];
    for (let i = DAYS - 1; i >= 0; i--) {
      keys.push(istDayKey(new Date(now - i * 86400000)));
    }

    // Look back a little further than the window to catch timezone edges.
    const since = new Date(now - (DAYS + 1) * 86400000);
    const lists = await GroceryList.find({
      $or: [{ createdAt: { $gte: since } }, { paidAt: { $gte: since } }],
    })
      .select("createdAt paidAt totalAmount status paymentStatus")
      .lean<DailyList[]>();

    const orders: Record<string, number> = {};
    const sales: Record<string, number> = {};
    for (const k of keys) {
      orders[k] = 0;
      sales[k] = 0;
    }

    for (const l of lists) {
      if (l.status !== "cancelled" && l.createdAt) {
        const k = istDayKey(new Date(l.createdAt));
        if (k in orders) orders[k] += 1;
      }
      if (l.paymentStatus === "paid" && l.paidAt) {
        const k = istDayKey(new Date(l.paidAt));
        if (k in sales) sales[k] += l.totalAmount || 0;
      }
    }

    const days = keys.map((k) => {
      const label = new Date(`${k}T00:00:00`).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
      });
      return { date: k, label, orders: orders[k], sales: sales[k] };
    });

    res.json(ok({ days }));
  }),
);
