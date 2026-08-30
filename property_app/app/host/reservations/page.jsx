import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/utils/authOptions";
import HostPropertyBookings from "@/components/bookings/HostPropertyBookings";
import { ArrowLeft, CalendarCheck } from "lucide-react";

export const metadata = {
  title: "Manage Reservations | Kama Properties",
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
    <div className="min-h-screen bg-slate-50 px-4 pb-16 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/properties/my-listings"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-[#1b5c57]"
        >
          <ArrowLeft size={16} aria-hidden />
          My listings
        </Link>

        <div className="mb-8 flex items-start gap-3">
          <CalendarCheck
            className="mt-1 h-8 w-8 shrink-0 text-[#1b5c57]"
            aria-hidden
          />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Manage reservations
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Resend confirmations, change dates, or cancel bookings for your
              properties.
            </p>
          </div>
        </div>

        <HostPropertyBookings mode="all" title="All reservations" />
      </div>
    </div>
  );
}
