import OpsShell from "@/components/ops/OpsShell";
import AdminTransactionsPanel from "@/components/admin/AdminTransactionsPanel";

export const metadata = {
  title: "Transactions",
};

export default function OpsTransactionsPage() {
  return (
    <OpsShell>
      <AdminTransactionsPanel />
    </OpsShell>
  );
}
