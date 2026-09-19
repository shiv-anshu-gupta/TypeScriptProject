/**
 * The two seven-day dashboard charts: orders per day and sales per day.
 *
 * @remarks
 * Rendered by `pages/admin/Dashboard.tsx` below the stat cards. It fetches its
 * own data from `GET /admin/dashboard/daily` and keeps it in local component
 * state, so the series is refetched every time the component mounts — unlike
 * the stat cards, which are cached in a store for the whole session.
 *
 * Charts are drawn with recharts. Because recharts emits SVG presentation
 * attributes, colours here are concrete hex values rather than the CSS
 * variables used everywhere else in the admin; see the note above `ACCENT`.
 * One consequence is that these charts do not follow a theme change.
 *
 * @packageDocumentation
 */

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminDashboardDaily } from "@/features/admin/dashboard/api";
import type { DashboardDailyPoint } from "@/features/admin/dashboard/types";
import { formatPrice } from "@/lib/utils";

/**
 * Chart palette: the accent hue for marks, plus grid and axis greys.
 *
 * @remarks
 * These must stay literal hex. The original note below records why, and it is
 * the reason a maintainer should not "tidy" them into `var(--primary)`:
 * recharts writes them into SVG `fill` and `stroke` attributes, where `var()`
 * does not resolve and the marks would disappear. `ACCENT` is kept in step
 * with the admin brand primary by hand. These values are light-theme only.
 */
// One accent hue (matches the admin's brand primary). Concrete hex values, not
// CSS vars — recharts renders these as SVG attributes, where var() does not
// resolve, so vars would leave marks uncolored/invisible.
const ACCENT = "#c026d3";
const GRID = "#e5e7eb";
const AXIS = "#6b7280";

/**
 * Inline style for the recharts tooltip box, shared by both charts.
 *
 * @remarks
 * Inline rather than a class because recharts renders the tooltip into its own
 * element and takes a style object. The colours are hard-coded light-theme
 * values for the same reason as the palette above.
 */
const tooltipStyle: React.CSSProperties = {
  background: "#ffffff",
  border: `1px solid ${GRID}`,
  borderRadius: 8,
  fontSize: 12,
  padding: "6px 10px",
  color: "#111827",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

/**
 * Tick label style passed to both axes of both charts.
 *
 * @remarks
 * `fill`, not `color`, because the tick is an SVG `text` node.
 */
const axisTick = { fontSize: 11, fill: AXIS } as const;

/**
 * Card shell with a small heading and a fixed-height chart area.
 *
 * @remarks
 * The 220px height is set on a wrapper div because `ResponsiveContainer`
 * measures its parent; a percentage height with no measurable parent collapses
 * to zero and the chart vanishes. The matching 268px used by the loading
 * skeleton is this height plus the card header and padding, so the layout does
 * not jump when the data arrives.
 *
 * @param title - Heading text shown above the chart.
 * @param children - The recharts tree to render inside the sized box.
 */
function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ width: "100%", height: 220 }}>{children}</div>
      </CardContent>
    </Card>
  );
}

/**
 * Fetches the seven-day series and renders the orders bar chart and the sales
 * area chart side by side.
 *
 * @remarks
 * Takes no props. On mount it calls `getAdminDashboardDaily`, i.e.
 * `GET /admin/dashboard/daily`, and keeps the result in local `useState` — the
 * data is not in a store, so it is refetched on every mount and is lost when
 * the component unmounts. Nothing polls. A `cancelled` flag in the effect
 * cleanup stops the late response writing to an unmounted component.
 *
 * Trap: the `.catch(() => {})` is silent. A failed request leaves `days` empty
 * and both charts render blank axes with no message, exactly as a shop with
 * no activity would.
 *
 * The seven buckets are IST calendar days computed on the server, and the X
 * axis renders the server-formatted `label` as-is. Orders are bucketed by the
 * list's `createdAt` and sales by its `paidAt`, so the two charts can peak on
 * different days for the same order.
 *
 * While loading it renders two pulsing 268px placeholders so the grid keeps
 * its height.
 */
export function DashboardCharts() {
  const [days, setDays] = useState<DashboardDailyPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void getAdminDashboardDaily()
      .then((res) => {
        if (!cancelled) setDays(res?.days ?? []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="h-[268px] animate-pulse rounded-xl border border-border bg-card" />
        <div className="h-[268px] animate-pulse rounded-xl border border-border bg-card" />
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      {/* Orders per day — magnitude over time → bars */}
      <ChartCard title="Orders per day (last 7 days)">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            data={days}
            margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
            barCategoryGap="28%"
          >
            <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tick={axisTick}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={axisTick}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={28}
            />
            <Tooltip
              cursor={{ fill: "#f3f4f6", opacity: 0.4 }}
              contentStyle={tooltipStyle}
              formatter={(value) => [value, "Orders"]}
            />
            <Bar
              dataKey="orders"
              fill={ACCENT}
              radius={[4, 4, 0, 0]}
              maxBarSize={30}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Sales per day — change over time → area line */}
      <ChartCard title="Sales per day (₹, last 7 days)">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={days} margin={{ top: 8, right: 8, left: -6, bottom: 0 }}>
            <defs>
              <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ACCENT} stopOpacity={0.28} />
                <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={GRID} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tick={axisTick}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={axisTick}
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={(v: number) => `₹${v}`}
            />
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value) => [formatPrice(Number(value) || 0), "Sales"]}
            />
            <Area
              type="monotone"
              dataKey="sales"
              stroke={ACCENT}
              strokeWidth={2}
              fill="url(#salesFill)"
              dot={{ r: 3, fill: ACCENT, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
