"use client";

import { useEffect, useState } from "react";
import { cn } from "cn";
import { CalendarClock, CheckCircle2, AlertTriangle, Clock3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";

export type DueBadgeKind = "paid" | "days-left" | "due-today" | "overdue" | "none";

type DueBadgeState = {
  kind: DueBadgeKind;
  label: string;
};

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getNextDueDate(dueDay: number, now = new Date()): Date {
  const day = Math.max(
    1,
    Math.min(dueDay, daysInMonth(now.getFullYear(), now.getMonth()))
  );
  return new Date(now.getFullYear(), now.getMonth(), day);
}

export function getScheduledDueDate(
  dueDay: number,
  startDate: Date,
  now = new Date()
): Date {
  const today = startOfDay(now);
  const startYear = startDate.getFullYear();
  const startMonth = startDate.getMonth();
  const hasStarted =
    today.getFullYear() > startYear ||
    (today.getFullYear() === startYear && today.getMonth() >= startMonth);

  if (!hasStarted) {
    return new Date(
      startYear,
      startMonth,
      Math.min(dueDay, daysInMonth(startYear, startMonth))
    );
  }

  return new Date(
    today.getFullYear(),
    today.getMonth(),
    Math.min(dueDay, daysInMonth(today.getFullYear(), today.getMonth()))
  );
}

export function getDueBadgeState(
  target: Date,
  isPaid: boolean,
  now = new Date(),
  paidLabel = "Paid off"
): DueBadgeState {
  if (isPaid) {
    return { kind: "paid", label: paidLabel };
  }

  const due = startOfDay(target);
  const today = startOfDay(now);
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000);

  if (diffDays === 0) {
    return { kind: "due-today", label: "Due Today" };
  }

  if (diffDays < 0) {
    const days = Math.abs(diffDays);
    return { kind: "overdue", label: `Overdue by ${days}d` };
  }

  return {
    kind: "days-left",
    label: `${diffDays} day${diffDays === 1 ? "" : "s"} left`,
  };
}

const STYLES: Record<DueBadgeKind, string> = {
  paid: "bg-emerald-500/12 text-emerald-600 ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-400 dark:ring-emerald-400/20",
  "days-left":
    "bg-sky-500/12 text-sky-600 ring-sky-600/20 dark:bg-sky-400/10 dark:text-sky-400 dark:ring-sky-400/20",
  "due-today":
    "bg-amber-500/12 text-amber-600 ring-amber-600/30 dark:bg-amber-400/10 dark:text-amber-400 dark:ring-amber-400/20",
  overdue:
    "bg-rose-500/12 text-rose-600 ring-rose-600/25 dark:bg-rose-400/10 dark:text-rose-400 dark:ring-rose-400/25",
  none: "bg-muted text-muted-foreground",
};

const ICONS: Record<DueBadgeKind, typeof Clock3> = {
  paid: CheckCircle2,
  "days-left": CalendarClock,
  "due-today": Clock3,
  overdue: AlertTriangle,
  none: Clock3,
};

export function DueBadge({
  dueDay,
  dueDate,
  startDate,
  isPaid = false,
  paidLabel = "Paid off",
  className,
}: {
  dueDay?: number;
  dueDate?: string | Date;
  startDate?: string | Date;
  isPaid?: boolean;
  paidLabel?: string;
  className?: string;
}) {
  const resolve = () => {
    if (dueDate) return new Date(dueDate);
    if (typeof dueDay === "number") {
      if (startDate) return getScheduledDueDate(dueDay, new Date(startDate));
      return getNextDueDate(dueDay);
    }
    return null;
  };

  const [state, setState] = useState<DueBadgeState>(() => {
    const target = resolve();
    if (!target) return { kind: "none", label: "" };
    return getDueBadgeState(target, isPaid, new Date(), paidLabel);
  });

  useEffect(() => {
    const update = () => {
      const target = resolve();
      if (!target) {
        setState({ kind: "none", label: "" });
        return;
      }
      setState(getDueBadgeState(target, isPaid, new Date(), paidLabel));
    };

    update();
    const timer = setInterval(update, 60_000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dueDay, dueDate, startDate, isPaid, paidLabel]);

  if (state.kind === "none") {
    return null;
  }

  const Icon = ICONS[state.kind];

  return (
    <Badge className={cn("font-medium", STYLES[state.kind], className)}>
      <Icon />
      {state.label}
    </Badge>
  );
}
