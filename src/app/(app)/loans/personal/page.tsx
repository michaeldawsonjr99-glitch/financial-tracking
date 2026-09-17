import { getCurrentUserEmail, getPersonalLoans } from "@/lib/data";
import { PersonalLoans } from "@/components/loans/personal-loans";
import { toPersonalLoanDto } from "@/lib/mappers";

export const dynamic = "force-dynamic";

export default async function PersonalLoansPage() {
  const [loans, currentUserEmail] = await Promise.all([
    getPersonalLoans(),
    getCurrentUserEmail(),
  ]);

  return (
    <PersonalLoans
      loans={loans.map(toPersonalLoanDto)}
      currentUserEmail={currentUserEmail}
    />
  );
}
