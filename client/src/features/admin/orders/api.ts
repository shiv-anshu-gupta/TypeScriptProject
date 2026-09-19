/**
 * Server calls for the legacy orders table, which is no longer routed.
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
import { apiGet, apiPatch } from "@/lib/api";
import type {
  AdminOrdersResponse,
  AdminOrderStatus,
  AdminUpdateOrderStatusResponse,
} from "./types";

export async function extractAdminOrders() {
  return apiGet<AdminOrdersResponse>("/admin/orders");
}

export async function updateAdminOrderStatus(
  orderId: string,
  orderStatus: AdminOrderStatus,
) {
  return apiPatch<
    AdminUpdateOrderStatusResponse,
    { orderStatus: AdminOrderStatus }
  >(`/admin/orders/${orderId}/status`, { orderStatus });
}
