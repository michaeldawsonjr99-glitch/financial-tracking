import { PaymentHistory } from "@/components/history/payment-history";
import { buildFinancialSummary } from "@/lib/analytics";
import type { FinancialSummary } from "@/lib/analytics";
import { getCurrentUser, getPaymentLogs } from "@/lib/data";
import type { PaymentLogRange } from "@/lib/data";
import {
  toBillDto,
  toPaymentLogDto,
  toPersonalLoanDto,
  toSalaryDto,
  toShoppingLoanDto,
} from "@/lib/mappers";

export const dynamic = "force-dynamic";

const RANGES: PaymentLogRange[] = ["month", "30d", "all"];

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { range: rawRange } = await searchParams;
  const rangeParam = Array.isArray(rawRange) ? rawRange[0] : rawRange;
  const range: PaymentLogRange =
    RANGES.includes(rangeParam as PaymentLogRange) && rangeParam
      ? (rangeParam as PaymentLogRange)
      : "month";

  const [logs, user] = await Promise.all([
    getPaymentLogs(range),
    getCurrentUser(),
  ]);

  const dto = logs.map(toPaymentLogDto);
  const totalPaid = dto.reduce((sum, log) => sum + log.amount, 0);

  const salaries = user ? user.salaries.map(toSalaryDto) : [];
  const bills = user ? user.bills.map(toBillDto) : [];
  const shoppingLoans = user ? user.shoppingLoans.map(toShoppingLoanDto) : [];
  const personalLoans = user ? user.personalLoans.map(toPersonalLoanDto) : [];

  const financial: FinancialSummary = buildFinancialSummary({
    salaries,
    bills,
    shoppingLoans,
    personalLoans,
    paymentLogs: dto,
  });

  return (
    <PaymentHistory
      logs={dto}
      range={range}
      bills={bills}
      shoppingLoans={shoppingLoans}
      personalLoans={personalLoans}
      summary={{
        total: totalPaid,
        count: dto.length,
        avg: dto.length > 0 ? totalPaid / dto.length : 0,
      }}
      financial={financial}
      accountEmail={user?.email ?? ""}
    />
  );
}
