import OpsShell from "@/components/ops/OpsShell";
import OpsMarketingSubnav from "@/components/ops/OpsMarketingSubnav";
import CreatorLeadsPanel from "@/components/ops/creators/CreatorLeadsPanel";

export const metadata = {
  title: "Creator Leads",
};

export default function OpsCreatorLeadsPage() {
  return (
    <OpsShell
      wide
      title="Creator / Influencer Leads"
      subtitle="Partnership conversations from /influencers — separate from host acquisition."
    >
      <OpsMarketingSubnav />
      <CreatorLeadsPanel />
    </OpsShell>
  );
}
