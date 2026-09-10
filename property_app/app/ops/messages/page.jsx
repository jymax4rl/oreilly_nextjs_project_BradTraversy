import OpsShell from "@/components/ops/OpsShell";
import OpsMessagesPanel from "@/components/ops/OpsMessagesPanel";
import OpsBroadcastPanel from "@/components/ops/OpsBroadcastPanel";

export const metadata = {
  title: "Messages",
};

export default function OpsMessagesPage() {
  return (
    <OpsShell>
      <OpsBroadcastPanel />
      <OpsMessagesPanel />
    </OpsShell>
  );
}
