"use client";

import { useMemo, useState } from "react";
import { HandCoins, Mail, Plus } from "lucide-react";
import { cn } from "cn";

import { createPersonalLoan } from "@/app/actions";
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
import type { PersonalLoanTypeKey } from "@/lib/types";

const TERMS = [1, 3, 6, 12];
const DAYS = Array.from({ length: 31 }, (_, index) => index + 1);

const TYPE_OPTIONS: { key: PersonalLoanTypeKey; label: string }[] = [
  { key: "LENT", label: "I Lent Money" },
  { key: "BORROWED", label: "I Borrowed Money" },
];

export function AddPersonalLoanDialog({
  currentUserEmail = "",
}: {
  currentUserEmail?: string;
}) {
  const [open, setOpen] = useState(false);
  const [personName, setPersonName] = useState("");
  const [type, setType] = useState<PersonalLoanTypeKey>("LENT");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [tenureMonths, setTenureMonths] = useState(3);
  const [dueDay, setDueDay] = useState(15);
  const [startDate, setStartDate] = useState(() => getDefaultStartMonth(15));
  const [isPartialAllowed, setIsPartialAllowed] = useState(true);

  const isBorrowed = type === "BORROWED";
  const resolvedEmail = isBorrowed ? currentUserEmail : email;

  const monthlyPayment = useMemo(() => {
    const total = Number(amount);
    if (!Number.isFinite(total) || total <= 0) return null;
    return total / tenureMonths;
  }, [amount, tenureMonths]);

  const handleTypeChange = (next: PersonalLoanTypeKey) => {
    setType(next);
    if (next === "BORROWED") {
      setEmail(currentUserEmail);
    }
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setPersonName("");
      setType("LENT");
      setEmail("");
      setAmount("");
      setTenureMonths(3);
      setDueDay(15);
      setStartDate(getDefaultStartMonth(15));
      setIsPartialAllowed(true);
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
          <DialogTitle>Add Personal Loan</DialogTitle>
          <DialogDescription>
            Record money you lent to someone or borrowed from someone.
          </DialogDescription>
        </DialogHeader>

        <form
          action={createPersonalLoan}
          onSubmit={() => setOpen(false)}
          className="grid gap-4"
        >
          <div className="grid gap-2">
            <Label htmlFor="personName">Person Name</Label>
            <Input
              id="personName"
              name="personName"
              placeholder="e.g. Joana"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label>Type</Label>
            <input type="hidden" name="type" value={type} />
            <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-muted p-1">
              {TYPE_OPTIONS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => handleTypeChange(option.key)}
                  className={cn(
                    "h-8 rounded-md px-2 text-sm font-medium transition-all",
                    type === option.key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-pressed={type === option.key}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">
              {isBorrowed ? "Your Email" : "Borrower's Email"}
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@example.com"
                className="pl-8"
                value={resolvedEmail}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isBorrowed}
                readOnly={isBorrowed}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {isBorrowed
                ? "Auto-filled from your signed-in account."
                : "Enter the borrower's email so they can be contacted."}
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="amount">Total Amount</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
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

          <label className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
            <input
              type="checkbox"
              name="isPartialAllowed"
              checked={isPartialAllowed}
              onChange={(e) => setIsPartialAllowed(e.target.checked)}
              className="size-4 rounded border-input accent-primary"
            />
            <span>
              Allow partial payments
              <span className="ml-1 text-xs text-muted-foreground">
                (borrower can pay in installments)
              </span>
            </span>
          </label>

          <div className="flex items-center justify-between rounded-xl border bg-primary/5 px-3 py-2.5 text-sm ring-1 ring-primary/10">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <HandCoins className="size-4 text-primary" />
              {isBorrowed ? "Monthly payable" : "Monthly receivable"}
            </span>
            <span className="font-semibold tabular-nums">
              {monthlyPayment !== null ? formatCurrency(monthlyPayment) : "—"}
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
