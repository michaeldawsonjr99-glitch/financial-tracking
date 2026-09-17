"use client";

import Link from "next/link";
import { useFormStatus } from "react-dom";
import { cn } from "cn";
import {
  Download,
  HandCoins,
  ListChecks,
  ReceiptText,
  ShoppingBag,
  Trash2,
  User,
} from "lucide-react";

import { deletePaymentLog } from "@/app/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CATEGORY_LABELS } from "@/lib/analytics";
import type { FinancialSummary } from "@/lib/analytics";
import { formatCurrency } from "@/lib/format";
import type {
  BillDto,
  PaymentLogCategoryKey,
  PaymentLogDto,
  PaymentLogRangeKey,
  PaymentLogStatusKind,
  PersonalLoanDto,
  ShoppingLoanDto,
} from "@/lib/types";

const RANGES: { key: PaymentLogRangeKey; label: string }[] = [
  { key: "month", label: "Current Month" },
  { key: "30d", label: "Last 30 Days" },
  { key: "all", label: "All Time" },
];

const CATEGORY_ICONS: Record<PaymentLogCategoryKey, typeof ReceiptText> = {
  BILL: ReceiptText,
  SHOPPING: ShoppingBag,
  PERSONAL: User,
};

const KIND_VARIANT: Record<
  PaymentLogStatusKind,
  "default" | "secondary" | "outline"
> = {
  paid: "default",
  active: "secondary",
  pending: "outline",
};

function formatFullDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function csvCell(value: string | number) {
  const text = String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}

function csvMoney(value: number) {
  return value.toFixed(2);
}

function buildCsv({
  logs,
  range,
  financial,
  accountEmail,
  bills,
  shoppingLoans,
  personalLoans,
}: {
  logs: PaymentLogDto[];
  range: PaymentLogRangeKey;
  financial: FinancialSummary;
  accountEmail: string;
  bills: BillDto[];
  shoppingLoans: ShoppingLoanDto[];
  personalLoans: PersonalLoanDto[];
}) {
  const rangeLabel =
    RANGES.find((option) => option.key === range)?.label ?? range;

  const lines: string[] = [];

  lines.push("Finance Tracker — Payment Report");
  lines.push([csvCell("Generated"), csvCell(new Date().toISOString())].join(","));
  lines.push([csvCell("Account"), csvCell(accountEmail || "—")].join(","));
  lines.push([csvCell("Range"), csvCell(rangeLabel)].join(","));
  lines.push("");

  const remainingBalance =
    bills
      .filter((bill) => bill.status !== "PAID")
      .reduce((sum, bill) => sum + bill.amount, 0) +
    shoppingLoans.reduce(
      (sum, loan) => sum + Math.max(0, loan.remainingBalance),
      0
    ) +
    personalLoans.reduce(
      (sum, loan) => sum + Math.max(0, loan.remainingBalance),
      0
    );
  const outstandingLoanDebt =
    shoppingLoans.reduce(
      (sum, loan) => sum + Math.max(0, loan.remainingBalance),
      0
    ) +
    personalLoans
      .filter((loan) => loan.type === "BORROWED")
      .reduce((sum, loan) => sum + Math.max(0, loan.remainingBalance), 0);

  lines.push("SUMMARY");
  lines.push(["Metric", "Value"].join(","));
  lines.push(["Total Income", csvMoney(financial.monthlyIncome)].join(","));
  lines.push(["Total Outflows", csvMoney(financial.totalCommitted)].join(","));
  lines.push(["Remaining Balance", csvMoney(remainingBalance)].join(","));
  lines.push(
    ["Total Outstanding Loan Debt", csvMoney(outstandingLoanDebt)].join(",")
  );
  lines.push("");

  lines.push("ACTIVE LOANS AND BILLS");
  lines.push(
    ["Category", "Name", "Type", "Total Amount", "Amount Paid", "Remaining Balance", "Status"].join(",")
  );
  for (const bill of bills) {
    if (bill.status === "PAID") continue;
    lines.push(
      [
        csvCell("Bill"),
        csvCell(bill.title),
        csvCell("Bill"),
        csvMoney(bill.amount),
        csvMoney(0),
        csvMoney(bill.amount),
        csvCell(bill.status),
      ].join(",")
    );
  }
  for (const loan of shoppingLoans) {
    if (loan.remainingBalance <= 0) continue;
    const paid = Math.max(0, loan.totalAmount - loan.remainingBalance);
    lines.push(
      [
        csvCell("Shopping Loan"),
        csvCell(loan.itemName),
        csvCell(`${loan.tenureMonths} months`),
        csvMoney(loan.totalAmount),
        csvMoney(paid),
        csvMoney(loan.remainingBalance),
        csvCell("ACTIVE"),
      ].join(",")
    );
  }
  for (const loan of personalLoans) {
    if (loan.remainingBalance <= 0) continue;
    lines.push(
      [
        csvCell("Personal Loan"),
        csvCell(loan.personName),
        csvCell(loan.type === "BORROWED" ? "Borrowed" : "Lent"),
        csvMoney(loan.amount),
        csvMoney(loan.paidAmount),
        csvMoney(loan.remainingBalance),
        csvCell(loan.type === "BORROWED" ? "ACTIVE" : "OUTSTANDING"),
      ].join(",")
    );
  }
  lines.push("");

  lines.push("TRANSACTIONS");
  lines.push(["Date", "Category", "Name", "Amount Paid", "Status"].join(","));
  for (const log of logs) {
    lines.push(
      [
        csvCell(formatFullDate(log.date)),
        csvCell(CATEGORY_LABELS[log.category]),
        csvCell(log.title),
        csvMoney(log.amount),
        csvCell(log.statusLabel),
      ].join(",")
    );
  }

  return lines.join("\n");
}

function DeleteLogButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="ghost"
      size="icon"
      disabled={pending}
      aria-label="Delete log entry"
    >
      {pending ? (
        <span className="text-xs text-muted-foreground">…</span>
      ) : (
        <Trash2 />
      )}
    </Button>
  );
}

function DeleteLogForm({ id }: { id: string }) {
  return (
    <form
      action={deletePaymentLog}
      onSubmit={(e) => {
        if (!window.confirm("Delete this transaction log entry?")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <DeleteLogButton />
    </form>
  );
}

export function PaymentHistory({
  logs,
  range,
  summary,
  financial,
  accountEmail,
  bills,
  shoppingLoans,
  personalLoans,
}: {
  logs: PaymentLogDto[];
  range: PaymentLogRangeKey;
  summary: { total: number; count: number; avg: number };
  financial: FinancialSummary;
  accountEmail: string;
  bills: BillDto[];
  shoppingLoans: ShoppingLoanDto[];
  personalLoans: PersonalLoanDto[];
}) {
  const handleExport = () => {
    const csv = buildCsv({
      logs,
      range,
      financial,
      accountEmail,
      bills,
      shoppingLoans,
      personalLoans,
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `finance-report-${range}-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Payment Log &amp; Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Every payment for bills, shopping loans, and personal debts — with a
            full financial report export.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex w-fit rounded-lg border bg-muted p-1">
            {RANGES.map((option) => {
              const isActive = range === option.key;

              return (
                <Link
                  key={option.key}
                  href={`/history?range=${option.key}`}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {option.label}
                </Link>
              );
            })}
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <HandCoins className="size-4" />
              Total Money Out
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {formatCurrency(summary.total)}
            </p>
            <CardDescription>In the selected time frame</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ListChecks className="size-4" />
              Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {summary.count}
            </p>
            <CardDescription>
              {summary.count === 1 ? "Transaction" : "Transactions"} logged
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <HandCoins className="size-4" />
              Average Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {formatCurrency(summary.avg)}
            </p>
            <CardDescription>Average per transaction</CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <HandCoins className="size-4" />
              Net Cash Flow
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                "text-2xl font-semibold tabular-nums",
                financial.netCashFlow >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              )}
            >
              {formatCurrency(financial.netCashFlow)}
            </p>
            <CardDescription>Monthly income minus commitments</CardDescription>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <CardDescription>
            {RANGES.find((option) => option.key === range)?.label} — click the
            trash icon to delete a log entry. Export includes summary and
            analytics metrics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No transactions in this period. Payments logged here come from
              marking bills paid or recording loan payments.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Title / Recipient</TableHead>
                  <TableHead className="text-right">Amount Paid</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const Icon = CATEGORY_ICONS[log.category];

                  return (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatFullDate(log.date)}
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5">
                          <Icon className="size-4 text-muted-foreground" />
                          {CATEGORY_LABELS[log.category]}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{log.title}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatCurrency(log.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={KIND_VARIANT[log.statusKind]}>
                          {log.statusLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DeleteLogForm id={log.id} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
