import OpsShell from "@/components/ops/OpsShell";
import AdminListingsPanel from "@/components/admin/AdminListingsPanel";

export const metadata = {
  title: "Listings",
};

export default function OpsListingsPage() {
  return (
    <OpsShell>
      <AdminListingsPanel />
    </OpsShell>
  );
}
