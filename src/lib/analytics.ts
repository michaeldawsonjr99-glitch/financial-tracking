import type {
  PaymentLogCategoryKey,
  PaymentLogDto,
  PersonalLoanDto,
  SalaryDto,
  ShoppingLoanDto,
} from "@/lib/types";

export const CATEGORY_LABELS: Record<PaymentLogCategoryKey, string> = {
  BILL: "Bills",
  SHOPPING: "Shopping Loans",
  PERSONAL: "Personal Debts",
};

export type MonthlyCashFlowPoint = {
  month: string;
  label: string;
  income: number;
  outflows: number;
  net: number;
};

export type CategoryBreakdownPoint = {
  key: PaymentLogCategoryKey;
  label: string;
  value: number;
};

export type DebtPaydownItem = {
  id: string;
  name: string;
  kind: "SHOPPING" | "PERSONAL";
  total: number;
  paid: number;
  remaining: number;
  percent: number;
};

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function buildMonthlyCashFlow(
  salaries: SalaryDto[],
  paymentLogs: PaymentLogDto[],
  months = 6,
  now = new Date()
): MonthlyCashFlowPoint[] {
  const incomeByMonth = new Map<string, number>();
  for (const salary of salaries) {
    const key = monthKey(new Date(salary.dateReceived));
    incomeByMonth.set(key, (incomeByMonth.get(key) ?? 0) + salary.amount);
  }

  const outflowByMonth = new Map<string, number>();
  for (const log of paymentLogs) {
    const key = monthKey(new Date(log.date));
    outflowByMonth.set(key, (outflowByMonth.get(key) ?? 0) + log.amount);
  }

  const points: MonthlyCashFlowPoint[] = [];
  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = monthKey(date);
    const income = incomeByMonth.get(key) ?? 0;
    const outflows = outflowByMonth.get(key) ?? 0;

    points.push({
      month: key,
      label: date.toLocaleDateString("en-PH", { month: "short" }),
      income,
      outflows,
      net: income - outflows,
    });
  }

  return points;
}

export function buildCategoryBreakdown(
  paymentLogs: PaymentLogDto[]
): CategoryBreakdownPoint[] {
  const totals: Record<PaymentLogCategoryKey, number> = {
    BILL: 0,
    SHOPPING: 0,
    PERSONAL: 0,
  };

  for (const log of paymentLogs) {
    totals[log.category] += log.amount;
  }

  return (Object.keys(totals) as PaymentLogCategoryKey[]).map((key) => ({
    key,
    label: CATEGORY_LABELS[key],
    value: totals[key],
  }));
}

export function buildDebtPaydown(
  shoppingLoans: ShoppingLoanDto[],
  personalLoans: PersonalLoanDto[]
): DebtPaydownItem[] {
  const items: DebtPaydownItem[] = [];

  for (const loan of shoppingLoans) {
    const total = loan.totalAmount;
    const remaining = Math.max(0, loan.remainingBalance);
    const paid = Math.max(0, total - remaining);
    if (remaining <= 0) continue;
    items.push({
      id: loan.id,
      name: loan.itemName,
      kind: "SHOPPING",
      total,
      paid,
      remaining,
      percent: total > 0 ? (paid / total) * 100 : 0,
    });
  }

  for (const loan of personalLoans) {
    const total = loan.amount;
    const remaining = Math.max(0, loan.remainingBalance);
    const paid = Math.max(0, total - remaining);
    if (remaining <= 0) continue;
    items.push({
      id: loan.id,
      name: loan.personName,
      kind: "PERSONAL",
      total,
      paid,
      remaining,
      percent: total > 0 ? (paid / total) * 100 : 0,
    });
  }

  return items.sort((a, b) => b.remaining - a.remaining);
}

export type FinancialSummary = {
  monthlyIncome: number;
  committedBills: number;
  committedShopping: number;
  committedPersonal: number;
  totalCommitted: number;
  netCashFlow: number;
  totalPaid: number;
  paymentCount: number;
  averagePayment: number;
  categoryTotals: Record<PaymentLogCategoryKey, number>;
  receivable: number;
  payable: number;
  shoppingRemaining: number;
};

export function buildFinancialSummary({
  salaries,
  bills,
  shoppingLoans,
  personalLoans,
  paymentLogs,
}: {
  salaries: SalaryDto[];
  bills: { amount: number; status: string }[];
  shoppingLoans: ShoppingLoanDto[];
  personalLoans: PersonalLoanDto[];
  paymentLogs: PaymentLogDto[];
}): FinancialSummary {
  const monthlyIncome = salaries.reduce((sum, salary) => sum + salary.amount, 0);
  const committedBills = bills
    .filter((bill) => bill.status !== "PAID")
    .reduce((sum, bill) => sum + bill.amount, 0);
  const committedShopping = shoppingLoans
    .filter((loan) => loan.remainingBalance > 0)
    .reduce((sum, loan) => sum + loan.monthlyInstallment, 0);
  const committedPersonal = personalLoans
    .filter((loan) => loan.remainingBalance > 0 && loan.type === "BORROWED")
    .reduce((sum, loan) => sum + loan.monthlyPayment, 0);

  const categoryTotals = buildCategoryBreakdown(paymentLogs).reduce(
    (acc, item) => {
      acc[item.key] = item.value;
      return acc;
    },
    { BILL: 0, SHOPPING: 0, PERSONAL: 0 } as Record<
      PaymentLogCategoryKey,
      number
    >
  );

  const totalPaid = paymentLogs.reduce((sum, log) => sum + log.amount, 0);

  const receivable = personalLoans
    .filter((loan) => loan.type === "LENT")
    .reduce((sum, loan) => sum + loan.remainingBalance, 0);
  const payable = personalLoans
    .filter((loan) => loan.type === "BORROWED")
    .reduce((sum, loan) => sum + loan.remainingBalance, 0);

  const shoppingRemaining = shoppingLoans.reduce(
    (sum, loan) => sum + Math.max(0, loan.remainingBalance),
    0
  );

  const totalCommitted =
    committedBills + committedShopping + committedPersonal;

  return {
    monthlyIncome,
    committedBills,
    committedShopping,
    committedPersonal,
    totalCommitted,
    netCashFlow: monthlyIncome - totalCommitted,
    totalPaid,
    paymentCount: paymentLogs.length,
    averagePayment: paymentLogs.length > 0 ? totalPaid / paymentLogs.length : 0,
    categoryTotals,
    receivable,
    payable,
    shoppingRemaining,
  };
}
