import { getBills } from "@/lib/data";
import { Bills } from "@/components/bills/bills";
import type { BillDto } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function BillsPage() {
  const bills = await getBills();

  const dto: BillDto[] = bills.map((bill) => ({
    id: bill.id,
    title: bill.title,
    amount: bill.amount.toNumber(),
    dueDate: bill.dueDate.toISOString(),
    status: bill.status,
  }));

  return <Bills bills={dto} />;
}