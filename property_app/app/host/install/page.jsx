import { Suspense } from "react";
import HostInstallClient from "./HostInstallClient";

export const metadata = {
  title: "Install Isisel",
  description:
    "Add Isisel to your home screen so hosting feels like a native app.",
};

export default function HostInstallPage() {
  return (
    <Suspense
      fallback={
        <section className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--kama-accent)] border-t-transparent" />
        </section>
      }
    >
      <HostInstallClient />
    </Suspense>
  );
}
