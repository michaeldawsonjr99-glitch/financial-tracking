"use client";

import { useSyncExternalStore } from "react";
import { ArrowDownRight, ArrowUpRight, Scale, TrendingUp } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import type {
  CategoryBreakdownPoint,
  DebtPaydownItem,
  FinancialSummary,
  MonthlyCashFlowPoint,
} from "@/lib/analytics";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

type TooltipPayload = {
  name?: string;
  value?: number | string;
  color?: string;
  payload?: Record<string, unknown>;
};

function CurrencyTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string | number;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      {label !== undefined ? (
        <p className="mb-1 font-medium text-popover-foreground">{label}</p>
      ) : null}
      <div className="flex flex-col gap-0.5">
        {payload.map((entry, index) => (
          <div
            key={`${entry.name}-${index}`}
            className="flex items-center justify-between gap-4"
          >
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}
            </span>
            <span className="font-medium tabular-nums text-popover-foreground">
              {formatCurrency(Number(entry.value ?? 0))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function KpiCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "default",
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof TrendingUp;
  tone?: "default" | "positive" | "negative";
}) {
  return (
    <Card className="gap-3">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <span className="flex size-6 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="size-3.5" />
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={
            tone === "positive"
              ? "text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400"
              : tone === "negative"
                ? "text-2xl font-semibold tabular-nums text-rose-600 dark:text-rose-400"
                : "text-2xl font-semibold tabular-nums"
          }
        >
          {value}
        </p>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

function ChartSkeleton() {
  return (
    <div className="flex h-[280px] w-full items-end gap-3">
      {[40, 65, 50, 80, 55, 70].map((height, index) => (
        <Skeleton
          key={index}
          className="flex-1 rounded-md"
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}

export function AnalyticsDashboard({
  monthlyCashFlow,
  categoryBreakdown,
  debtPaydown,
  summary,
}: {
  monthlyCashFlow: MonthlyCashFlowPoint[];
  categoryBreakdown: CategoryBreakdownPoint[];
  debtPaydown: DebtPaydownItem[];
  summary: FinancialSummary;
}) {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const hasCashFlow = monthlyCashFlow.some(
    (point) => point.income > 0 || point.outflows > 0
  );
  const hasBreakdown = categoryBreakdown.some((point) => point.value > 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Track cash flow, see where your money goes, and watch your debt shrink.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Monthly Income"
          value={formatCurrency(summary.monthlyIncome)}
          description="Stored monthly income"
          icon={ArrowDownRight}
          tone="positive"
        />
        <KpiCard
          title="Monthly Outflows"
          value={formatCurrency(summary.totalCommitted)}
          description="Bills + loan commitments"
          icon={ArrowUpRight}
          tone="negative"
        />
        <KpiCard
          title="Net Cash Flow"
          value={formatCurrency(summary.netCashFlow)}
          description={
            summary.netCashFlow >= 0 ? "Surplus this month" : "Shortfall this month"
          }
          icon={Scale}
          tone={summary.netCashFlow >= 0 ? "positive" : "negative"}
        />
        <KpiCard
          title="Total Paid"
          value={formatCurrency(summary.totalPaid)}
          description={`${summary.paymentCount} payment${summary.paymentCount === 1 ? "" : "s"} recorded`}
          icon={TrendingUp}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Cash Flow</CardTitle>
          <CardDescription>
            Income versus total outflows over the last 6 months.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!mounted ? (
            <ChartSkeleton />
          ) : !hasCashFlow ? (
            <EmptyState message="No income or payment activity in the last 6 months yet." />
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyCashFlow}
                  margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
                  barGap={6}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border)"
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    stroke="var(--muted-foreground)"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    width={64}
                    stroke="var(--muted-foreground)"
                    tickFormatter={(value) =>
                      new Intl.NumberFormat("en-PH", {
                        notation: "compact",
                        maximumFractionDigits: 0,
                      }).format(Number(value))
                    }
                  />
                  <Tooltip
                    cursor={{ fill: "var(--muted)", opacity: 0.4 }}
                    content={<CurrencyTooltip />}
                  />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                  />
                  <Bar
                    dataKey="income"
                    name="Income"
                    fill="var(--chart-1)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={36}
                  />
                  <Bar
                    dataKey="outflows"
                    name="Outflows"
                    fill="var(--chart-4)"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={36}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Outflow Breakdown</CardTitle>
            <CardDescription>
              Bills vs shopping loans vs personal debts (last 6 months).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!mounted ? (
              <div className="flex h-[280px] items-center justify-center">
                <Skeleton className="size-48 rounded-full" />
              </div>
            ) : !hasBreakdown ? (
              <EmptyState message="No payments recorded in the last 6 months." />
            ) : (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={64}
                      outerRadius={96}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell
                          key={entry.key}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CurrencyTooltip />} />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Debt Paydown Progress</CardTitle>
            <CardDescription>
              How much of each active debt you have cleared.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {debtPaydown.length === 0 ? (
              <EmptyState message="No active debts. Everything is paid off." />
            ) : (
              <div className="flex flex-col gap-4">
                {debtPaydown.map((item) => (
                  <div key={item.id} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          className={
                            item.kind === "SHOPPING"
                              ? "size-2 shrink-0 rounded-full bg-[var(--chart-1)]"
                              : "size-2 shrink-0 rounded-full bg-[var(--chart-2)]"
                          }
                        />
                        <span className="truncate font-medium">{item.name}</span>
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {formatCurrency(item.remaining)} left
                      </span>
                    </div>
                    <Progress value={item.percent} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {formatCurrency(item.paid)} of{" "}
                        {formatCurrency(item.total)} paid
                      </span>
                      <span className="tabular-nums">
                        {item.percent.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Receivable vs Payable</CardTitle>
          <CardDescription>
            Personal lending position and outstanding shopping debt.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border bg-muted/30 px-4 py-3">
            <p className="text-xs text-muted-foreground">Owed to you</p>
            <p className="text-lg font-semibold tabular-nums">
              {formatCurrency(summary.receivable)}
            </p>
          </div>
          <div className="rounded-xl border bg-muted/30 px-4 py-3">
            <p className="text-xs text-muted-foreground">You owe</p>
            <p className="text-lg font-semibold tabular-nums">
              {formatCurrency(summary.payable)}
            </p>
          </div>
          <div className="rounded-xl border bg-muted/30 px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Shopping remaining
            </p>
            <p className="text-lg font-semibold tabular-nums">
              {formatCurrency(summary.shoppingRemaining)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}
