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
