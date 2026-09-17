"use client";

import { useMemo, useState } from "react";
import { Plus, Sparkles } from "lucide-react";

import { createShoppingLoan } from "@/app/actions";
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
import { formatCurrency, getDefaultStartMonth } from "@/lib/format";
import { cn } from "cn";

const TERMS = [1, 3, 6, 12];
const DAYS = Array.from({ length: 31 }, (_, index) => index + 1);

export function AddShoppingLoanDialog() {
  const [open, setOpen] = useState(false);
  const [itemName, setItemName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [interestPercentage, setInterestPercentage] = useState("");
  const [tenureMonths, setTenureMonths] = useState(3);
  const [dueDay, setDueDay] = useState(15);
  const [startDate, setStartDate] = useState(() => getDefaultStartMonth(15));

  const monthlyPayment = useMemo(() => {
    const total = Number(totalAmount);
    const interest = Number(interestPercentage || 0);
    if (!Number.isFinite(total) || total <= 0) return null;
    if (!Number.isFinite(interest) || interest < 0) return null;
    return (total * (1 + interest / 100)) / tenureMonths;
  }, [totalAmount, interestPercentage, tenureMonths]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setItemName("");
      setTotalAmount("");
      setInterestPercentage("");
      setTenureMonths(3);
      setDueDay(15);
      setStartDate(getDefaultStartMonth(15));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>
        <Plus />
        Add Loan
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Shopping Loan</DialogTitle>
          <DialogDescription>
            Track a new shop-now-pay-later installment (e.g., SPayLater,
            LazPayLater).
          </DialogDescription>
        </DialogHeader>

        <form
          action={createShoppingLoan}
          onSubmit={() => {
            setOpen(false);
          }}
          className="grid gap-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="itemName">Item Name</Label>
            <Input
              id="itemName"
              name="itemName"
              placeholder="e.g. New Laptop"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="totalAmount">Total Principal</Label>
              <Input
                id="totalAmount"
                name="totalAmount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="interestPercentage">Interest Rate (%)</Label>
              <Input
                id="interestPercentage"
                name="interestPercentage"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                value={interestPercentage}
                onChange={(e) => setInterestPercentage(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Months Term</Label>
            <input type="hidden" name="tenureMonths" value={tenureMonths} />
            <div className="grid grid-cols-4 gap-1.5 rounded-lg bg-muted p-1">
              {TERMS.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setTenureMonths(term)}
                  className={cn(
                    "h-8 rounded-md text-sm font-medium transition-all",
                    tenureMonths === term
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-pressed={tenureMonths === term}
                >
                  {term} {term === 1 ? "mo" : "mos"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dueDay">Day of Month Due</Label>
            <select
              id="dueDay"
              name="dueDay"
              value={dueDay}
              onChange={(e) => setDueDay(Number(e.target.value))}
              className="flex h-8 w-full rounded-lg border border-input bg-popover px-2.5 text-sm text-popover-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              required
            >
              {DAYS.map((day) => (
                <option
                  key={day}
                  value={day}
                  className="bg-popover text-popover-foreground"
                >
                  Day {day}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="startDate">Start Billing Month</Label>
            <Input
              id="startDate"
              name="startDate"
              type="month"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              First month your billing begins.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-xl border bg-primary/5 px-3 py-2.5 text-sm ring-1 ring-primary/10">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Sparkles className="size-4 text-primary" />
              Estimated monthly payment
            </span>
            <span className="font-semibold tabular-nums">
              {monthlyPayment !== null
                ? formatCurrency(monthlyPayment)
                : "—"}
            </span>
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit">Save Loan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}