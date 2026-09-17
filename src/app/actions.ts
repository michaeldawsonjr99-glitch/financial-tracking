"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { getCurrentUserEmail, getCurrentUserId } from "@/lib/data";
import type { SalaryPayPeriod } from "@/generated/prisma/client";

export async function setBillStatus(formData: FormData) {
  const billId = String(formData.get("billId") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!billId || (status !== "PENDING" && status !== "PAID")) {
    return;
  }

  const user = await prisma.user.findFirst();

  if (!user) {
    return;
  }

  const bill = await prisma.bill.findFirst({
    where: { id: billId, userId: user.id },
  });

  if (!bill || bill.status === status) {
    return;
  }

  await prisma.$transaction([
    prisma.paymentLog.deleteMany({ where: { billId } }),
    ...(status === "PAID"
      ? [
          prisma.paymentLog.create({
            data: {
              billId,
              amountPaid: bill.amount,
              paymentDate: new Date(),
            },
          }),
        ]
      : []),
    prisma.bill.updateMany({
      where: { id: billId, userId: user.id },
      data: { status },
    }),
  ]);

  revalidatePath("/");
  revalidatePath("/bills");
  revalidatePath("/history");
  revalidatePath("/analytics");
}

function parseBillForm(
  formData: FormData
): {
  title: string;
  amount: number;
  dueDate: Date;
  status: "PENDING" | "PAID";
} | null {
  const title = String(formData.get("title") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const dueDateRaw = String(formData.get("dueDate") ?? "").trim();
  const status = String(formData.get("status") ?? "");

  if (!title) return null;
  if (!Number.isFinite(amount) || amount <= 0) return null;
  if (!dueDateRaw) return null;
  if (status !== "PENDING" && status !== "PAID") return null;

  return {
    title,
    amount,
    dueDate: new Date(dueDateRaw),
    status,
  };
}

export async function createBill(formData: FormData) {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const values = parseBillForm(formData);
  if (!values) return;

  await prisma.bill.create({
    data: {
      userId,
      title: values.title,
      amount: values.amount,
      dueDate: values.dueDate,
      status: values.status,
    },
  });

  revalidatePath("/bills");
  revalidatePath("/");
}

export async function updateBill(formData: FormData) {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const id = String(formData.get("id") ?? "");
  const values = parseBillForm(formData);

  if (!id) return;
  if (!values) return;

  await prisma.bill.updateMany({
    where: { id, userId },
    data: {
      title: values.title,
      amount: values.amount,
      dueDate: values.dueDate,
      status: values.status,
    },
  });

  revalidatePath("/bills");
  revalidatePath("/");
}

export async function deleteBill(formData: FormData) {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.bill.deleteMany({ where: { id, userId } });

  revalidatePath("/bills");
  revalidatePath("/");
}

function parseStartDate(formData: FormData): Date | null {
  const raw = String(formData.get("startDate") ?? "").trim();
  if (!raw) return null;
  const match = raw.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return new Date(year, month - 1, 1);
}

export async function createShoppingLoan(formData: FormData) {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const itemName = String(formData.get("itemName") ?? "").trim();
  const totalAmount = Number(formData.get("totalAmount"));
  const interestPercentage = Number(formData.get("interestPercentage") ?? 0);
  const tenureMonths = Number(formData.get("tenureMonths"));
  const dueDay = Number(formData.get("dueDay"));
  const startDateInput = parseStartDate(formData) ?? new Date();

  if (!itemName) return;
  if (!Number.isFinite(totalAmount) || totalAmount <= 0) return;
  if (!Number.isFinite(interestPercentage) || interestPercentage < 0) return;
  if (![1, 3, 6, 12].includes(tenureMonths)) return;
  if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) return;

  const monthlyInstallment =
    (totalAmount * (1 + interestPercentage / 100)) / tenureMonths;

  await prisma.shoppingLoan.create({
    data: {
      userId,
      itemName,
      totalAmount,
      interestPercentage,
      tenureMonths,
      monthlyInstallment,
      remainingBalance: totalAmount,
      dueDay,
      startDate: new Date(startDateInput),
    },
  });

  revalidatePath("/loans/shopping");
  revalidatePath("/");
  revalidatePath("/analytics");
}

export async function deleteShoppingLoan(formData: FormData) {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const loan = await prisma.shoppingLoan.findFirst({
    where: { id, userId },
  });

  if (!loan) return;

  await prisma.$transaction([
    prisma.paymentLog.deleteMany({ where: { shoppingLoanId: id } }),
    prisma.shoppingLoan.delete({ where: { id } }),
  ]);

  revalidatePath("/loans/shopping");
  revalidatePath("/");
  revalidatePath("/analytics");
  revalidatePath("/history");
}

export async function logShoppingLoanPayment(formData: FormData) {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const loanId = String(formData.get("loanId") ?? "");
  const amountPaid = Number(formData.get("amountPaid"));

  if (!loanId) return;
  if (!Number.isFinite(amountPaid) || amountPaid <= 0) return;

  const loan = await prisma.shoppingLoan.findFirst({
    where: { id: loanId, userId },
  });

  if (!loan) return;

  const remainingBalance = Math.max(
    0,
    loan.remainingBalance.toNumber() - amountPaid
  );

  await prisma.$transaction([
    prisma.shoppingLoan.update({
      where: { id: loanId },
      data: { remainingBalance },
    }),
    prisma.paymentLog.create({
      data: {
        shoppingLoanId: loanId,
        amountPaid,
        paymentDate: new Date(),
      },
    }),
  ]);

  revalidatePath("/loans/shopping");
  revalidatePath("/");
  revalidatePath("/analytics");
}

export async function createPersonalLoan(formData: FormData) {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const personName = String(formData.get("personName") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const type = String(formData.get("type") ?? "");
  const rawEmail = String(formData.get("email") ?? "").trim();
  const tenureMonths = Number(formData.get("tenureMonths"));
  const dueDay = Number(formData.get("dueDay"));
  const startDate = parseStartDate(formData) ?? new Date();
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const isPartialAllowed = String(formData.get("isPartialAllowed") ?? "") === "on";

  if (!personName) return;
  if (!Number.isFinite(amount) || amount <= 0) return;
  if (type !== "LENT" && type !== "BORROWED") return;
  if (![1, 3, 6, 12].includes(tenureMonths)) return;
  if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) return;

  const email =
    type === "BORROWED"
      ? (await getCurrentUserEmail()) || rawEmail || null
      : rawEmail || null;

  const monthlyPayment = amount / tenureMonths;

  await prisma.personalLoan.create({
    data: {
      userId,
      personName,
      email,
      amount,
      type,
      status: "UNPAID",
      tenureMonths,
      monthlyPayment,
      isPartialAllowed,
      notes,
      dueDay,
      startDate,
    },
  });

  revalidatePath("/loans/personal");
  revalidatePath("/");
  revalidatePath("/analytics");
}

export async function logPersonalLoanPayment(formData: FormData) {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const loanId = String(formData.get("loanId") ?? "");
  const amountPaid = Number(formData.get("amountPaid"));

  if (!loanId) return;
  if (!Number.isFinite(amountPaid) || amountPaid <= 0) return;

  const loan = await prisma.personalLoan.findFirst({
    where: { id: loanId, userId },
    include: { paymentLogs: true },
  });

  if (!loan) return;

  const alreadyPaid = loan.paymentLogs.reduce(
    (sum, log) => sum + log.amountPaid.toNumber(),
    0
  );
  const totalAmount = loan.amount.toNumber();
  const newPaid = Math.min(alreadyPaid + amountPaid, totalAmount);
  const status = newPaid >= totalAmount ? "FULLY_PAID" : "PARTIALLY_PAID";

  await prisma.$transaction([
    prisma.paymentLog.create({
      data: {
        personalLoanId: loanId,
        amountPaid,
        paymentDate: new Date(),
      },
    }),
    prisma.personalLoan.update({
      where: { id: loanId },
      data: { status },
    }),
  ]);

  revalidatePath("/loans/personal");
  revalidatePath("/");
  revalidatePath("/analytics");
}

function parseSalaryForm(
  formData: FormData
): { amount: number; payPeriod: SalaryPayPeriod; dateReceived: Date } | null {
  const amount = Number(formData.get("amount"));
  const dateReceivedRaw = String(formData.get("dateReceived") ?? "").trim();

  if (!Number.isFinite(amount) || amount <= 0) return null;

  const dateReceived = dateReceivedRaw
    ? new Date(dateReceivedRaw)
    : new Date();

  return { amount, payPeriod: "MONTHLY", dateReceived };
}

export async function createSalary(formData: FormData) {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const values = parseSalaryForm(formData);
  if (!values) return;

  await prisma.salary.create({
    data: {
      userId,
      amount: values.amount,
      payPeriod: values.payPeriod,
      dateReceived: values.dateReceived,
    },
  });

  revalidatePath("/salaries");
  revalidatePath("/");
  revalidatePath("/analytics");
}

export async function updateSalary(formData: FormData) {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const id = String(formData.get("id") ?? "");
  const values = parseSalaryForm(formData);

  if (!id) return;
  if (!values) return;

  await prisma.salary.updateMany({
    where: { id, userId },
    data: {
      amount: values.amount,
      payPeriod: values.payPeriod,
      dateReceived: values.dateReceived,
    },
  });

  revalidatePath("/salaries");
  revalidatePath("/");
  revalidatePath("/analytics");
}

export async function deleteSalary(formData: FormData) {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.salary.deleteMany({ where: { id, userId } });

  revalidatePath("/salaries");
  revalidatePath("/");
  revalidatePath("/analytics");
}

export async function deletePaymentLog(formData: FormData) {
  const userId = await getCurrentUserId();
  if (!userId) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const log = await prisma.paymentLog.findFirst({
    where: {
      id,
      OR: [
        { bill: { userId } },
        { shoppingLoan: { userId } },
        { personalLoan: { userId } },
      ],
    },
  });

  if (!log) return;

  await prisma.paymentLog.delete({ where: { id } });

  revalidatePath("/history");
  revalidatePath("/analytics");
}