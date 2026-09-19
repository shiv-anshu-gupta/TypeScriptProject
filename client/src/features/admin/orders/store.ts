/**
 * State for the legacy orders table, which is no longer routed.
 *
 * @remarks
 * **Not reachable.** `client/src/router.tsx` does not import
 * `pages/admin/Orders.tsx`, and `components/admin/common/sidebar.tsx` has no
 * entry for it, so there is no way to open this screen in the running app.
 *
 * It belongs to the legacy `Order` model inherited from the e-commerce
 * template, with its own placed/shipped/delivered flow. The shop's orders are
 * **grocery lists** now - the server says so itself in
 * `server/src/routes/admin/dashboard.routes.ts` - and nothing produces `Order`
 * documents any more. The `/admin/orders` API routes are still mounted, so
 * re-adding the route would render an empty table rather than fail.
 *
 * Treat this as reference material for the legacy model. New work belongs in
 * `features/admin/grocery-lists/` and `pages/admin/GroceryLists.tsx`.
 *
 * @packageDocumentation
 */
import { create } from "zustand";
import type { AdminOrder, AdminOrderStatus } from "./types";
import { extractAdminOrders, updateAdminOrderStatus } from "./api";

type AdminOrdersStore = {
  orders: AdminOrder[];
  loading: boolean;
  updatingOrderId: string;
  fetchOrders: () => Promise<void>;
  changeStatus: (
    orderId: string,
    orderStatus: AdminOrderStatus,
  ) => Promise<void>;
};

export const useAdminOrdersStore = create<AdminOrdersStore>((set) => ({
  orders: [],
  loading: true,
  updatingOrderId: "",
  fetchOrders: async () => {
    try {
      set({ loading: true });

      const response = await extractAdminOrders();
      set({
        orders: response?.items ?? [],
        loading: false,
      });
    } catch {
      set({
        orders: [],
        loading: false,
      });
    }
  },
  changeStatus: async (orderId, orderStatus) => {
    try {
      set({ updatingOrderId: orderId });

      const response = await updateAdminOrderStatus(orderId, orderStatus);

      if (!response._id) {
        set({ updatingOrderId: "" });
        return;
      }

      set((state) => ({
        orders: state.orders.map((order) =>
          order._id === orderId
            ? {
                ...order,
                orderStatus: response.orderStatus,
                deliveredAt: response.deliveredAt || order.deliveredAt || null,
                returnedAt: response.returnedAt || order.returnedAt || null,
              }
            : order,
        ),
      }));
    } catch {
      set({ updatingOrderId: "" });
    }
  },
}));
