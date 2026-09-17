"use client";

import { HandCoins, Mail, PiggyBank, User } from "lucide-react";

import { AddPersonalLoanDialog } from "@/components/loans/add-personal-loan-dialog";
import { DueBadge } from "@/components/loans/due-badge";
import { RecordPaymentDialog } from "@/components/loans/record-payment-dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "cn";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCurrency } from "@/lib/format";
import type {
  PersonalLoanDto,
  PersonalLoanStatusKey,
  PersonalLoanTypeKey,
} from "@/lib/types";

function StatusBadge({
  status,
  className,
}: {
  status: PersonalLoanStatusKey;
  className?: string;
}) {
  const config: Record<
    PersonalLoanStatusKey,
    { label: string; className: string }
  > = {
    UNPAID: {
      label: "UNPAID",
      className:
        "bg-muted text-muted-foreground ring-border dark:bg-muted/60",
    },
    PARTIALLY_PAID: {
      label: "PARTIALLY PAID",
      className:
        "bg-sky-500/12 text-sky-600 ring-sky-600/20 dark:bg-sky-400/10 dark:text-sky-400 dark:ring-sky-400/20",
    },
    FULLY_PAID: {
      label: "FULLY PAID",
      className:
        "bg-emerald-500/12 text-emerald-600 ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-400 dark:ring-emerald-400/20",
    },
  };

  return (
    <Badge className={cn(config[status].className, className)}>
      {config[status].label}
    </Badge>
  );
}

function TypeBadge({ type }: { type: PersonalLoanTypeKey }) {
  return type === "LENT" ? (
    <Badge className="bg-primary/12 text-primary ring-primary/20 dark:bg-primary/15">
      I Lent
    </Badge>
  ) : (
    <Badge className="bg-secondary text-secondary-foreground ring-border">
      I Borrowed
    </Badge>
  );
}

function LoanCard({ loan }: { loan: PersonalLoanDto }) {
  const isLent = loan.type === "LENT";
  const percentPaid = loan.amount > 0 ? (loan.paidAmount / loan.amount) * 100 : 0;
  const isPaidOff = loan.status === "FULLY_PAID";

  return (
    <Card className="group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-ring/5">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <User className="size-4" />
            </div>
            <span className="truncate">{loan.personName}</span>
          </span>
          <StatusBadge status={loan.status} className="shrink-0" />
        </CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <TypeBadge type={loan.type} />
          {loan.email ? (
            <span className="flex max-w-full items-center gap-1 truncate text-xs">
              <Mail className="size-3 shrink-0" />
              <span className="truncate">{loan.email}</span>
            </span>
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
          <span className="text-muted-foreground">
            {isLent ? "Receivable" : "Payable"} / month
          </span>
          <span className="font-medium tabular-nums">
            {formatCurrency(loan.monthlyPayment)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Remaining</span>
          <span className="font-medium tabular-nums">
            {formatCurrency(loan.remainingBalance)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Total</span>
          <span className="tabular-nums">{formatCurrency(loan.amount)}</span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
          <span className="text-xs text-muted-foreground">
            {loan.tenureMonths}{" "}
            {loan.tenureMonths === 1 ? "month" : "months"}
          </span>
          <DueBadge
            dueDay={loan.dueDay}
            startDate={loan.startDate ?? undefined}
            isPaid={isPaidOff}
          />
        </div>
      </CardContent>

      <CardFooter className="justify-end">
        {!isPaidOff && <RecordPaymentDialog loan={loan} />}
      </CardFooter>
    </Card>
  );
}

function LoanList({
  loans,
  emptyMessage,
}: {
  loans: PersonalLoanDto[];
  emptyMessage: string;
}) {
  if (loans.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {loans.map((loan) => (
        <LoanCard key={loan.id} loan={loan} />
      ))}
    </div>
  );
}

export function PersonalLoans({
  loans,
  currentUserEmail = "",
}: {
  loans: PersonalLoanDto[];
  currentUserEmail?: string;
}) {
  const lent = loans.filter((loan) => loan.type === "LENT");
  const borrowed = loans.filter((loan) => loan.type === "BORROWED");

  const totalReceivable = lent.reduce(
    (sum, loan) => sum + loan.remainingBalance,
    0
  );
  const totalPayable = borrowed.reduce(
    (sum, loan) => sum + loan.remainingBalance,
    0
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            Personal Loans
          </h1>
          <p className="text-sm text-muted-foreground">
            Track money lent to others and money you borrowed.
          </p>
        </div>
        <AddPersonalLoanDialog currentUserEmail={currentUserEmail} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <HandCoins className="size-4" />
              Total Receivable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {formatCurrency(totalReceivable)}
            </p>
            <CardDescription>
              {lent.filter((loan) => loan.status !== "FULLY_PAID").length} open
              loan
              {lent.filter((loan) => loan.status !== "FULLY_PAID").length === 1
                ? ""
                : "s"}{" "}
              owed to you
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <PiggyBank className="size-4" />
              Total Payable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">
              {formatCurrency(totalPayable)}
            </p>
            <CardDescription>
              {borrowed.filter((loan) => loan.status !== "FULLY_PAID").length}{" "}
              open loan
              {borrowed.filter((loan) => loan.status !== "FULLY_PAID")
                .length === 1
                ? ""
                : "s"}{" "}
              you owe
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="lent">
        <TabsList className="w-full sm:w-fit">
          <TabsTrigger value="lent">Money Lent</TabsTrigger>
          <TabsTrigger value="borrowed">Money Borrowed</TabsTrigger>
        </TabsList>

        <TabsContent value="lent">
          <LoanList
            loans={lent}
            emptyMessage="No loans you've lent out. Click Add Loan to record money lent."
          />
        </TabsContent>

        <TabsContent value="borrowed">
          <LoanList
            loans={borrowed}
            emptyMessage="No loans you've borrowed. Click Add Loan to record money borrowed."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}