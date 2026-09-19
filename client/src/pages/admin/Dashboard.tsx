/**
 * The admin dashboard page at `/admin/dashboard`.
 *
 * @remarks
 * Six stat cards from `GET /admin/dashboard/lite` via the zustand store, then
 * the seven-day charts, which fetch `GET /admin/dashboard/daily` themselves.
 *
 * The page is not the shop's landing screen: `/admin` redirects to
 * `/admin/grocery-lists`, so the dashboard is only seen when the owner clicks
 * to it. It sits behind `ProtectedLayout` and an admin `RoleGuardLayout`.
 *
 * @packageDocumentation
 */

import { Commonloader } from "@/components/common/Loader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCharts } from "@/components/admin/dashboard/dashboard-charts";
import { useAdminDashboardLiteStore } from "@/features/admin/dashboard/store";
import { formatPrice } from "@/lib/utils";
import {
  Boxes,
  CheckCircle2,
  Clock,
  IndianRupee,
  Layers3,
  ClipboardList,
} from "lucide-react";
import { useEffect } from "react";

/**
 * The six stat cards, in render order, with the icon and label for each.
 *
 * @remarks
 * Each `key` is read straight out of the `AdminDashboardLite` response, so the
 * names must stay in step with `features/admin/dashboard/types.ts` and with
 * the server route; a mismatch renders an empty card rather than failing.
 *
 * The labels describe grocery lists, not legacy `Order` documents. "Pending
 * (to price)" is deliberately worded that way because the server counts only
 * lists with status `received` — un-priced ones — and not every list that is
 * still open. `totalSales` is the only key formatted as currency below.
 *
 * Declared `as const` so `item.key` narrows to the literal union and indexes
 * `stats` without a cast.
 */
const statsItems = [
  {
    key: "totalOrders",
    label: "Total orders",
    icon: ClipboardList,
  },
  {
    key: "pendingOrders",
    label: "Pending (to price)",
    icon: Clock,
  },
  {
    key: "completedOrders",
    label: "Completed orders",
    icon: CheckCircle2,
  },
  {
    key: "totalSales",
    label: "Total sales",
    icon: IndianRupee,
  },
  {
    key: "totalProducts",
    label: "Total products",
    icon: Boxes,
  },
  {
    key: "totalCategories",
    label: "Total categories",
    icon: Layers3,
  },
] as const;

/**
 * Tailwind class strings for the page, hoisted to module scope.
 *
 * @remarks
 * Presentation only. They are constants purely to keep the JSX readable and
 * to avoid rebuilding the strings on each render; none of them carries
 * behaviour.
 */
const pageWrapClass = "min-h-screen bg-background";
const contentWrapClass = "mx-auto max-w-6xl px-4 py-8";
const headerCardClass = "border-border bg-card";
const wrapClass = "space-y-4";
const titleClass = "flex items-center gap-2 text-2xl font-semibold";

const gridClass = "mt-6 grid gap-4 sm:grid-cols-2";
const statCardClass = "border-border bg-card";
const statContentClass = "flex items-start gap-4 p-6";
const iconWrapClass =
  "flex h-11 w-11 items-center justify-center rounded-lg bg-secondary";
const iconClass = "h-5 w-5 text-primary";
const statLabelClass = "text-sm text-muted-foreground";
const statValueClass = "mt-1 text-2xl font-semibold text-foreground";

/**
 * Renders the dashboard: six stat cards above the seven-day charts.
 *
 * @remarks
 * Takes no props. It subscribes to the whole dashboard store and calls
 * `fetchDashboard` from an effect only when `hasLoaded` is false, so the data
 * is fetched once per browser session — navigating away and back shows the
 * same numbers until a full page reload. There is no refresh control and
 * nothing polls.
 *
 * Trap: the store turns a failed request into all-zero stats without an error
 * state, so six zeroes here mean either an empty shop or a failed
 * `GET /admin/dashboard/lite`. The page cannot tell you which.
 *
 * `loading` gates the whole body, so `DashboardCharts` is not mounted until
 * the stats call settles; its own daily fetch therefore starts after the
 * stats call, not alongside it. The charts keep their own loading state and
 * their own skeleton.
 *
 * Exported as the default and mounted at `/admin/dashboard` in `router.tsx`.
 */
function AdminDashboard() {
  const { loading, fetchDashboard, stats, hasLoaded } =
    useAdminDashboardLiteStore((state) => state);

  useEffect(() => {
    if (!hasLoaded) {
      void fetchDashboard();
    }
  }, [fetchDashboard, hasLoaded]);

  return (
    <div className={pageWrapClass}>
      <div className={contentWrapClass}>
        <Card className={headerCardClass}>
          <CardHeader className={wrapClass}>
            <CardTitle className={titleClass}>Dashboard</CardTitle>
          </CardHeader>
        </Card>

        {loading ? (
          <Commonloader />
        ) : (
          <>
            <div className={gridClass}>
              {statsItems.map((item) => {
                const Icon = item.icon;
                const value = stats[item.key];
                return (
                  <Card key={item.key} className={statCardClass}>
                    <CardContent className={statContentClass}>
                      <div className={iconWrapClass}>
                        <Icon className={iconClass} />
                      </div>
                      <div>
                        <p className={statLabelClass}>{item.label}</p>
                        <p className={statValueClass}>
                          {item.key === "totalSales"
                            ? formatPrice(value)
                            : value}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <DashboardCharts />
          </>
        )}
      </div>
    </div>
  );
}

export default AdminDashboard;
