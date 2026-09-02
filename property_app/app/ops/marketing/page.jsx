import OpsShell from "@/components/ops/OpsShell";
import OpsMarketingPanel from "@/components/ops/OpsMarketingPanel";

export const metadata = {
  title: "Marketing",
};

export default function OpsMarketingPage() {
  return (
    <OpsShell
      variant="marketing"
      title="Marketing"
      subtitle="One-to-one outreach for the isisel.com launch: founding hosts, travel creators, and the people who already own the homes travelers want."
    >
      <OpsMarketingPanel />
    </OpsShell>
  );
}
