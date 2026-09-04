import { Suspense } from "react";
import OpsShell from "@/components/ops/OpsShell";
import OpsReservationsPanel from "@/components/ops/OpsReservationsPanel";

export const metadata = {
  title: "Reservations",
};

export default function OpsReservationsPage() {
  return (
    <OpsShell>
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-gray-900" />
          </div>
        }
      >
        <OpsReservationsPanel />
      </Suspense>
    </OpsShell>
  );
}
