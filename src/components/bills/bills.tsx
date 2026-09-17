"use client";

import { useFormStatus } from "react-dom";
import { CheckCircle2, Circle, ReceiptText, Trash2 } from "lucide-react";

import { deleteBill, setBillStatus } from "@/app/actions";
import { BillDialog } from "@/components/bills/bill-dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import type { BillDto, BillStatusKey } from "@/lib/types";

function StatusBadge({ status }: { status: BillStatusKey }) {
  return (
    <Badge variant={status === "PAID" ? "default" : "outline"}>
      {status === "PAID" ? "PAID" : "PENDING"}
    </Badge>
  );
}

function StatusToggleButton({ nextStatus }: { nextStatus: BillStatusKey }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="sm"
      variant={nextStatus === "PAID" ? "default" : "ghost"}
      disabled={pending}
      aria-label={`Mark as ${nextStatus === "PAID" ? "paid" : "pending"}`}
    >
      {pending ? (
        "Saving…"
      ) : nextStatus === "PAID" ? (
        <>
          <CheckCircle2 />
          Mark Paid
        </>
      ) : (
        <>
          <Circle />
          Mark Pending
        </>
      )}
    </Button>
  );
}

function BillStatusToggle({ bill }: { bill: BillDto }) {
  const nextStatus: BillStatusKey = bill.status === "PAID" ? "PENDING" : "PAID";

  return (
    <form action={setBillStatus}>
      <input type="hidden" name="billId" value={bill.id} />
      <input type="hidden" name="status" value={nextStatus} />
      <StatusToggleButton nextStatus={nextStatus} />
    </form>
  );
}

function DeleteBillButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="ghost"
      size="icon"
      disabled={pending}
      aria-label="Delete bill"
    >
      {pending ? (
        <span className="text-xs text-muted-foreground">…</span>
      ) : (
        <Trash2 />
      )}
    </Button>
  );
}

function DeleteBillForm({ id }: { id: string }) {
  return (
    <form
      action={deleteBill}
      onSubmit={(e) => {
        if (!window.confirm("Delete this bill?")) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <DeleteBillButton />
    </form>
  );
}

export function Bills({ bills }: { bills: BillDto[] }) {
  const pendingBills = bills.filter((bill) => bill.status === "PENDING");
  const totalBillsDue = pendingBills.reduce((sum, bill) => sum + bill.amount, 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Bills Tracker</h1>
          <p className="text-sm text-muted-foreground">
            Track bill payments and stay within budget.
          </p>
        </div>
        <BillDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <ReceiptText className="size-4" />
            Total Bills Due
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-semibold tabular-nums">
            {formatCurrency(totalBillsDue)}
          </p>
          <CardDescription>
            {pendingBills.length} of {bills.length} bills pending
          </CardDescription>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bills</CardTitle>
          <CardDescription>Edit, mark paid, or delete bills.</CardDescription>
        </CardHeader>
        <CardContent>
          {bills.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No bills yet. Click <strong>Add Bill</strong> to create one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bill</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Countdown</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bills.map((bill) => (
                  <TableRow key={bill.id}>
                    <TableCell className="font-medium">{bill.title}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(bill.dueDate)}
                    </TableCell>
                    <TableCell>
                      <DueBadge
                        dueDate={bill.dueDate}
                        isPaid={bill.status === "PAID"}
                        paidLabel="Paid"
                      />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(bill.amount)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={bill.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <BillStatusToggle bill={bill} />
                        <BillDialog bill={bill} />
                        <DeleteBillForm id={bill.id} />
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