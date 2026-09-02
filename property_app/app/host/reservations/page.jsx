import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/utils/authOptions";
import HostPropertyBookings from "@/components/bookings/HostPropertyBookings";

export const metadata = {
  title: "Manage Reservations | Isisel",
  description: "View and manage bookings across your listings",
  robots: { index: false, follow: false },
};

export default async function HostReservationsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(
      `/api/auth/signin?callbackUrl=${encodeURIComponent("/host/reservations")}`,
    );
  }

  if (session.user.hostStatus !== "verified") {
    redirect("/host/onboarding");
  }

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--kama-ink)]">
          Reservations
        </h1>
        <p className="mt-1 text-sm text-[var(--kama-ink-muted)]">
          Requests, confirmed stays, and cancellations across your listings.
        </p>
      </header>

      <HostPropertyBookings mode="all" title="All reservations" />
    </div>
  );
}
