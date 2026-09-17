"use client";

import { useFormStatus } from "react-dom";
import { ShoppingBag, Trash2 } from "lucide-react";

import { deleteShoppingLoan } from "@/app/actions";
import { AddShoppingLoanDialog } from "@/components/loans/add-shopping-loan-dialog";
import {
  DueBadge,
  getDueBadgeState,
  getNextDueDate,
  getScheduledDueDate,
} from "@/components/loans/due-badge";
import { LogPaymentDialog } from "@/components/loans/log-payment-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/format";
import type { ShoppingLoanDto } from "@/lib/types";

function DeleteShoppingLoanButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="ghost"
      size="icon"
      disabled={pending}
      aria-label="Delete shopping loan"
    >
      {pending ? (
        <span className="text-xs text-muted-foreground">…</span>
      ) : (
        <Trash2 />
      )}
    </Button>
  );
}

function DeleteShoppingLoanForm({
  id,
  itemName,
}: {
  id: string;
  itemName: string;
}) {
  return (
    <form
      action={deleteShoppingLoan}
      onSubmit={(e) => {
        if (
          !window.confirm(
            `Delete "${itemName}"? Its payment history will also be removed.`
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <DeleteShoppingLoanButton />
    </form>
  );
}

function ShoppingLoanCard({ loan }: { loan: ShoppingLoanDto }) {
  const paidAmount = loan.totalAmount - loan.remainingBalance;
  const percentPaid =
    loan.totalAmount > 0 ? (paidAmount / loan.totalAmount) * 100 : 0;
  const isPaidOff = loan.remainingBalance <= 0;
  const due = getDueBadgeState(
    loan.startDate
      ? getScheduledDueDate(loan.dueDay, new Date(loan.startDate))
      : getNextDueDate(loan.dueDay),
    isPaidOff
  );

  return (
    <Card className="group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-ring/5">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ShoppingBag className="size-4" />
            </div>
            <span className="truncate">{loan.itemName}</span>
          </span>
          <DueBadge
            dueDay={loan.dueDay}
            startDate={loan.startDate ?? undefined}
            isPaid={isPaidOff}
            className="shrink-0"
          />
        </CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span>{formatCurrency(loan.monthlyInstallment)} / month</span>
          <span aria-hidden>·</span>
          <span>{loan.tenureMonths} mo term</span>
          {loan.interestPercentage > 0 ? (
            <>
              <span aria-hidden>·</span>
              <span>{loan.interestPercentage}% interest</span>
            </>
          ) : null}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Paid</span>
          <span className="tabular-nums">{percentPaid.toFixed(0)}%</span>
        </div>
        <Progress value={percentPaid} />

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Remaining</span>
          <span className="font-medium tabular-nums">
            {formatCurrency(loan.remainingBalance)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total principal</span>
          <span className="tabular-nums">{formatCurrency(loan.totalAmount)}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Due day</span>
          <span className="tabular-nums">
            <Badge variant="outline" className="font-medium">
              {ordinalLabel(loan.dueDay)}
            </Badge>
            <span className="sr-only">{due.label}</span>
          </span>
        </div>
      </CardContent>

      <CardFooter className="justify-between">
        <DeleteShoppingLoanForm id={loan.id} itemName={loan.itemName} />
        <LogPaymentDialog loan={loan} />
      </CardFooter>
    </Card>
  );
}

function ordinalLabel(day: number) {
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

export function ShoppingLoans({ loans }: { loans: ShoppingLoanDto[] }) {
  const totalRemaining = loans.reduce(
    (sum, loan) => sum + loan.remainingBalance,
    0
  );
  const active = loans.filter((loan) => loan.remainingBalance > 0);
  const dueSoon = active.filter((loan) => {
    const state = getDueBadgeState(
      loan.startDate
        ? getScheduledDueDate(loan.dueDay, new Date(loan.startDate))
        : getNextDueDate(loan.dueDay),
      false
    );
    return state.kind === "overdue" || state.kind === "due-today";
  }).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Shopping Loans
          </h1>
          <p className="text-sm text-muted-foreground">
            Installment balances from shop-now-pay-later apps.
          </p>
        </div>
        <AddShoppingLoanDialog />
      </div>

      {loans.length === 0 ? (
        <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
          No shopping loans yet. Click <strong>Add Loan</strong> to track one.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border bg-card px-4 py-3">
            <div>
              <p className="text-xs text-muted-foreground">Active loans</p>
              <p className="text-sm font-semibold tabular-nums">{active.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Due/overdue now</p>
              <p className="text-sm font-semibold tabular-nums">{dueSoon}</p>
            </div>
            <div className="ml-auto">
              <p className="text-xs text-muted-foreground">Total remaining</p>
              <p className="text-sm font-semibold tabular-nums">
                {formatCurrency(totalRemaining)}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {loans.map((loan) => (
              <ShoppingLoanCard key={loan.id} loan={loan} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}