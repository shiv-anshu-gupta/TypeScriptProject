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

// One accent hue (the brand primary) — single-series charts, so no categorical
// palette to validate. Text/grid use recessive ink tokens; everything reads
// from CSS vars so light/dark both work.
const ACCENT = "var(--primary, #3c5a64)";
const GRID = "var(--border, #e5e7eb)";
const AXIS = "var(--muted-foreground, #6b7280)";

const tooltipStyle: React.CSSProperties = {
  background: "var(--card, #fff)",
  border: `1px solid ${GRID}`,
  borderRadius: 8,
  fontSize: 12,
  padding: "6px 10px",
  color: "var(--foreground, #111)",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

const axisTick = { fontSize: 11, fill: AXIS } as const;

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
        <div className="h-[200px] w-full">{children}</div>
      </CardContent>
    </Card>
  );
}

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
        <ResponsiveContainer width="100%" height="100%">
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
              cursor={{ fill: "var(--muted, #f3f4f6)", opacity: 0.4 }}
              contentStyle={tooltipStyle}
              formatter={(value: number) => [value, "Orders"]}
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
        <ResponsiveContainer width="100%" height="100%">
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
              formatter={(value: number) => [formatPrice(value), "Sales"]}
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
