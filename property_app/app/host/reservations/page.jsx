import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/utils/authOptions";
import HostPropertyBookings from "@/components/bookings/HostPropertyBookings";
import HostPageHeader from "@/components/host/HostPageHeader";

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
      <HostPageHeader
        titleKey="hostConsole.reservationsTitle"
        blurbKey="hostConsole.reservationsBlurb"
      />

      <HostPropertyBookings mode="all" />
    </div>
  );
}
