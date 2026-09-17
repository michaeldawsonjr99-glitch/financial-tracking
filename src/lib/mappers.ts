import type { SalaryModel } from "@/generated/prisma/models/Salary";
import type { BillModel } from "@/generated/prisma/models/Bill";
import type { ShoppingLoanGetPayload } from "@/generated/prisma/models/ShoppingLoan";
import type { PersonalLoanGetPayload } from "@/generated/prisma/models/PersonalLoan";
import type { PaymentLogGetPayload } from "@/generated/prisma/models/PaymentLog";
import type {
  BillDto,
  PaymentLogDto,
  PaymentLogStatusKind,
  PersonalLoanDto,
  SalaryDto,
  ShoppingLoanDto,
} from "@/lib/types";

export type { SalaryModel, BillModel };

export type ShoppingLoanWithLogs = ShoppingLoanGetPayload<{
  include: { paymentLogs: true };
}>;
export type PersonalLoanWithLogs = PersonalLoanGetPayload<{
  include: { paymentLogs: true };
}>;
export type PaymentLogWithRelations = PaymentLogGetPayload<{
  include: { bill: true; shoppingLoan: true; personalLoan: true };
}>;

export function toSalaryDto(salary: SalaryModel): SalaryDto {
  return {
    id: salary.id,
    amount: salary.amount.toNumber(),
    payPeriod: salary.payPeriod,
    dateReceived: salary.dateReceived.toISOString(),
  };
}

export function toBillDto(bill: BillModel): BillDto {
  return {
    id: bill.id,
    title: bill.title,
    amount: bill.amount.toNumber(),
    dueDate: bill.dueDate.toISOString(),
    status: bill.status,
  };
}

export function toShoppingLoanDto(loan: ShoppingLoanWithLogs): ShoppingLoanDto {
  const paidAmount = loan.paymentLogs.reduce(
    (sum, log) => sum + log.amountPaid.toNumber(),
    0
  );

  return {
    id: loan.id,
    itemName: loan.itemName,
    totalAmount: loan.totalAmount.toNumber(),
    interestPercentage: loan.interestPercentage,
    tenureMonths: loan.tenureMonths,
    monthlyInstallment: loan.monthlyInstallment.toNumber(),
    remainingBalance: loan.remainingBalance.toNumber(),
    paidAmount,
    dueDay: loan.dueDay,
    startDate: loan.startDate ? loan.startDate.toISOString() : null,
    createdAt: loan.createdAt.toISOString(),
  };
}

export function toPersonalLoanDto(loan: PersonalLoanWithLogs): PersonalLoanDto {
  const paidAmount = loan.paymentLogs.reduce(
    (sum, log) => sum + log.amountPaid.toNumber(),
    0
  );

  return {
    id: loan.id,
    personName: loan.personName,
    email: loan.email,
    amount: loan.amount.toNumber(),
    type: loan.type,
    status: loan.status,
    tenureMonths: loan.tenureMonths,
    monthlyPayment: loan.monthlyPayment.toNumber(),
    isPartialAllowed: loan.isPartialAllowed,
    notes: loan.notes,
    dueDay: loan.dueDay,
    startDate: loan.startDate ? loan.startDate.toISOString() : null,
    dueDate: loan.dueDate ? loan.dueDate.toISOString() : null,
    createdAt: loan.createdAt.toISOString(),
    paidAmount,
    remainingBalance: Math.max(0, loan.amount.toNumber() - paidAmount),
  };
}

export function toPaymentLogDto(log: PaymentLogWithRelations): PaymentLogDto {
  if (log.bill) {
    return {
      id: log.id,
      amount: log.amountPaid.toNumber(),
      date: log.paymentDate.toISOString(),
      category: "BILL",
      title: log.bill.title,
      statusLabel: log.bill.status,
      statusKind: log.bill.status === "PAID" ? "paid" : "pending",
    };
  }

  if (log.shoppingLoan) {
    const isPaidOff = log.shoppingLoan.remainingBalance.toNumber() <= 0;
    return {
      id: log.id,
      amount: log.amountPaid.toNumber(),
      date: log.paymentDate.toISOString(),
      category: "SHOPPING",
      title: log.shoppingLoan.itemName,
      statusLabel: isPaidOff ? "PAID OFF" : "ACTIVE",
      statusKind: isPaidOff ? "paid" : "active",
    };
  }

  const loan = log.personalLoan;
  const kind: PaymentLogStatusKind =
    loan?.status === "FULLY_PAID"
      ? "paid"
      : loan?.status === "PARTIALLY_PAID"
        ? "active"
        : "pending";

  return {
    id: log.id,
    amount: log.amountPaid.toNumber(),
    date: log.paymentDate.toISOString(),
    category: "PERSONAL",
    title: loan?.personName ?? "Personal Loan",
    statusLabel: loan?.status ?? "UNKNOWN",
    statusKind: kind,
  };
}
