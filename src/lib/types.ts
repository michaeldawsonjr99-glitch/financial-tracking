export type BillStatusKey = "PENDING" | "PAID";

export type SalaryPayPeriodKey = "MONTHLY";

export type SalaryDto = {
  id: string;
  amount: number;
  payPeriod: SalaryPayPeriodKey;
  dateReceived: string;
};

export type BillDto = {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  status: BillStatusKey;
};

export type ShoppingLoanDto = {
  id: string;
  itemName: string;
  totalAmount: number;
  interestPercentage: number;
  tenureMonths: number;
  monthlyInstallment: number;
  remainingBalance: number;
  paidAmount: number;
  dueDay: number;
  startDate: string | null;
  createdAt: string;
};

export type PersonalLoanTypeKey = "LENT" | "BORROWED";
export type PersonalLoanStatusKey = "UNPAID" | "PARTIALLY_PAID" | "FULLY_PAID";

export type PersonalLoanDto = {
  id: string;
  personName: string;
  email: string | null;
  amount: number;
  type: PersonalLoanTypeKey;
  status: PersonalLoanStatusKey;
  tenureMonths: number;
  monthlyPayment: number;
  isPartialAllowed: boolean;
  notes: string | null;
  dueDay: number;
  startDate: string | null;
  dueDate: string | null;
  paidAmount: number;
  remainingBalance: number;
  createdAt: string;
};

export type PaymentLogRangeKey = "month" | "30d" | "all";
export type PaymentLogCategoryKey = "BILL" | "SHOPPING" | "PERSONAL";
export type PaymentLogStatusKind = "paid" | "active" | "pending";

export type PaymentLogDto = {
  id: string;
  amount: number;
  date: string;
  category: PaymentLogCategoryKey;
  title: string;
  statusLabel: string;
  statusKind: PaymentLogStatusKind;
};

export type DueStatus =
  | { kind: "paid"; label: string }
  | { kind: "days-left"; label: string; days: number }
  | { kind: "due-today"; label: string }
  | { kind: "overdue"; label: string; days: number }
  | { kind: "none"; label: string };
