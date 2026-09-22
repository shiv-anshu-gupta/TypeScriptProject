/**
 * The route table — and the authority on which code in this app is alive.
 *
 * @remarks
 * This app grew out of a generic MERN e-commerce template and a large amount of
 * that template is still on disk. Nothing under `pages/customer/**`,
 * `components/customer/**` or `features/customer/**` is referenced here, so
 * none of it can ever render. `pages/admin/Orders.tsx` is in the same position:
 * it is complete and it typechecks, but no route imports it and the sidebar has
 * no entry for it. Customers use the sKirana mobile app instead.
 *
 * When you need to know whether a file matters, start here rather than with the
 * folder layout.
 *
 * Three layers of guard wrap the admin section:
 *
 * 1. `ProtectedLayout` — requires a Clerk session, otherwise redirects to
 *    `/sign-in` carrying the attempted path in router state.
 * 2. `RoleGuardLayout allow={["admin"]}` — requires `role === "admin"` in the
 *    auth store. It renders error screens rather than redirecting, on purpose:
 *    every available redirect target leads back into this guard.
 * 3. `AdminLayout` — the sidebar and header shell that all admin pages sit in.
 *
 * The client guards are user experience only. Every `/admin/*` request is
 * independently gated on the server by `requireAdmin`.
 *
 * @see {@link ../../../docs/ADMIN-WEB.md} for the full route table and the
 * reasoning behind each guard.
 *
 * @packageDocumentation
 */
import { createBrowserRouter, Navigate } from "react-router-dom";
import { PublicOnlyLayout } from "./components/auth/PublicOnlyLayout";
import { SignInPage } from "./pages/auth/Sign-in";
import { SignUpPage } from "./pages/auth/Sign-up";
import { ProtectedLayout } from "./components/auth/ProtectedLayout";
import { RoleGuardLayout } from "./components/auth/RoleGuardLayout";
import AdminStaff from "./pages/admin/Staff";
import { AdminLayout } from "./components/layout/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AdminCoupons from "./pages/admin/Promos";
import AdminGroceryLists from "./pages/admin/GroceryLists";
import AdminMessages from "./pages/admin/Messages";
import AdminSettings from "./pages/admin/Settings";
import PrivacyPage from "./pages/legal/Privacy";
import DeleteAccountPage from "./pages/legal/DeleteAccount";

// This web app is the shop-owner ADMIN panel. Customers use the mobile app,
// so the root and any unknown path send you straight to /admin (which in turn
// redirects to sign-in when you're not logged in).
/**
 * Every route the app can reach.
 *
 * @remarks
 * Public and unguarded: `/privacy`, `/terms` and `/delete-account`. The first
 * is the URL the Google Play Console requires, and `/terms` deliberately
 * renders the same `PrivacyPage` component. These must stay outside the guards.
 *
 * `/` and `*` both redirect to `/admin`, which redirects again to
 * `/admin/grocery-lists`. In production Vercel rewrites every unmatched path to
 * `app.html`, but it checks the filesystem first, so `/` still serves the
 * static marketing homepage and never reaches this table.
 *
 * Because `/` points at `/admin`, no guard may redirect to `/` to get rid of a
 * user — that bounces straight back. See the comments inside
 * `RoleGuardLayout`.
 */
export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/admin" replace />,
  },
  // Public, no-login legal pages — this is the URL Google Play Console needs.
  {
    path: "/privacy",
    element: <PrivacyPage />,
  },
  {
    path: "/terms",
    element: <PrivacyPage />,
  },
  {
    path: "/delete-account",
    element: <DeleteAccountPage />,
  },
  // A bookmark to hand the shop's staff. It is only a redirect: their pages
  // are the same ones the shopkeeper uses, so duplicating the tree under
  // /staff/* would buy a second copy of every screen and no security at all.
  {
    path: "/staff",
    element: <Navigate to="/admin/grocery-lists" replace />,
  },
  {
    element: <PublicOnlyLayout />,
    children: [
      {
        path: "/sign-in/*",
        element: <SignInPage />,
      },
      {
        path: "/sign-up/*",
        element: <SignUpPage />,
      },
    ],
  },
  {
    element: <ProtectedLayout />,
    children: [
      {
        // Two guards, not one. The shop's staff may reach the list and the
        // chat; everything else is the shopkeeper's. This is presentation
        // only — a staff member who types /admin/dashboard is stopped by the
        // API, which answers 403. The guard exists so they see their own page
        // instead of a screen of errors.
        element: <RoleGuardLayout allow={["admin", "staff"]} />,
        children: [
          {
            path: "/admin",
            element: <AdminLayout />,
            children: [
              {
                // Grocery lists is the shop's most-used page — land there by
                // default so the owner doesn't click through the dashboard,
                // and so a staff member lands on the only page they use.
                index: true,
                element: <Navigate to="/admin/grocery-lists" replace />,
              },
              {
                path: "grocery-lists",
                element: <AdminGroceryLists />,
              },
              {
                path: "messages",
                element: <AdminMessages />,
              },
            ],
          },
        ],
      },
      {
        element: <RoleGuardLayout allow={["admin"]} />,
        children: [
          {
            path: "/admin",
            element: <AdminLayout />,
            children: [
              {
                path: "dashboard",
                element: <AdminDashboard />,
              },
              {
                path: "products",
                element: <AdminProducts />,
              },
              {
                path: "coupons",
                element: <AdminCoupons />,
              },
              {
                path: "staff",
                element: <AdminStaff />,
              },
              {
                path: "settings",
                element: <AdminSettings />,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/admin" replace />,
  },
]);
