import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: "file:./dev.db",
});

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.paymentLog.deleteMany({});
  await prisma.bill.deleteMany({});
  await prisma.shoppingLoan.deleteMany({});
  await prisma.personalLoan.deleteMany({});
  await prisma.salary.deleteMany({});

  await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      name: "Demo User",
    },
  });

  const user = await prisma.user.findFirst({
    where: { email: "demo@example.com" },
  });

  if (user) {
    await prisma.salary.create({
      data: {
        userId: user.id,
        amount: 0,
        payPeriod: "MONTHLY",
        dateReceived: new Date(),
      },
    });

    console.log(
      `Seeded clean demo user (${user.email}, ${user.id}) with a MONTHLY salary entry. ` +
        `No bills, loans, or payment logs were created. ` +
        `Add your first records from the app.`
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
