import OpsShell from "@/components/ops/OpsShell";
import OpsUsersPanel from "@/components/ops/OpsUsersPanel";

export const metadata = {
  title: "Users",
};

export default function OpsUsersPage() {
  return (
    <OpsShell>
      <OpsUsersPanel />
    </OpsShell>
  );
}
