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
