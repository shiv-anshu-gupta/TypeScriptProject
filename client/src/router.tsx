import { createBrowserRouter, Navigate } from "react-router-dom";
import { PublicOnlyLayout } from "./components/auth/PublicOnlyLayout";
import { SignInPage } from "./pages/auth/Sign-in";
import { SignUpPage } from "./pages/auth/Sign-up";
import { ProtectedLayout } from "./components/auth/ProtectedLayout";
import { RoleGuardLayout } from "./components/auth/RoleGuardLayout";
import { AdminLayout } from "./components/layout/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AdminCoupons from "./pages/admin/Promos";
import AdminOrders from "./pages/admin/Orders";
import AdminGroceryLists from "./pages/admin/GroceryLists";
import AdminSettings from "./pages/admin/Settings";
import PrivacyPage from "./pages/legal/Privacy";

// This web app is the shop-owner ADMIN panel. Customers use the mobile app,
// so the root and any unknown path send you straight to /admin (which in turn
// redirects to sign-in when you're not logged in).
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
        element: <RoleGuardLayout allow={["admin"]} />,
        children: [
          {
            path: "/admin",
            element: <AdminLayout />,
            children: [
              {
                index: true,
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
                path: "orders",
                element: <AdminOrders />,
              },
              {
                path: "grocery-lists",
                element: <AdminGroceryLists />,
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
