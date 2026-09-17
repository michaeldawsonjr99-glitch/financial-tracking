"use client";

import { useFormStatus } from "react-dom";
import { Banknote, CalendarClock, Trash2, Wallet } from "lucide-react";

import { deleteSalary } from "@/app/actions";
import { SalaryDialog } from "@/components/salaries/salary-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import type { SalaryDto } from "@/lib/types";

function formatMonth(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-PH", {
    month: "long",
    year: "numeric",
  });
}

function DeleteSalaryButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="ghost"
      size="icon"
      disabled={pending}
      aria-label="Delete salary"
    >
      {pending ? (
        <span className="text-xs text-muted-foreground">…</span>
      ) : (
        <Trash2 />
      )}
    </Button>
  );
}

function DeleteSalaryForm({ id }: { id: string }) {
  return (
    <form
      action={deleteSalary}
      onSubmit={(e) => {
        if (!window.confirm("Delete this salary record?")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <DeleteSalaryButton />
    </form>
  );
}

export function Salaries({ salaries }: { salaries: SalaryDto[] }) {
  const latest = salaries.length > 0 ? salaries[salaries.length - 1] : null;
  const total = salaries.reduce((sum, salary) => sum + salary.amount, 0);
  const average = salaries.length > 0 ? total / salaries.length : 0;

  const summaryCards: {
    title: string;
    value: string;
    description: string;
    icon: typeof Banknote;
  }[] = [
    {
      title: "Monthly Income",
      value: latest ? formatCurrency(latest.amount) : "—",
      description: latest ? formatMonth(latest.dateReceived) : "No entry yet",
      icon: Wallet,
    },
    {
      title: "Average per Month",
      value: formatCurrency(average),
      description: `Across ${salaries.length} month${salaries.length === 1 ? "" : "s"}`,
      icon: Banknote,
    },
    {
      title: "Months Recorded",
      value: String(salaries.length),
      description: "One entry per month",
      icon: CalendarClock,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Monthly Income</h1>
          <p className="text-sm text-muted-foreground">
            Store one income entry per month for a clean monthly cash flow view.
          </p>
        </div>
        <SalaryDialog />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {summaryCards.map((card) => {
          const Icon = card.icon;

          return (
            <Card key={card.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Icon className="size-4" />
                  {card.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tabular-nums">
                  {card.value}
                </p>
                <CardDescription>{card.description}</CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Income Records</CardTitle>
          <CardDescription>
            {salaries.length} record{salaries.length === 1 ? "" : "s"} — edit an
            amount or delete an entry anytime.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {salaries.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No income records yet. Click <strong>Add Salary</strong> to create
              one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salaries.map((salary) => (
                  <TableRow key={salary.id}>
                    <TableCell className="font-medium">
                      {formatMonth(salary.dateReceived)}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-primary/12 text-primary ring-primary/20 dark:bg-primary/15">
                        MONTHLY
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(salary.amount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <SalaryDialog salary={salary} />
                        <DeleteSalaryForm id={salary.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
