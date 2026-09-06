import OpsShell from "@/components/ops/OpsShell";
import OpsFoundingHostsPanel from "@/components/ops/foundingHosts/OpsFoundingHostsPanel";

export const metadata = {
  title: "Founding Hosts",
};

export default function OpsFoundingHostsPage() {
  return (
    <OpsShell
      title="Founding Hosts"
      subtitle="The first hosts building Isisel with us — commission-free recognition, assigned at host approval."
      wide
    >
      <OpsFoundingHostsPanel />
    </OpsShell>
  );
}
