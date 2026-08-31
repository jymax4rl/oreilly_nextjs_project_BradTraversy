import { Suspense } from "react";
import PoliciesShell from "@/components/legal/PoliciesShell";

export const metadata = {
  title: "Policies | Kama Properties",
  description:
    "Guest and host policies, payments, privacy overview, and terms for Kama Properties.",
};

function PoliciesFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-[var(--kama-canvas)]">
      <div className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--kama-accent)] border-t-transparent" />
    </div>
  );
}

export default function PoliciesPage() {
  return (
    <Suspense fallback={<PoliciesFallback />}>
      <PoliciesShell />
    </Suspense>
  );
}
