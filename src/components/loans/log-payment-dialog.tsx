"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { CreditCard } from "lucide-react";

import { logShoppingLoanPayment } from "@/app/actions";
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
import type { ShoppingLoanDto } from "@/lib/types";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : "Log Payment"}
    </Button>
  );
}

export function LogPaymentDialog({ loan }: { loan: ShoppingLoanDto }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <CreditCard />
            Log Payment
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log Payment</DialogTitle>
          <DialogDescription>
            Record a payment for {loan.itemName}.
          </DialogDescription>
        </DialogHeader>

        <form
          action={logShoppingLoanPayment}
          onSubmit={() => setOpen(false)}
          className="grid gap-4"
        >
          <input type="hidden" name="loanId" value={loan.id} />

          <div className="grid gap-2">
            <Label htmlFor={`amount-${loan.id}`}>Amount Paid</Label>
            <Input
              id={`amount-${loan.id}`}
              name="amountPaid"
              type="number"
              min="0.01"
              step="0.01"
              defaultValue={loan.monthlyInstallment}
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