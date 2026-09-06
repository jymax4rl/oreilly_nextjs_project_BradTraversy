import OpsShell from "@/components/ops/OpsShell";
import OpsMessagesPanel from "@/components/ops/OpsMessagesPanel";

export const metadata = {
  title: "Messages",
};

export default function OpsMessagesPage() {
  return (
    <OpsShell>
      <OpsMessagesPanel />
    </OpsShell>
  );
}
