export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);
}

export function formatDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
  });
}

export function formatYearMonth(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function getDefaultStartMonth(dueDay: number, now = new Date()) {
  const current = new Date(now.getFullYear(), now.getMonth(), 1);
  if (dueDay > now.getDate()) return formatYearMonth(current);
  return formatYearMonth(
    new Date(now.getFullYear(), now.getMonth() + 1, 1)
  );
}