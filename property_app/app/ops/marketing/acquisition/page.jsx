import OpsShell from "@/components/ops/OpsShell";
import OpsAcquisitionPanel from "@/components/ops/acquisition/OpsAcquisitionPanel";

export const metadata = {
  title: "Host Acquisition",
};

export default function OpsHostAcquisitionPage() {
  return (
    <OpsShell
      wide
      title="Host Acquisition"
      subtitle="The war room for turning owners into Isisel hosts."
    >
      <OpsAcquisitionPanel />
    </OpsShell>
  );
}
