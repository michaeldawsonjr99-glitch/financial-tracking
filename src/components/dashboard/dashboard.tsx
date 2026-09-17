"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Circle,
  HandCoins,
  PiggyBank,
  ReceiptText,
  Scale,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import { cn } from "cn";

import { setBillStatus } from "@/app/actions";
import { DueBadge } from "@/components/loans/due-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/format";
import type {
  BillDto,
  PersonalLoanDto,
  SalaryDto,
  ShoppingLoanDto,
} from "@/lib/types";

type ObligationKind = "BILL" | "SHOPPING" | "LENT" | "BORROWED";

type Obligation = {
  id: string;
  kind: ObligationKind;
  title: string;
  subtitle: string;
  amount: number;
  dueDay?: number;
  dueDate?: string;
  startDate?: string;
  isPaid: boolean;
};

function dayOrdinal(day: number) {
  const suffix =
    day % 10 === 1 && day % 100 !== 11
      ? "st"
      : day % 10 === 2 && day % 100 !== 12
        ? "nd"
        : day % 10 === 3 && day % 100 !== 13
          ? "rd"
          : "th";
  return `${day}${suffix}`;
}

function ToggleButton({ nextStatus }: { nextStatus: "PENDING" | "PAID" }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="xs"
      variant={nextStatus === "PAID" ? "default" : "outline"}
      disabled={pending}
      aria-label={`Mark as ${nextStatus === "PAID" ? "paid" : "pending"}`}
    >
      {pending ? (
        "Saving…"
      ) : nextStatus === "PAID" ? (
        <>
          <CheckCircle2 /> Mark paid
        </>
      ) : (
        <>
          <Circle /> Mark pending
        </>
      )}
    </Button>
  );
}

function BillToggle({ bill }: { bill: BillDto }) {
  const nextStatus = bill.status === "PAID" ? "PENDING" : "PAID";

  return (
    <form action={setBillStatus}>
      <input type="hidden" name="billId" value={bill.id} />
      <input type="hidden" name="status" value={nextStatus} />
      <ToggleButton nextStatus={nextStatus} />
    </form>
  );
}

const KIND_META: Record<
  ObligationKind,
  { label: string; icon: typeof ReceiptText; className: string }
> = {
  BILL: {
    label: "Bill",
    icon: ReceiptText,
    className: "bg-sky-500/12 text-sky-600 dark:text-sky-400",
  },
  SHOPPING: {
    label: "Shopping",
    icon: ShoppingBag,
    className: "bg-violet-500/12 text-violet-600 dark:text-violet-400",
  },
  BORROWED: {
    label: "Borrowed",
    icon: PiggyBank,
    className: "bg-rose-500/12 text-rose-600 dark:text-rose-400",
  },
  LENT: {
    label: "Lent",
    icon: HandCoins,
    className: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
  },
};

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "default",
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof Wallet;
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
          className={cn(
            "text-2xl font-semibold tabular-nums",
            tone === "positive" && "text-emerald-600 dark:text-emerald-400",
            tone === "negative" && "text-rose-600 dark:text-rose-400"
          )}
        >
          {value}
        </p>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

export function Dashboard({
  bills,
  salaries,
  shoppingLoans,
  personalLoans,
}: {
  bills: BillDto[];
  salaries: SalaryDto[];
  shoppingLoans: ShoppingLoanDto[];
  personalLoans: PersonalLoanDto[];
}) {
  const [filter, setFilter] = useState<"ALL" | ObligationKind>("ALL");

  const obligations = useMemo<Obligation[]>(() => {
    const rows: Obligation[] = [];

    for (const bill of bills) {
      rows.push({
        id: `bill-${bill.id}`,
        kind: "BILL",
        title: bill.title,
        subtitle: `Due ${new Date(bill.dueDate).toLocaleDateString("en-PH", {
          month: "short",
          day: "numeric",
        })}`,
        amount: bill.amount,
        dueDate: bill.dueDate,
        isPaid: bill.status === "PAID",
      });
    }

    for (const loan of shoppingLoans) {
      if (loan.remainingBalance <= 0) continue;
      rows.push({
        id: `shopping-${loan.id}`,
        kind: "SHOPPING",
        title: loan.itemName,
        subtitle: `${formatCurrency(loan.monthlyInstallment)} / mo · ${loan.tenureMonths} mo term`,
        amount: loan.monthlyInstallment,
        dueDay: loan.dueDay,
        startDate: loan.startDate ?? undefined,
        isPaid: false,
      });
    }

    for (const loan of personalLoans) {
      if (loan.remainingBalance <= 0) continue;
      rows.push({
        id: `personal-${loan.id}`,
        kind: loan.type,
        title: loan.personName,
        subtitle: `${formatCurrency(loan.monthlyPayment)} / mo · ${loan.tenureMonths} mo term`,
        amount: loan.monthlyPayment,
        dueDay: loan.dueDay,
        startDate: loan.startDate ?? undefined,
        isPaid: false,
      });
    }

    return rows;
  }, [bills, shoppingLoans, personalLoans]);

  const filtered =
    filter === "ALL"
      ? obligations
      : obligations.filter((item) => item.kind === filter);

  const monthlyIncome = salaries.reduce((sum, salary) => sum + salary.amount, 0);
  const billsDue = bills
    .filter((bill) => bill.status !== "PAID")
    .reduce((sum, bill) => sum + bill.amount, 0);
  const shoppingCommitment = shoppingLoans
    .filter((loan) => loan.remainingBalance > 0)
    .reduce((sum, loan) => sum + loan.monthlyInstallment, 0);
  const personalPayable = personalLoans
    .filter((loan) => loan.remainingBalance > 0 && loan.type === "BORROWED")
    .reduce((sum, loan) => sum + loan.monthlyPayment, 0);
  const personalReceivable = personalLoans
    .filter((loan) => loan.remainingBalance > 0 && loan.type === "LENT")
    .reduce((sum, loan) => sum + loan.monthlyPayment, 0);

  const totalOutflows = billsDue + shoppingCommitment + personalPayable;
  const netCashFlow = monthlyIncome - totalOutflows;
  const outflowsPercent =
    monthlyIncome > 0
      ? Math.min(100, (totalOutflows / monthlyIncome) * 100)
      : totalOutflows > 0
        ? 100
        : 0;

  const outstandingDebt =
    shoppingLoans.reduce((sum, loan) => sum + loan.remainingBalance, 0) +
    personalLoans
      .filter((loan) => loan.type === "BORROWED")
      .reduce((sum, loan) => sum + loan.remainingBalance, 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">
          Monthly Financial Overview
        </h1>
        <p className="text-sm text-muted-foreground">
          Your income, bills, shopping loans, and personal debts in one unified
          cash flow view.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Monthly Income"
          value={formatCurrency(monthlyIncome)}
          description={`${salaries.length} month${salaries.length === 1 ? "" : "s"} recorded`}
          icon={Wallet}
        />
        <StatCard
          title="Total Outflows"
          value={formatCurrency(totalOutflows)}
          description={`${bills.filter((b) => b.status !== "PAID").length} pending bill${bills.filter((b) => b.status !== "PAID").length === 1 ? "" : "s"} + loan commitments`}
          icon={ArrowUpRight}
          tone="negative"
        />
        <StatCard
          title="Net Cash Flow"
          value={formatCurrency(netCashFlow)}
          description={
            netCashFlow >= 0 ? "Surplus for the month" : "Shortfall for the month"
          }
          icon={Scale}
          tone={netCashFlow >= 0 ? "positive" : "negative"}
        />
        <StatCard
          title="Outstanding Debt"
          value={formatCurrency(outstandingDebt)}
          description="Shopping + borrowed balances"
          icon={PiggyBank}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Monthly Cash Flow</CardTitle>
            <CardDescription>
              How your income is allocated across obligations.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                <ArrowDownRight className="size-4" /> Income
              </span>
              <span className="font-semibold tabular-nums">
                {formatCurrency(monthlyIncome)}
              </span>
            </div>

            <Progress value={outflowsPercent} className="h-2" />

            <div className="grid gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Bills</span>
                <span className="tabular-nums">{formatCurrency(billsDue)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Shopping loans</span>
                <span className="tabular-nums">
                  {formatCurrency(shoppingCommitment)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Personal debts</span>
                <span className="tabular-nums">
                  {formatCurrency(personalPayable)}
                </span>
              </div>
              <div className="flex items-center justify-between border-t pt-2 font-medium">
                <span>Net cash flow</span>
                <span
                  className={cn(
                    "tabular-nums",
                    netCashFlow >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  )}
                >
                  {formatCurrency(netCashFlow)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Debt &amp; Receivables</CardTitle>
            <CardDescription>What you owe and what you are owed.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
              <span className="flex items-center gap-2 text-muted-foreground">
                <PiggyBank className="size-4" /> You owe
              </span>
              <span className="font-semibold tabular-nums">
                {formatCurrency(personalPayable)}
                <span className="text-xs font-normal text-muted-foreground">
                  {" "}
                  / mo
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
              <span className="flex items-center gap-2 text-muted-foreground">
                <HandCoins className="size-4" /> Owed to you
              </span>
              <span className="font-semibold tabular-nums">
                {formatCurrency(personalReceivable)}
                <span className="text-xs font-normal text-muted-foreground">
                  {" "}
                  / mo
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
              <span className="flex items-center gap-2 text-muted-foreground">
                <ShoppingBag className="size-4" /> Shopping remaining
              </span>
              <span className="font-semibold tabular-nums">
                {formatCurrency(
                  shoppingLoans.reduce(
                    (sum, loan) => sum + loan.remainingBalance,
                    0
                  )
                )}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All Obligations</CardTitle>
              <CardDescription>
                Everything due, with live countdown badges.
              </CardDescription>
            </div>
            <Tabs
              value={filter}
              onValueChange={(value) => setFilter(value as typeof filter)}
            >
              <TabsList className="w-full sm:w-fit">
                <TabsTrigger value="ALL">All</TabsTrigger>
                <TabsTrigger value="BILL">Bills</TabsTrigger>
                <TabsTrigger value="SHOPPING">Shopping</TabsTrigger>
                <TabsTrigger value="BORROWED">Borrowed</TabsTrigger>
                <TabsTrigger value="LENT">Lent</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Nothing here yet. Add bills, shopping loans, or personal loans to
              see them unified on your dashboard.
            </div>
          ) : (
            <div className="flex flex-col divide-y">
              {filtered.map((item) => {
                const meta = KIND_META[item.kind];
                const Icon = meta.icon;

                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-lg",
                          meta.className
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 truncate font-medium">
                          {item.title}
                          <Badge variant="outline" className="hidden sm:inline-flex">
                            {meta.label}
                          </Badge>
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <span className="font-semibold tabular-nums">
                        {formatCurrency(item.amount)}
                      </span>
                      {item.kind === "BILL" ? (
                        <div className="flex items-center gap-2">
                          <DueBadge
                            dueDate={item.dueDate}
                            isPaid={item.isPaid}
                            paidLabel="Paid"
                          />
                          <BillToggle
                            bill={bills.find(
                              (bill) => `bill-${bill.id}` === item.id
                            )!}
                          />
                        </div>
                      ) : (
                        <DueBadge
                          dueDay={item.dueDay}
                          startDate={item.startDate}
                          isPaid={item.isPaid}
                          paidLabel="Settled"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
