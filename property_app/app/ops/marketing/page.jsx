import OpsShell from "@/components/ops/OpsShell";
import OpsMarketingPanel from "@/components/ops/OpsMarketingPanel";
import OpsMarketingSubnav from "@/components/ops/OpsMarketingSubnav";

export const metadata = {
  title: "Marketing",
};

export default function OpsMarketingPage() {
  return (
    <OpsShell
      title="Marketing"
      subtitle="Name and email. Modify the letter, then open it in Gmail."
    >
      <OpsMarketingSubnav />
      <OpsMarketingPanel />
    </OpsShell>
  );
}
