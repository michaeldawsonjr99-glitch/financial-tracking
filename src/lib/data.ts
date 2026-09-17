import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export async function getCurrentUser() {
  return prisma.user.findFirst({
    include: {
      salaries: true,
      bills: true,
      shoppingLoans: { include: { paymentLogs: true } },
      personalLoans: { include: { paymentLogs: true } },
    },
  });
}

export async function getCurrentUserId() {
  const user = await prisma.user.findFirst({ select: { id: true } });
  return user?.id ?? null;
}

export async function getCurrentUserEmail() {
  const user = await prisma.user.findFirst({ select: { email: true } });
  return user?.email ?? "";
}

export async function getShoppingLoans() {
  const user = await prisma.user.findFirst();
  if (!user) return [];

  return prisma.shoppingLoan.findMany({
    where: { userId: user.id },
    include: { paymentLogs: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getPersonalLoans() {
  const user = await prisma.user.findFirst();
  if (!user) return [];

  return prisma.personalLoan.findMany({
    where: { userId: user.id },
    include: { paymentLogs: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getSalaries() {
  const user = await prisma.user.findFirst();
  if (!user) return [];

  return prisma.salary.findMany({
    where: { userId: user.id },
    orderBy: [{ dateReceived: "asc" }, { createdAt: "asc" }],
  });
}

export async function getBills() {
  const user = await prisma.user.findFirst();
  if (!user) return [];

  return prisma.bill.findMany({
    where: { userId: user.id },
    orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }],
  });
}

export type PaymentLogRange = "month" | "30d" | "all";

export async function getPaymentLogs(range: PaymentLogRange) {
  const user = await prisma.user.findFirst();
  if (!user) return [];

  const now = new Date();
  const where: Prisma.PaymentLogWhereInput = {
    OR: [
      { bill: { userId: user.id } },
      { shoppingLoan: { userId: user.id } },
      { personalLoan: { userId: user.id } },
    ],
  };

  if (range === "month") {
    where.paymentDate = {
      gte: new Date(now.getFullYear(), now.getMonth(), 1),
    };
  } else if (range === "30d") {
    where.paymentDate = {
      gte: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30),
    };
  }

  return prisma.paymentLog.findMany({
    where,
    include: { bill: true, shoppingLoan: true, personalLoan: true },
    orderBy: { paymentDate: "desc" },
  });
}
