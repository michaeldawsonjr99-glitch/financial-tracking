"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Pencil, Plus } from "lucide-react";

import { createBill, updateBill } from "@/app/actions";
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
import type { BillDto, BillStatusKey } from "@/lib/types";

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : editing ? "Save Changes" : "Add Bill"}
    </Button>
  );
}

export function BillDialog({ bill }: { bill?: BillDto }) {
  const editing = Boolean(bill);
  const [open, setOpen] = useState(false);

  const [title, setTitle] = useState<string>(bill?.title ?? "");
  const [amount, setAmount] = useState<string>(bill ? String(bill.amount) : "");
  const [dueDate, setDueDate] = useState<string>(
    bill ? bill.dueDate.slice(0, 10) : ""
  );
  const [status, setStatus] = useState<BillStatusKey>(bill?.status ?? "PENDING");

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next && bill) {
      setTitle(bill.title);
      setAmount(String(bill.amount));
      setDueDate(bill.dueDate.slice(0, 10));
      setStatus(bill.status);
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
              aria-label={bill ? `Edit ${bill.title}` : "Edit bill"}
            >
              <Pencil />
            </Button>
          ) : (
            <Button>
              <Plus />
              Add Bill
            </Button>
          )
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Bill" : "Add Bill"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the bill details or mark it paid."
              : "Add a bill to track."}
          </DialogDescription>
        </DialogHeader>

        <form
          action={editing ? updateBill : createBill}
          onSubmit={() => setOpen(false)}
          className="grid gap-4"
        >
          {editing && bill && <input type="hidden" name="id" value={bill.id} />}

          <div className="grid gap-2">
            <Label htmlFor="title">Bill Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g. Rent"
              value={title ?? ""}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="amount">Amount</Label>
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
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              name="dueDate"
              type="date"
              value={dueDate ?? ""}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              value={status ?? "PENDING"}
              onChange={(e) => setStatus(e.target.value as BillStatusKey)}
              className="flex h-8 w-full rounded-lg border border-input bg-popover px-2.5 text-sm text-popover-foreground outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              required
            >
              <option value="PENDING" className="bg-popover text-popover-foreground">
                Pending
              </option>
              <option value="PAID" className="bg-popover text-popover-foreground">
                Paid
              </option>
            </select>
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