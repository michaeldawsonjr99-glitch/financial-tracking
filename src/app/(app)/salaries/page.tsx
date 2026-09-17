import { getSalaries } from "@/lib/data";
import { Salaries } from "@/components/salaries/salaries";
import type { SalaryDto } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SalariesPage() {
  const salaryRecords = await getSalaries();

  const dto: SalaryDto[] = salaryRecords.map((salary) => ({
    id: salary.id,
    amount: salary.amount.toNumber(),
    payPeriod: salary.payPeriod,
    dateReceived: salary.dateReceived.toISOString(),
  }));

  return <Salaries salaries={dto} />;
}