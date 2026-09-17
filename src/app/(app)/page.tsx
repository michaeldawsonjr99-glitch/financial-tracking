import { getCurrentUser } from "@/lib/data";
import { Dashboard } from "@/components/dashboard/dashboard";
import {
  toBillDto,
  toPersonalLoanDto,
  toSalaryDto,
  toShoppingLoanDto,
} from "@/lib/mappers";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="flex flex-col gap-4 rounded-xl border bg-card p-8 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Financial Overview</h1>
        <p className="text-sm text-muted-foreground">
          No data yet. Run{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
            npm run db:seed
          </code>{" "}
          to seed a demo user, then add your income, bills, and loans.
        </p>
      </div>
    );
  }

  return (
    <Dashboard
      bills={user.bills.map(toBillDto)}
      salaries={user.salaries.map(toSalaryDto)}
      shoppingLoans={user.shoppingLoans.map(toShoppingLoanDto)}
      personalLoans={user.personalLoans.map(toPersonalLoanDto)}
    />
  );
}
