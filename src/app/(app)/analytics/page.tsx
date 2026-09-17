import { getCurrentUser, getPaymentLogs } from "@/lib/data";
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard";
import {
  buildCategoryBreakdown,
  buildDebtPaydown,
  buildFinancialSummary,
  buildMonthlyCashFlow,
} from "@/lib/analytics";
import {
  toBillDto,
  toPaymentLogDto,
  toPersonalLoanDto,
  toSalaryDto,
  toShoppingLoanDto,
} from "@/lib/mappers";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [user, allLogsRaw] = await Promise.all([
    getCurrentUser(),
    getPaymentLogs("all"),
  ]);

  const allLogs = allLogsRaw.map(toPaymentLogDto);

  if (!user) {
    return (
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-8 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">
          No data yet. Add income, bills, and loans to unlock analytics.
        </p>
      </div>
    );
  }

  const salaries = user.salaries.map(toSalaryDto);
  const bills = user.bills.map(toBillDto);
  const shoppingLoans = user.shoppingLoans.map(toShoppingLoanDto);
  const personalLoans = user.personalLoans.map(toPersonalLoanDto);

  const now = new Date();
  const windowStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const recentLogs = allLogs.filter(
    (log) => new Date(log.date) >= windowStart
  );

  const monthlyCashFlow = buildMonthlyCashFlow(salaries, allLogs, 6);
  const categoryBreakdown = buildCategoryBreakdown(recentLogs);
  const debtPaydown = buildDebtPaydown(shoppingLoans, personalLoans);
  const summary = buildFinancialSummary({
    salaries,
    bills,
    shoppingLoans,
    personalLoans,
    paymentLogs: allLogs,
  });

  return (
    <AnalyticsDashboard
      monthlyCashFlow={monthlyCashFlow}
      categoryBreakdown={categoryBreakdown}
      debtPaydown={debtPaydown}
      summary={summary}
    />
  );
}
