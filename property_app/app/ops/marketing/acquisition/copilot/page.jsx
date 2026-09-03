import { Suspense } from "react";
import OpsShell from "@/components/ops/OpsShell";
import SalesCopilot from "@/components/ops/acquisition/copilot/SalesCopilot";

export const metadata = {
  title: "Sales Copilot",
};

export default function OpsSalesCopilotPage() {
  return (
    <OpsShell wide copilot>
      <Suspense fallback={<p className="p-6 text-sm text-[#6b6b6b]">Opening copilot…</p>}>
        <SalesCopilot />
      </Suspense>
    </OpsShell>
  );
}
