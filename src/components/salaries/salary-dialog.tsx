"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Pencil, Plus } from "lucide-react";

import { createSalary, updateSalary } from "@/app/actions";
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
import type { SalaryDto } from "@/lib/types";

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : editing ? "Save Changes" : "Add Salary"}
    </Button>
  );
}

export function SalaryDialog({ salary }: { salary?: SalaryDto }) {
  const editing = Boolean(salary);
  const [open, setOpen] = useState(false);

  const [amount, setAmount] = useState<string>(salary ? String(salary.amount) : "");
  const [dateReceived, setDateReceived] = useState<string>(
    salary ? salary.dateReceived.slice(0, 7) : currentMonth()
  );

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next && salary) {
      setAmount(String(salary.amount));
      setDateReceived(salary.dateReceived.slice(0, 7));
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          editing ? (
            <Button
              variant="ghost"
              size="icon"
              aria-label={salary ? `Edit ${salary.amount}` : "Edit salary"}
            >
              <Pencil />
            </Button>
          ) : (
            <Button>
              <Plus />
              Add Salary
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Monthly Income" : "Add Monthly Income"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update your monthly income entry."
              : "Record one income entry per month."}
          </DialogDescription>
        </DialogHeader>

        <form
          action={editing ? updateSalary : createSalary}
          onSubmit={() => setOpen(false)}
          className="grid gap-4"
        >
          {editing && salary && <input type="hidden" name="id" value={salary.id} />}

          <div className="grid gap-2">
            <Label htmlFor="amount">Monthly Amount</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              value={amount ?? ""}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="dateReceived">Month</Label>
            <Input
              id="dateReceived"
              name="dateReceived"
              type="month"
              value={dateReceived ?? ""}
              onChange={(e) => setDateReceived(e.target.value)}
              required
            />
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <SubmitButton editing={editing} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
