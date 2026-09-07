import OpsShell from "@/components/ops/OpsShell";
import OpsMarketingSubnav from "@/components/ops/OpsMarketingSubnav";
import InvestorLeadsPanel from "@/components/ops/investors/InvestorLeadsPanel";

export const metadata = {
  title: "Investor Proposals",
};

export default function OpsInvestorLeadsPage() {
  return (
    <OpsShell
      wide
      title="Investor proposals"
      subtitle="Inbound proposals from /investors — emailed to contact@isisel.com."
    >
      <OpsMarketingSubnav />
      <InvestorLeadsPanel />
    </OpsShell>
  );
}
