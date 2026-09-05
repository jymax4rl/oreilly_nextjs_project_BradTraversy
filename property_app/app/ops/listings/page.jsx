import { Suspense } from "react";
import OpsShell from "@/components/ops/OpsShell";
import AdminListingsPanel from "@/components/admin/AdminListingsPanel";

export const metadata = {
  title: "Listings",
};

export default function OpsListingsPage() {
  return (
    <OpsShell>
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-gray-900" />
          </div>
        }
      >
        <AdminListingsPanel />
      </Suspense>
    </OpsShell>
  );
}
