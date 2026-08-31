import OpsShell from "@/components/ops/OpsShell";
import AdminHostsPanel from "@/components/admin/AdminHostsPanel";

export const metadata = {
  title: "Hosts",
};

export default function OpsHostsPage() {
  return (
    <OpsShell>
      <AdminHostsPanel />
    </OpsShell>
  );
}
