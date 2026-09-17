"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { ArrowLeftRight } from "lucide-react";

import { logPersonalLoanPayment } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/format";
import type { PersonalLoanDto } from "@/lib/types";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Record Payment"}
    </Button>
  );
}

export function RecordPaymentDialog({ loan }: { loan: PersonalLoanDto }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<string>(
    String(loan.remainingBalance ?? 0)
  );

  const isLent = loan.type === "LENT";

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setAmount(String(loan.remainingBalance ?? 0));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <ArrowLeftRight />
            Record Payment
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            {isLent
              ? `Payment received from ${loan.personName}.`
              : `Payment sent to ${loan.personName}.`}
          </DialogDescription>
        </DialogHeader>

        <form
          action={logPersonalLoanPayment}
          onSubmit={() => setOpen(false)}
          className="grid gap-4"
        >
          <input type="hidden" name="loanId" value={loan.id} />

          <div className="grid gap-2">
            <Label htmlFor={`payment-${loan.id}`}>
              {isLent ? "Amount Received" : "Amount Sent"}
            </Label>
            <Input
              id={`payment-${loan.id}`}
              name="amountPaid"
              type="number"
              min="0.01"
              step="0.01"
              value={amount ?? ""}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm">
            <span className="text-muted-foreground">Remaining balance</span>
            <span className="font-medium tabular-nums">
              {formatCurrency(loan.remainingBalance)}
            </span>
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}