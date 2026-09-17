import { getShoppingLoans } from "@/lib/data";
import { ShoppingLoans } from "@/components/loans/shopping-loans";
import { toShoppingLoanDto } from "@/lib/mappers";

export const dynamic = "force-dynamic";

export default async function ShoppingLoansPage() {
  const loans = await getShoppingLoans();

  return <ShoppingLoans loans={loans.map(toShoppingLoanDto)} />;
}
