import OpsShell from "@/components/ops/OpsShell";
import OpsAnalyticsPanel from "@/components/ops/analytics/OpsAnalyticsPanel";

export const metadata = {
  title: "Analytics",
};

export default function OpsAnalyticsPage() {
  return (
    <OpsShell
      title="Analytics"
      subtitle="Platform traction from live records — UTC, defensible for investors."
      wide
    >
      <OpsAnalyticsPanel />
    </OpsShell>
  );
}
